#!/usr/bin/env node
require('dotenv').config();
const { connectMongo, closeMongo, getDb } = require('../src/db/mongo');
const config = require('../src/config');

(async () => {
  await connectMongo();
  const db = getDb();
  const all = await db.collection('questions').find({ source: config.defaultSource }).toArray();
  let withOptVi = 0;
  let withFullQVi = 0;
  for (const q of all) {
    if (q.options.every((o) => o.text?.vi?.trim())) withOptVi++;
    if ((q.question?.vi?.length || 0) > 80) withFullQVi++;
  }
  console.log(JSON.stringify({
    total: all.length,
    withOptionsVi: withOptVi,
    withoutOptionsVi: all.length - withOptVi,
    withLongQuestionVi: withFullQVi,
  }, null, 2));
  await closeMongo();
})();
