const { getDb } = require('../db/mongo');
const config = require('../config');
const { loadMarkdownAnswers } = require('./markdownAnswerLoader');
const { buildPrompt, callLlm, mergeAiIntoQuestion, sleep } = require('./aiAnswerService');

function needsEnrichment(q) {
  return !q.correctAnswers || q.correctAnswers.length === 0;
}

async function applyEnrichment(number, source, payload) {
  const db = getDb();
  const now = new Date();

  const update = {
    ...payload,
    updatedAt: now,
  };

  await db.collection('questions').updateOne(
    { number: Number(number), source },
    { $set: update },
  );

  return update;
}

/** Merge answers từ markdown tours (q1–36, verified) */
async function enrichFromMarkdown(options = {}) {
  const source = options.source || config.defaultSource;
  const map = await loadMarkdownAnswers(options.markdownDir);
  const db = getDb();

  let updated = 0;
  let skipped = 0;
  const results = [];

  for (const [number, payload] of map) {
    const existing = await db.collection('questions').findOne({ number, source });
    if (!existing) {
      skipped += 1;
      continue;
    }

    if (!options.force && !needsEnrichment(existing)) {
      skipped += 1;
      continue;
    }

    await applyEnrichment(number, source, {
      title: payload.title || existing.title,
      question: payload.question.en
        ? payload.question
        : { en: existing.question?.en || '', vi: payload.question?.vi || '' },
      options: payload.options.length ? payload.options : existing.options,
      correctAnswers: payload.correctAnswers,
      summaryNote: payload.summaryNote,
      questionType: payload.questionType,
      importStatus: payload.importStatus,
      enrichedBy: payload.enrichedBy,
      enrichedAt: new Date(),
    });

    updated += 1;
    results.push({ number, correctAnswers: payload.correctAnswers, from: 'markdown' });
  }

  return { updated, skipped, totalInMarkdown: map.size, results };
}

/** AI enrich N câu chưa có đáp án */
async function enrichWithAi(options = {}) {
  const source = options.source || config.defaultSource;
  const limit = options.limit ?? config.enrichBatchSize;
  const number = options.number;
  const dryRun = options.dryRun ?? false;
  const db = getDb();

  const filter = {
    source,
    $or: [{ correctAnswers: { $size: 0 } }, { correctAnswers: { $exists: false } }],
  };

  if (number) {
    delete filter.$or;
    filter.number = Number(number);
  }

  const questions = await db
    .collection('questions')
    .find(filter)
    .sort({ number: 1 })
    .limit(limit)
    .toArray();

  const results = [];
  let updated = 0;
  let failed = 0;

  for (const q of questions) {
    try {
      const prompt = buildPrompt(q);
      const ai = await callLlm(prompt);
      const merged = mergeAiIntoQuestion(q, ai);

      if (dryRun) {
        results.push({ number: q.number, dryRun: true, ...merged });
      } else {
        await applyEnrichment(q.number, source, merged);
        updated += 1;
        results.push({
          number: q.number,
          correctAnswers: merged.correctAnswers,
          from: 'ai',
        });
      }

      if (config.enrichDelayMs > 0) {
        await sleep(config.enrichDelayMs);
      }
    } catch (err) {
      failed += 1;
      results.push({ number: q.number, error: err.message });
    }
  }

  const remaining = await db.collection('questions').countDocuments(filter);

  return { processed: questions.length, updated, failed, remaining, results };
}

async function getEnrichStatus(source = config.defaultSource) {
  const db = getDb();
  const total = await db.collection('questions').countDocuments({ source });
  const withAnswer = await db.collection('questions').countDocuments({
    source,
    correctAnswers: { $exists: true, $not: { $size: 0 } },
  });
  const aiEnriched = await db.collection('questions').countDocuments({
    source,
    enrichedBy: 'openai',
  });
  const markdownEnriched = await db.collection('questions').countDocuments({
    source,
    enrichedBy: 'markdown',
  });

  return {
    source,
    total,
    withAnswer,
    withoutAnswer: total - withAnswer,
    aiEnriched,
    markdownEnriched,
  };
}

module.exports = {
  enrichFromMarkdown,
  enrichWithAi,
  getEnrichStatus,
  needsEnrichment,
};
