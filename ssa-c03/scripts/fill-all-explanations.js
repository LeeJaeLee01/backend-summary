#!/usr/bin/env node
/**
 * Fill option explanations for the FULL question bank:
 * 1) Merge agent-answers-batch*.js explanations
 * 2) Merge data/explanations-q1-36.js
 * 3) Repair Q477 empty options
 * 4) Normalize labels ✅ Đúng / Sai for every option
 *
 * Usage: node scripts/fill-all-explanations.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectMongo, closeMongo, getDb } = require('../src/db/mongo');
const config = require('../src/config');

const DATA = path.join(__dirname, '../data');

function loadAgentMaps() {
  const map = {};
  for (const f of fs.readdirSync(DATA).filter((x) => /^agent-answers-batch\d+\.js$/.test(x))) {
    const batch = require(path.join(DATA, f));
    for (const [num, payload] of Object.entries(batch)) {
      map[Number(num)] = {
        ...(map[Number(num)] || {}),
        ...(payload.explanations || {}),
      };
    }
  }
  return map;
}

function loadQ136() {
  return require(path.join(DATA, 'explanations-q1-36.js'));
}

/** Q477 was imported without options (PDF image choices). Restore text + explanations. */
const Q477_FIX = {
  correctAnswers: ['B'],
  summaryNote:
    'List bucket OK nhưng **không delete object** → thêm statement **Allow `s3:DeleteObject`** trên resource **`arn:aws:s3:::bucket/*`** (object-level). Bucket ARN không đủ cho DeleteObject; `s3:*` vi phạm least privilege.',
  questionVi:
    'IAM group list được S3 bucket nhưng không xóa object — bổ sung statement nào (least privilege)?',
  options: [
    {
      key: 'A',
      text: {
        en: 'Allow s3:DeleteObject on Resource arn:aws:s3:::examplebucket (bucket ARN only, no /*).',
        vi: 'Allow s3:DeleteObject trên ARN bucket (không có /*).',
      },
      explanation:
        'Sai: `s3:DeleteObject` là **object-level action** — cần ARN dạng `bucket/*`. Chỉ bucket ARN không cho phép delete objects.',
    },
    {
      key: 'B',
      text: {
        en: 'Allow s3:DeleteObject on Resource arn:aws:s3:::examplebucket/* (object ARN).',
        vi: 'Allow s3:DeleteObject trên ARN object `bucket/*`.',
      },
      explanation:
        '✅ Đúng: thêm Allow **`s3:DeleteObject`** trên **`arn:aws:s3:::bucket/*`** — đủ quyền xóa object, vẫn least privilege (không dùng `s3:*`).',
    },
    {
      key: 'C',
      text: {
        en: 'Allow s3:* on Resource arn:aws:s3:::examplebucket and arn:aws:s3:::examplebucket/*.',
        vi: 'Allow s3:* trên cả bucket ARN và object ARN.',
      },
      explanation:
        'Sai: `s3:*` quá rộng — **vi phạm least-privilege** dù delete được.',
    },
    {
      key: 'D',
      text: {
        en: 'Add an explicit Deny for s3:DeleteObject on the bucket ARN.',
        vi: 'Thêm Deny s3:DeleteObject trên bucket ARN.',
      },
      explanation:
        'Sai: **Deny** không sửa thiếu Allow — còn chặn delete thêm.',
    },
  ],
};

function labelExplanation(text, isCorrect) {
  const t = String(text || '').trim();
  if (!t) return '';
  if (/^(✅|✔|Đúng\b|Sai\b|Correct\b|Wrong\b)/i.test(t)) return t;
  return isCorrect ? `✅ Đúng: ${t}` : `Sai: ${t}`;
}

async function main() {
  const agentMap = loadAgentMaps();
  const q136 = loadQ136();

  await connectMongo();
  const db = getDb();
  const source = config.defaultSource;

  let repaired477 = false;
  let filledEmpty = 0;
  let labeled = 0;
  let touched = 0;

  const cursor = db.collection('questions').find({ source }).sort({ number: 1 });

  for await (const q of cursor) {
    const number = q.number;
    let options = Array.isArray(q.options) ? [...q.options] : [];
    let correctAnswers = [...(q.correctAnswers || [])];
    let extraSet = {};

    if (number === 477 && (!options.length || options.every((o) => !(o.explanation || '').trim()))) {
      options = Q477_FIX.options.map((o) => ({ ...o }));
      correctAnswers = [...Q477_FIX.correctAnswers];
      repaired477 = true;
      extraSet = {
        question: {
          en: q.question?.en || '',
          vi: Q477_FIX.questionVi || q.question?.vi || '',
        },
        summaryNote: Q477_FIX.summaryNote,
        questionType: 'single',
        importStatus: 'agent_enriched',
      };
    }

    const incoming = {
      ...(agentMap[number] || {}),
      ...(q136[number] || {}),
    };
    const correct = new Set(correctAnswers.map((k) => String(k).toUpperCase()));

    let changed = repaired477 && number === 477;
    options = options.map((opt) => {
      const key = String(opt.key).toUpperCase();
      const isCorrect = correct.has(key);
      let explanation = (opt.explanation || '').trim();

      if (!explanation && (incoming[key] || incoming[opt.key])) {
        explanation = String(incoming[key] || incoming[opt.key]).trim();
        filledEmpty += 1;
        changed = true;
      }

      const labeledText = labelExplanation(explanation, isCorrect);
      if (labeledText && labeledText !== (opt.explanation || '').trim()) {
        if ((opt.explanation || '').trim()) labeled += 1;
        changed = true;
      }

      return {
        ...opt,
        key: opt.key,
        explanation: labeledText || explanation,
      };
    });

    if (!changed) continue;
    touched += 1;

    await db.collection('questions').updateOne(
      { number, source },
      {
        $set: {
          ...extraSet,
          options,
          correctAnswers,
          updatedAt: new Date(),
          explanationsFilledAt: new Date(),
        },
      },
    );

    if (touched % 50 === 0) console.log(`… updated ${touched} questions`);
  }

  const remaining = [];
  for await (const q of db.collection('questions').find({ source }).project({ number: 1, options: 1 })) {
    const empty = (q.options || []).filter((o) => !(o.explanation || '').trim());
    if (empty.length) remaining.push({ number: q.number, empty: empty.map((o) => o.key) });
  }

  console.log(
    JSON.stringify(
      {
        touched,
        filledEmpty,
        labeled,
        repaired477,
        remainingCount: remaining.length,
        remaining: remaining.slice(0, 20),
      },
      null,
      2,
    ),
  );

  await closeMongo();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
