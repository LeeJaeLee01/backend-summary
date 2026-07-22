#!/usr/bin/env node
require('dotenv').config();

const config = require('../src/config');
const { connectMongo, closeMongo } = require('../src/db/mongo');
const importService = require('../src/services/importService');

async function main() {
  const file = process.argv[2] || config.sourceFile;
  await connectMongo();
  const status = await importService.getImportStatus(file);
  console.log(JSON.stringify(status, null, 2));
  await closeMongo();
}

main().catch(async (err) => {
  console.error(err);
  await closeMongo();
  process.exit(1);
});
