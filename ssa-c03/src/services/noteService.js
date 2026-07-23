const { getDb, COLLECTIONS } = require('../db/mongo');
const config = require('../config');
const { getDefaultUserId, touchActivity } = require('./userService');

async function getNote(questionNumber, source = config.defaultSource) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const note = await db.collection(COLLECTIONS.userNotes).findOne({
    userId,
    questionNumber: Number(questionNumber),
    source,
  });

  return {
    userId,
    questionNumber: Number(questionNumber),
    source,
    body: note?.body || '',
    updatedAt: note?.updatedAt || null,
  };
}

async function upsertNote(questionNumber, body, source = config.defaultSource) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const now = new Date();
  const number = Number(questionNumber);

  const existing = await db.collection(COLLECTIONS.userNotes).findOne({
    userId,
    questionNumber: number,
    source,
  });

  await db.collection(COLLECTIONS.userNotes).updateOne(
    { userId, questionNumber: number, source },
    {
      $set: {
        userId,
        questionNumber: number,
        source,
        body: String(body ?? ''),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  await touchActivity(userId);
  return getNote(number, source);
}

async function listNotes({ page = 1, limit = 50, source = config.defaultSource } = {}) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const filter = {
    userId,
    source,
    body: { $exists: true, $nin: [null, ''] },
  };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db
      .collection(COLLECTIONS.userNotes)
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection(COLLECTIONS.userNotes).countDocuments(filter),
  ]);

  const numbers = items.map((n) => n.questionNumber);
  const questions = numbers.length
    ? await db
        .collection(COLLECTIONS.questions)
        .find({ number: { $in: numbers }, source })
        .project({ number: 1, title: 1 })
        .toArray()
    : [];
  const byNumber = new Map(questions.map((q) => [q.number, q]));

  return {
    items: items.map((n) => ({
      ...n,
      title: byNumber.get(n.questionNumber)?.title || `Question ${n.questionNumber}`,
    })),
    total,
    page,
    limit,
  };
}

module.exports = {
  getNote,
  upsertNote,
  listNotes,
};
