#!/usr/bin/env node
/** Apply agent answers map to MongoDB — no OpenAI API */
require('dotenv').config();
const { connectMongo, closeMongo, getDb } = require('../src/db/mongo');
const path = require('path');
const config = require('../src/config');
const batchPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(__dirname, '../data/agent-answers-batch1.js');
const ANSWERS = require(batchPath);

async function apply() {
  await connectMongo();
  const db = getDb();
  let updated = 0;

  for (const [num, data] of Object.entries(ANSWERS)) {
    const number = Number(num);
    const existing = await db.collection('questions').findOne({
      number,
      source: config.defaultSource,
    });
    if (!existing) continue;

    const options = existing.options.map((opt) => ({
      ...opt,
      explanation: data.explanations?.[opt.key] || opt.explanation || '',
    }));

    await db.collection('questions').updateOne(
      { number, source: config.defaultSource },
      {
        $set: {
          correctAnswers: data.correctAnswers,
          summaryNote: data.summaryNote || '',
          question: {
            en: existing.question?.en || '',
            vi: data.questionVi || existing.question?.vi || '',
          },
          options,
          questionType: data.correctAnswers.length > 1 ? 'multiple' : 'single',
          importStatus: 'agent_enriched',
          enrichedBy: 'cursor-agent',
          enrichedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    updated++;
    console.log(`Q${number} → ${data.correctAnswers.join(',')}`);
  }

  console.log(`Updated ${updated} questions`);
  await closeMongo();
}

apply().catch((e) => {
  console.error(e);
  process.exit(1);
});
