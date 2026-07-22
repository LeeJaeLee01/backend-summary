#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dataDir = path.join(__dirname, '../data');
const files = fs
  .readdirSync(dataDir)
  .filter((f) => /^options-vi-batch\d+\.js$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

for (const f of files) {
  console.log(`\n=== ${f} ===`);
  execSync(`node scripts/apply-options-vi.js data/${f}`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
}
