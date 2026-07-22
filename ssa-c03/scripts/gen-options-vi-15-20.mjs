#!/usr/bin/env node
/**
 * Generate options-vi-batch15..20.js from exports-vi JSON + embedded translations.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function fixEn(s) {
  return (s || '').replace(/\u0000/g, 'fi');
}

/** @type {Record<number, {questionVi: string, optionsVi: Record<string,string>}>} */
const T = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'options-vi-translations-15-20.json'), 'utf8'),
);

const batches = [
  { n: 15, file: 'q387-411.json', from: 387, to: 411 },
  { n: 16, file: 'q412-436.json', from: 412, to: 436 },
  { n: 17, file: 'q437-461.json', from: 437, to: 461 },
  { n: 18, file: 'q462-486.json', from: 462, to: 486 },
  { n: 19, file: 'q487-511.json', from: 487, to: 511 },
  { n: 20, file: 'q512-536.json', from: 512, to: 536 },
];

for (const { n, file, from, to } of batches) {
  const items = JSON.parse(
    fs.readFileSync(path.join(root, 'data/exports-vi', file), 'utf8'),
  );
  const lines = [`/** Options VI Q${from}–${to} */`, 'module.exports = {'];
  let missing = 0;
  for (const q of items) {
    const t = T[String(q.number)];
    if (!t) {
      console.error(`Missing translation for Q${q.number}`);
      missing++;
      continue;
    }
    lines.push(`  ${q.number}: {`);
    lines.push(`    questionVi: '${esc(t.questionVi)}',`);
    lines.push(`    optionsVi: {`);
    for (const opt of q.options) {
      const vi = t.optionsVi[opt.key];
      if (!vi) {
        console.error(`Missing option ${opt.key} for Q${q.number}`);
        missing++;
      }
      lines.push(`      ${opt.key}: '${esc(vi || fixEn(opt.text.en))}',`);
    }
    lines.push(`    },`);
    lines.push(`  },`);
  }
  lines.push('};', '');
  const out = path.join(root, 'data', `options-vi-batch${n}.js`);
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`Wrote ${out} (${items.length} questions, missing=${missing})`);
}
