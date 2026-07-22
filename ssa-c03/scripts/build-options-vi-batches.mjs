#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'data');

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function writeBatch(batchNum, start, end, translations) {
  const lines = [`/** Options VI Q${start}–${end} */`, 'module.exports = {'];
  for (let n = start; n <= end; n++) {
    const data = translations[n];
    if (!data) throw new Error(`Missing translation for Q${n}`);
    lines.push(`  ${n}: {`);
    lines.push(`    questionVi: '${esc(data.questionVi)}',`);
    lines.push('    optionsVi: {');
    for (const [k, v] of Object.entries(data.optionsVi)) {
      lines.push(`      ${k}: '${esc(v)}',`);
    }
    lines.push('    },');
    lines.push('  },');
  }
  lines.push('};', '');
  const out = path.join(DATA, `options-vi-batch${batchNum}.js`);
  fs.writeFileSync(out, lines.join('\n'));
  return out;
}

export { esc, writeBatch, DATA };
