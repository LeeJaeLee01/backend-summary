#!/usr/bin/env node
/**
 * Xóa toàn bộ collection cũ và tạo lại schema mới (questions + import_jobs).
 *
 * Usage: npm run db:reset
 */

require('dotenv').config();

const { resetDatabase, closeMongo } = require('../src/db/mongo');

async function main() {
  const result = await resetDatabase();
  console.log('Database reset OK:', JSON.stringify(result, null, 2));
  console.log('\nCollection questions schema:');
  console.log(JSON.stringify({
    number: 1,
    source: 'topic-1/exam-a',
    title: 'Global data aggregation to S3',
    question: { en: '...', vi: '' },
    options: [{ key: 'A', text: { en: '...', vi: '' }, explanation: '' }],
    correctAnswers: [],
    summaryNote: '',
    questionType: 'single',
    importStatus: 'no_answer',
    meta: { sourceFile: '...', topicNumber: 1 },
    createdAt: 'ISO date',
    updatedAt: 'ISO date',
  }, null, 2));
  console.log('\nTiếp theo: npm run import -- --all');
  await closeMongo();
}

main().catch(async (err) => {
  console.error(err);
  await closeMongo();
  process.exit(1);
});
