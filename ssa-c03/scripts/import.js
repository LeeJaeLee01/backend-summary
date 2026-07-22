#!/usr/bin/env node
/**
 * Import pipeline: đọc từng câu → transform → lưu DB.
 *
 *   npm run import -- --one              # 1 câu
 *   npm run import                       # 1 batch (25 câu, mỗi câu pipeline riêng)
 *   npm run import -- --all              # import hết
 *   npm run import -- --preview          # xem 3 câu mẫu (schema)
 *   npm run import -- --preview 1        # xem câu #1
 *   npm run import -- --reset --all      # xóa + import lại
 */

require('dotenv').config();

const config = require('../src/config');
const { connectMongo, closeMongo } = require('../src/db/mongo');
const importService = require('../src/services/importService');

function parseArgs(argv) {
  const args = {
    file: config.sourceFile,
    batchSize: config.importBatchSize,
    all: false,
    one: false,
    reset: false,
    preview: false,
    previewOne: null,
    previewLimit: 3,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all') args.all = true;
    else if (arg === '--one') args.one = true;
    else if (arg === '--reset') args.reset = true;
    else if (arg === '--preview') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--') && /^\d+$/.test(next)) {
        args.previewOne = Number(argv[++i]);
      } else {
        args.preview = true;
      }
    } else if (arg === '--file' && argv[i + 1]) {
      args.file = argv[++i];
    } else if (arg === '--batch' && argv[i + 1]) {
      args.batchSize = Number(argv[++i]);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.preview || args.previewOne !== null) {
    if (args.previewOne !== null) {
      const result = await importService.previewOne(args.file, args.previewOne);
      console.log(JSON.stringify(result, null, 2));
    } else {
      const result = await importService.previewSample(args.file, args.previewLimit);
      console.log(JSON.stringify(result, null, 2));
    }
    return;
  }

  await connectMongo();

  const runImport = async (count) => {
    const result = await importService.importNext(args.file, {
      count,
      reset: args.reset,
    });
    args.reset = false;

    for (const item of result.processed || []) {
      console.log(`Q${item.number} [${item.source}] "${item.title}" → saved (${item.importStatus})`);
    }

    return result;
  };

  if (args.one) {
    const result = await runImport(1);
    console.log(JSON.stringify(result, null, 2));
  } else if (args.all) {
    if (args.reset) {
      console.log('Reset + import all from', args.file);
      await importService.importNext(args.file, { count: 0, reset: true });
    }

    let round = 0;
    while (true) {
      round += 1;
      const result = await runImport(args.batchSize);
      console.log(`Round ${round}: saved=${result.saved} remaining=${result.remaining} completed=${result.completed}`);
      if (result.message) console.log('Note:', result.message);
      if (result.completed || result.saved === 0) break;
    }
  } else {
    const count = args.batchSize;
    const result = await runImport(count);
    console.log(JSON.stringify(result, null, 2));
  }

  const status = await importService.getImportStatus(args.file);
  console.log('\nStatus:', JSON.stringify(status, null, 2));

  await closeMongo();
}

main().catch(async (err) => {
  console.error(err);
  await closeMongo();
  process.exit(1);
});
