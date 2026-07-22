#!/usr/bin/env node
/** Generate options-vi batch files from exports-vi JSON + inline translations */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function fixEn(s) {
  return (s || '')
    .replace(/\u0000/g, 'fi')
    .replace(/Con\u0000gure/g, 'Configure')
    .replace(/con\u0000gure/g, 'configure')
    .replace(/\u0000le/g, 'file')
    .replace(/tra\u0000c/g, 'traffic')
    .replace(/noti\u0000cation/g, 'notification')
    .replace(/e\u0000cient/g, 'efficient')
    .replace(/speci\u0000c/g, 'specific')
    .replace(/identi\u0000able/g, 'identifiable')
    .replace(/work\u0000ow/g, 'workflow')
    .replace(/certi\u0000cate/g, 'certificate')
    .replace(/indefinitely/g, 'indefinitely');
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function loadJson(range) {
  const p = path.join(root, 'data/exports-vi', `q${range}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function translateQuestion(q) {
  const n = q.number;
  const t = TRANSLATIONS[n];
  if (!t) throw new Error(`Missing translation for Q${n}`);
  const optionsVi = {};
  for (const opt of q.options) {
    if (!t.optionsVi[opt.key]) {
      throw new Error(`Missing option ${opt.key} for Q${n}`);
    }
    optionsVi[opt.key] = t.optionsVi[opt.key];
  }
  return { questionVi: t.questionVi, optionsVi };
}

function writeBatch(batchNum, rangeLabel, from, to, rangeFile) {
  const items = loadJson(rangeFile);
  const lines = [`/** Options VI Q${from}–${to} */`, 'module.exports = {'];
  for (const q of items) {
    const { questionVi, optionsVi } = translateQuestion(q);
    lines.push(`  ${q.number}: {`);
    lines.push(`    questionVi: '${esc(questionVi)}',`);
    lines.push(`    optionsVi: {`);
    for (const [k, v] of Object.entries(optionsVi)) {
      lines.push(`      ${k}: '${esc(v)}',`);
    }
    lines.push(`    },`);
    lines.push(`  },`);
  }
  lines.push('};', '');
  const out = path.join(root, 'data', `options-vi-batch${batchNum}.js`);
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`Wrote ${out} (${items.length} questions)`);
}

// Translations loaded from companion module
import { TRANSLATIONS } from './options-vi-translations.mjs';

const batches = [
  [1, '37-61', 37, 61, '37-61'],
  [2, '62-86', 62, 86, '62-86'],
  [3, '87-111', 87, 111, '87-111'],
  [4, '112-136', 112, 136, '112-136'],
  [5, '137-161', 137, 161, '137-161'],
  [6, '162-186', 162, 186, '162-186'],
];

for (const b of batches) writeBatch(...b);
