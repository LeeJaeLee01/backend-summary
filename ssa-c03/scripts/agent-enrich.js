#!/usr/bin/env node
/**
 * Export/import agent enrichments (no OpenAI API).
 *   node scripts/agent-enrich.js export --from 37 --to 61
 *   node scripts/agent-enrich.js apply data/enrich-37-61.json
 */

require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { connectMongo, closeMongo, getDb } = require('../src/db/mongo');
const config = require('../src/config');

async function exportQuestions(from, to) {
  const db = getDb();
  const items = await db
    .collection('questions')
    .find({
      source: config.defaultSource,
      number: { $gte: from, $lte: to },
    })
    .sort({ number: 1 })
    .project({
      number: 1,
      title: 1,
      question: 1,
      options: 1,
      correctAnswers: 1,
      questionType: 1,
    })
    .toArray();
  return items;
}

async function applyEnrichments(filePath) {
  const db = getDb();
  const raw = await fs.readFile(path.resolve(filePath), 'utf8');
  const items = JSON.parse(raw);
  let updated = 0;

  for (const item of items) {
    const now = new Date();
    await db.collection('questions').updateOne(
      { number: item.number, source: config.defaultSource },
      {
        $set: {
          correctAnswers: item.correctAnswers,
          summaryNote: item.summaryNote || '',
          question: item.question,
          options: item.options,
          questionType: item.questionType || (item.correctAnswers?.length > 1 ? 'multiple' : 'single'),
          importStatus: 'agent_enriched',
          enrichedBy: 'cursor-agent',
          enrichedAt: now,
          updatedAt: now,
        },
      },
    );
    updated += 1;
  }

  return { updated, file: filePath };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  await connectMongo();

  if (cmd === 'export') {
    let from = 37;
    let to = 61;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--from') from = Number(rest[++i]);
      if (rest[i] === '--to') to = Number(rest[++i]);
    }
    const items = await exportQuestions(from, to);
    console.log(JSON.stringify(items, null, 2));
  } else if (cmd === 'apply') {
    const result = await applyEnrichments(rest[0]);
    console.log(JSON.stringify(result, null, 2));
  } else if (cmd === 'pending') {
    const db = getDb();
    const nums = await db
      .collection('questions')
      .find({
        source: config.defaultSource,
        $or: [{ correctAnswers: { $size: 0 } }, { correctAnswers: { $exists: false } }],
      })
      .sort({ number: 1 })
      .limit(30)
      .project({ number: 1, title: 1 })
      .toArray();
    console.log(JSON.stringify(nums, null, 2));
  } else {
    console.log('Usage: export --from N --to M | apply <file.json> | pending');
  }

  await closeMongo();
}

main().catch(async (e) => {
  console.error(e);
  await closeMongo();
  process.exit(1);
});
