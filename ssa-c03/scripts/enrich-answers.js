#!/usr/bin/env node
/**
 * Điền đáp án + giải thích vào DB.
 *
 *   npm run enrich:markdown          # q1–36 từ saa-c03-tours (miễn phí, verified)
 *   npm run enrich:ai -- --limit 5   # AI 5 câu (cần OPENAI_API_KEY)
 *   npm run enrich:ai -- --number 1  # AI câu #1
 *   npm run enrich:ai -- --all       # AI toàn bộ (tốn token!)
 *   npm run enrich:status
 */

require('dotenv').config();

const config = require('../src/config');
const { connectMongo, closeMongo } = require('../src/db/mongo');
const enrichment = require('../src/services/answerEnrichmentService');
const { sleep } = require('../src/services/aiAnswerService');

function parseArgs(argv) {
  const args = {
    mode: 'status',
    limit: config.enrichBatchSize,
    all: false,
    number: null,
    dryRun: false,
    force: false,
  };

  const modeArg = argv[2];
  if (modeArg === 'markdown' || modeArg === 'ai' || modeArg === 'status') {
    args.mode = modeArg;
  }

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all') args.all = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--limit' && argv[i + 1]) args.limit = Number(argv[++i]);
    else if (arg === '--number' && argv[i + 1]) args.number = Number(argv[++i]);
  }

  return args;
}

async function runAiAll(limit) {
  let round = 0;
  let totalUpdated = 0;

  while (true) {
    round += 1;
    const result = await enrichment.enrichWithAi({ limit });
    totalUpdated += result.updated;
    console.log(
      `Round ${round}: updated=${result.updated} failed=${result.failed} remaining=${result.remaining}`,
    );
    if (result.remaining === 0 || result.processed === 0) break;
    await sleep(config.enrichDelayMs);
  }

  return totalUpdated;
}

async function main() {
  const args = parseArgs(process.argv);
  await connectMongo();

  if (args.mode === 'status') {
    console.log(JSON.stringify(await enrichment.getEnrichStatus(), null, 2));
  } else if (args.mode === 'markdown') {
    const result = await enrichment.enrichFromMarkdown({ force: args.force });
    console.log(JSON.stringify(result, null, 2));
  } else if (args.mode === 'ai') {
    if (args.all) {
      console.log('AI enrich ALL — cần OPENAI_API_KEY, tốn token cho ~600+ câu');
      const total = await runAiAll(args.limit);
      console.log(`Total AI updated: ${total}`);
    } else {
      const result = await enrichment.enrichWithAi({
        limit: args.number ? 1 : args.limit,
        number: args.number,
        dryRun: args.dryRun,
      });
      console.log(JSON.stringify(result, null, 2));
    }
    console.log('\nStatus:', JSON.stringify(await enrichment.getEnrichStatus(), null, 2));
  } else {
    console.log('Usage: node scripts/enrich-answers.js [markdown|ai|status] [--limit N] [--number N] [--all]');
  }

  await closeMongo();
}

main().catch(async (err) => {
  console.error(err.message || err);
  await closeMongo();
  process.exit(1);
});
