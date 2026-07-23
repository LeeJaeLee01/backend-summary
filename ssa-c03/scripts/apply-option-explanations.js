#!/usr/bin/env node
/**
 * Merge option explanations into MongoDB.
 * Only fills empty explanations (does not overwrite existing text).
 *
 * Usage:
 *   node scripts/apply-option-explanations.js [data/explanations-q1-36.js]
 */
require('dotenv').config();
const path = require('path');
const { connectMongo, closeMongo, getDb } = require('../src/db/mongo');
const config = require('../src/config');

const file = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(__dirname, '../data/explanations-q1-36.js');
const MAP = require(file);

function normalizeExpl(text, isCorrect) {
  const t = String(text || '').trim();
  if (!t) return t;
  if (/^(✅|✔|Đúng|Sai|Correct|Wrong)/i.test(t)) return t;
  return isCorrect ? `✅ Đúng: ${t}` : t.startsWith('Sai:') ? t : `Sai: ${t}`;
}

async function main() {
  await connectMongo();
  const db = getDb();
  let updatedQuestions = 0;
  let filledOptions = 0;

  for (const [num, byKey] of Object.entries(MAP)) {
    const number = Number(num);
    const q = await db.collection('questions').findOne({
      number,
      source: config.defaultSource,
    });
    if (!q) {
      console.warn(`Q${number}: not found`);
      continue;
    }

    const correct = new Set((q.correctAnswers || []).map((k) => String(k).toUpperCase()));
    let changed = false;
    const options = (q.options || []).map((opt) => {
      const key = String(opt.key).toUpperCase();
      const incoming = byKey[key] || byKey[opt.key];
      const current = (opt.explanation || '').trim();
      if (current) {
        // Ensure correct answers are labeled clearly if missing marker
        if (correct.has(key) && !/^(✅|✔|Đúng)/i.test(current)) {
          changed = true;
          filledOptions += 1;
          return { ...opt, explanation: `✅ Đúng: ${current}` };
        }
        return opt;
      }
      if (!incoming) return opt;
      changed = true;
      filledOptions += 1;
      return {
        ...opt,
        explanation: normalizeExpl(incoming, correct.has(key)),
      };
    });

    if (!changed) continue;

    await db.collection('questions').updateOne(
      { number, source: config.defaultSource },
      {
        $set: {
          options,
          updatedAt: new Date(),
          explanationsFilledAt: new Date(),
        },
      },
    );
    updatedQuestions += 1;
    console.log(`Q${number}: filled missing option explanations`);
  }

  console.log(`Done. questions=${updatedQuestions}, optionsFilled=${filledOptions}`);
  await closeMongo();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
