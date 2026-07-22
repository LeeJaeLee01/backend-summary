#!/usr/bin/env node
/** Apply optionsVi translations to MongoDB */
require('dotenv').config();
const { connectMongo, closeMongo, getDb } = require('../src/db/mongo');
const path = require('path');
const config = require('../src/config');

const batchPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : null;

if (!batchPath) {
  console.error('Usage: node scripts/apply-options-vi.js <options-vi-batchN.js>');
  process.exit(1);
}

const DATA = require(batchPath);

async function apply() {
  await connectMongo();
  const db = getDb();
  let updated = 0;

  for (const [num, data] of Object.entries(DATA)) {
    const number = Number(num);
    const existing = await db.collection('questions').findOne({
      number,
      source: config.defaultSource,
    });
    if (!existing || !data.optionsVi) continue;

    const options = existing.options.map((opt) => ({
      ...opt,
      text: {
        en: opt.text?.en || '',
        vi: data.optionsVi[opt.key] || opt.text?.vi || '',
      },
    }));

    const $set = { options, updatedAt: new Date() };
    if (data.questionVi) {
      $set.question = {
        en: existing.question?.en || '',
        vi: data.questionVi,
      };
    }

    await db.collection('questions').updateOne(
      { number, source: config.defaultSource },
      { $set },
    );
    updated++;
  }

  console.log(`Updated options VI for ${updated} questions`);
  await closeMongo();
}

apply().catch((e) => {
  console.error(e);
  process.exit(1);
});
