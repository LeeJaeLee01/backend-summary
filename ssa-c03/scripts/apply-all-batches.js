#!/usr/bin/env node
/** Apply all agent-answers-batch*.js files to MongoDB */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dataDir = path.join(__dirname, '../data');
const files = fs
  .readdirSync(dataDir)
  .filter((f) => /^agent-answers-batch\d+\.js$/.test(f))
  .sort((a, b) => {
    const na = Number(a.match(/\d+/)[0]);
    const nb = Number(b.match(/\d+/)[0]);
    return na - nb;
  });

console.log(`Applying ${files.length} batch files...`);
for (const f of files) {
  console.log(`\n=== ${f} ===`);
  execSync(`node scripts/apply-agent-answers.js data/${f}`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
}
console.log('\nAll batches applied.');
