#!/usr/bin/env node
/** Export questions needing options[].text.vi for translation batches */
require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const { connectMongo, closeMongo, getDb } = require('../src/db/mongo');
const config = require('../src/config');

async function main() {
  const from = Number(process.argv[2]) || 37;
  const to = Number(process.argv[3]) || 684;
  const outDir = path.join(__dirname, '../data/exports-vi');

  await connectMongo();
  const db = getDb();

  const items = await db
    .collection('questions')
    .find({
      source: config.defaultSource,
      number: { $gte: from, $lte: to },
    })
    .sort({ number: 1 })
    .toArray();

  const pending = items.filter((q) =>
    q.options.some((o) => !o.text?.vi || o.text.vi.trim() === ''),
  );

  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `q${from}-${to}.json`);
  const exportData = pending.map((q) => ({
    number: q.number,
    title: q.title,
    question: { en: q.question?.en || '', vi: q.question?.vi || '' },
    options: q.options.map((o) => ({
      key: o.key,
      text: { en: o.text?.en || '' },
    })),
  }));

  await fs.writeFile(outPath, JSON.stringify(exportData, null, 2));
  console.log(JSON.stringify({ from, to, exported: exportData.length, outPath }, null, 2));
  await closeMongo();
}

main().catch(async (e) => {
  console.error(e);
  await closeMongo();
  process.exit(1);
});
