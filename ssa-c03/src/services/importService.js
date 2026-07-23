const path = require('path');
const { getDb } = require('../db/mongo');
const { getIterator, clearIterator } = require('./questionIterator');
const { toQuestionDocument } = require('./questionTransformer');
const config = require('../config');

function sourceFileKey(filePath) {
  return path.resolve(filePath);
}

async function getOrCreateJob(sourceFile) {
  const db = getDb();
  const key = sourceFileKey(sourceFile);
  let job = await db.collection('import_jobs').findOne({ sourceFile: key });

  if (job) return job;

  job = {
    sourceFile: key,
    format: null,
    totalQuestionsFound: 0,
    lastProcessedIndex: -1,
    lastProcessedNumber: 0,
    totalSaved: 0,
    totalFailed: 0,
    status: 'idle',
    errors: [],
    meta: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('import_jobs').insertOne(job);
  return job;
}

/**
 * Pipeline 1 câu: đọc raw → transform → lưu DB.
 */
async function processAndSaveOne(raw, context) {
  const db = getDb();
  const doc = toQuestionDocument(raw, context);
  const now = new Date();

  await db.collection('questions').updateOne(
    { number: doc.number, source: doc.source },
    {
      $set: { ...doc, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  return doc;
}

/**
 * Import count câu tiếp theo (mỗi câu: read → transform → save).
 */
async function importNext(sourceFile, options = {}) {
  const count = options.count ?? 1;
  const reset = options.reset ?? false;
  const db = getDb();
  const key = sourceFileKey(sourceFile);

  if (reset) {
    clearIterator(sourceFile);
    await db.collection('questions').deleteMany({ 'meta.sourceFile': key });
    await db.collection('import_jobs').updateOne(
      { sourceFile: key },
      {
        $set: {
          lastProcessedIndex: -1,
          lastProcessedNumber: 0,
          totalSaved: 0,
          totalFailed: 0,
          status: 'idle',
          errors: [],
          updatedAt: new Date(),
        },
      },
    );
  }

  let job = await getOrCreateJob(sourceFile);
  const iterator = await getIterator(sourceFile);

  if (job.lastProcessedIndex >= 0) {
    iterator.seek(job.lastProcessedIndex + 1);
  }

  if (job.status === 'completed' && !reset) {
    return {
      job,
      saved: 0,
      message: 'Import completed. Use reset=true to re-import.',
    };
  }

  await db.collection('import_jobs').updateOne(
    { sourceFile: key },
    {
      $set: {
        format: iterator.format,
        totalQuestionsFound: iterator.total,
        meta: iterator.meta,
        status: 'running',
        updatedAt: new Date(),
      },
    },
  );

  if (iterator.total === 0) {
    const hint = iterator.meta?.likelyScanned
      ? 'PDF appears scanned — no extractable text.'
      : 'No questions found in file.';

    await db.collection('import_jobs').updateOne(
      { sourceFile: key },
      { $set: { status: 'failed', errors: [hint], updatedAt: new Date() } },
    );

    return { job: await getOrCreateJob(sourceFile), saved: 0, message: hint };
  }

  const context = {
    sourceFile: key,
    source: config.defaultSource,
  };

  const processed = [];
  let saved = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < count && iterator.hasNext(); i++) {
    const raw = iterator.nextRaw();

    try {
      const doc = await processAndSaveOne(raw, context);
      saved += 1;
      processed.push({
        number: doc.number,
        source: doc.source,
        title: doc.title,
        importStatus: doc.importStatus,
      });

      await db.collection('import_jobs').updateOne(
        { sourceFile: key },
        {
          $set: {
            lastProcessedIndex: iterator.position - 1,
            lastProcessedNumber: doc.number,
            updatedAt: new Date(),
          },
          $inc: { totalSaved: 1 },
        },
      );
    } catch (err) {
      failed += 1;
      errors.push({ number: raw.number, error: err.message });
      await db.collection('import_jobs').updateOne(
        { sourceFile: key },
        { $inc: { totalFailed: 1 } },
      );
    }
  }

  const completed = !iterator.hasNext();
  await db.collection('import_jobs').updateOne(
    { sourceFile: key },
    {
      $set: {
        status: completed ? 'completed' : 'paused',
        updatedAt: new Date(),
      },
      ...(errors.length ? { $push: { errors: { $each: errors } } } : {}),
    },
  );

  job = await getOrCreateJob(sourceFile);

  return {
    job,
    saved,
    failed,
    processed,
    remaining: Math.max(0, iterator.total - iterator.position),
    completed,
  };
}

/** Alias batch — vẫn xử lý từng câu một trong vòng lặp */
async function importBatch(sourceFile, options = {}) {
  return importNext(sourceFile, {
    count: options.batchSize ?? config.importBatchSize,
    reset: options.reset ?? false,
  });
}

async function previewOne(sourceFile, number = 1) {
  const iterator = await getIterator(sourceFile);
  iterator.seek(0);

  let raw = null;
  while (iterator.hasNext()) {
    raw = iterator.nextRaw();
    if (raw.number === Number(number)) break;
    raw = null;
  }

  if (!raw) {
    return { found: false, number };
  }

  const document = toQuestionDocument(raw, {
    sourceFile: sourceFileKey(sourceFile),
    source: config.defaultSource,
  });

  return { found: true, raw, document };
}

async function previewSample(sourceFile, limit = 3) {
  const iterator = await getIterator(sourceFile);
  const samples = [];

  iterator.seek(0);
  while (iterator.hasNext() && samples.length < limit) {
    const raw = iterator.nextRaw();
    samples.push(
      toQuestionDocument(raw, {
        sourceFile: sourceFileKey(sourceFile),
        source: config.defaultSource,
      }),
    );
  }

  return {
    format: iterator.format,
    meta: iterator.meta,
    totalInFile: iterator.total,
    samples,
  };
}

async function getImportStatus(sourceFile) {
  const key = sourceFileKey(sourceFile);
  const db = getDb();
  const job = await db.collection('import_jobs').findOne({ sourceFile: key });
  const questionsInDb = await db.collection('questions').countDocuments({
    'meta.sourceFile': key,
  });

  return { job, questionsInDb };
}

async function listQuestions({
  page = 1,
  limit = 20,
  source,
  importStatus,
  status,
  bookmarked,
  flagged,
  q,
} = {}) {
  const db = getDb();
  const filter = {};
  if (source) filter.source = source;
  if (importStatus) filter.importStatus = importStatus;

  if (q) {
    const asNumber = Number(q);
    if (!Number.isNaN(asNumber) && String(asNumber) === q) {
      filter.number = asNumber;
    } else {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { 'question.en': { $regex: q, $options: 'i' } },
      ];
    }
  }

  const needsStateFilter =
    Boolean(status) ||
    bookmarked === true ||
    bookmarked === 'true' ||
    flagged === true ||
    flagged === 'true';

  if (needsStateFilter) {
    const { getDefaultUserId } = require('./userService');
    const userId = await getDefaultUserId();
    const stateFilter = { userId, source: source || config.defaultSource };
    if (status) stateFilter.status = status;
    if (bookmarked === true || bookmarked === 'true') stateFilter.bookmarked = true;
    if (flagged === true || flagged === 'true') stateFilter.flagged = true;

    const states = await db
      .collection('user_question_state')
      .find(stateFilter)
      .project({ questionNumber: 1 })
      .toArray();
    const numbers = states.map((s) => s.questionNumber);

    if (numbers.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    if (typeof filter.number === 'number') {
      if (!numbers.includes(filter.number)) {
        return { items: [], total: 0, page, limit };
      }
    } else {
      filter.number = { $in: numbers };
    }
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    db
      .collection('questions')
      .find(filter)
      .sort({ number: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection('questions').countDocuments(filter),
  ]);

  try {
    const { getDefaultUserId } = require('./userService');
    const userId = await getDefaultUserId();
    const numbers = items.map((i) => i.number);
    const states = numbers.length
      ? await db
          .collection('user_question_state')
          .find({
            userId,
            source: source || config.defaultSource,
            questionNumber: { $in: numbers },
          })
          .toArray()
      : [];
    const byNumber = new Map(states.map((s) => [s.questionNumber, s]));
    for (const item of items) {
      item.userState = byNumber.get(item.number) || null;
    }
  } catch {
    // ignore
  }

  return { items, total, page, limit };
}

async function getQuestion(number, source) {
  const db = getDb();
  const filter = { number: Number(number) };
  if (source) filter.source = source;
  return db.collection('questions').findOne(filter);
}

module.exports = {
  importNext,
  importBatch,
  processAndSaveOne,
  previewOne,
  previewSample,
  getImportStatus,
  listQuestions,
  getQuestion,
  clearIterator,
};
