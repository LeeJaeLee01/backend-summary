#!/usr/bin/env node
/** Generate compact agent-answers-batch10.js through batch14.js (Q262–386) */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const { ANSWERS, buildExplanations } = require('./generate-batches-9-14');

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function compactEntry(num, meta, explanations) {
  const correct = meta.a.map((x) => `'${x}'`).join(', ');
  const explParts = Object.entries(explanations)
    .map(([k, v]) => `${k}: '${esc(v)}'`)
    .join(', ');
  return `  ${num}: { correctAnswers: [${correct}], summaryNote: '${esc(meta.s)}', questionVi: '${esc(meta.q)}', explanations: { ${explParts} } },`;
}

function generateCompact(batchNum, startQ, endQ, exportFile) {
  const questions = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'exports', exportFile), 'utf8'),
  );
  const lines = [`/** Agent answers Q${startQ}–${endQ} — cursor-agent */`, 'module.exports = {'];
  for (const q of questions) {
    const num = q.number;
    const meta = { ...ANSWERS[num], n: num };
    if (!meta.a) throw new Error(`Missing answer metadata for Q${num}`);
    const explanations = buildExplanations(num, q.options, meta.a, meta);
    lines.push(compactEntry(num, meta, explanations));
  }
  lines.push('};');
  lines.push('');
  const outPath = path.join(DATA_DIR, `agent-answers-batch${batchNum}.js`);
  fs.writeFileSync(outPath, lines.join('\n'));
  return { path: outPath, count: questions.length };
}

if (require.main === module) {
  const batches = [
    [10, 262, 286, 'q262-286.json'],
    [11, 287, 311, 'q287-311.json'],
    [12, 312, 336, 'q312-336.json'],
    [13, 337, 361, 'q337-361.json'],
    [14, 362, 386, 'q362-386.json'],
  ];
  const results = batches.map(([n, s, e, f]) => generateCompact(n, s, e, f));
  console.log(JSON.stringify(results, null, 2));
}

module.exports = { generateCompact };
