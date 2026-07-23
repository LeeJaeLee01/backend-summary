const { getDb, COLLECTIONS } = require('../db/mongo');
const config = require('../config');
const { getDefaultUserId, touchActivity } = require('./userService');

function emptyState(userId, questionNumber, source) {
  return {
    userId,
    questionNumber: Number(questionNumber),
    source,
    status: 'unseen',
    bookmarked: false,
    flagged: false,
    lastSelected: [],
    attempts: 0,
    lastResult: null,
    updatedAt: null,
  };
}

async function getState(questionNumber, source = config.defaultSource) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const number = Number(questionNumber);
  const existing = await db.collection(COLLECTIONS.userQuestionState).findOne({
    userId,
    questionNumber: number,
    source,
  });
  return existing || emptyState(userId, number, source);
}

async function patchState(questionNumber, patch = {}, source = config.defaultSource) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const number = Number(questionNumber);
  const now = new Date();

  const existing = await db.collection(COLLECTIONS.userQuestionState).findOne({
    userId,
    questionNumber: number,
    source,
  });

  const next = {
    userId,
    questionNumber: number,
    source,
    status: existing?.status || 'unseen',
    bookmarked: existing?.bookmarked || false,
    flagged: existing?.flagged || false,
    lastSelected: existing?.lastSelected || [],
    attempts: existing?.attempts || 0,
    lastResult: existing?.lastResult ?? null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (typeof patch.bookmarked === 'boolean') next.bookmarked = patch.bookmarked;
  if (typeof patch.flagged === 'boolean') next.flagged = patch.flagged;
  if (patch.status) next.status = patch.status;
  if (Array.isArray(patch.lastSelected)) next.lastSelected = patch.lastSelected;
  if (typeof patch.attempts === 'number') next.attempts = patch.attempts;
  if (patch.lastResult !== undefined) next.lastResult = patch.lastResult;

  await db.collection(COLLECTIONS.userQuestionState).updateOne(
    { userId, questionNumber: number, source },
    { $set: next },
    { upsert: true },
  );

  await touchActivity(userId);
  return getState(number, source);
}

async function recordAttempt({
  questionNumber,
  source = config.defaultSource,
  selected = [],
  result,
  status,
}) {
  const current = await getState(questionNumber, source);
  return patchState(
    questionNumber,
    {
      lastSelected: selected,
      lastResult: result,
      status,
      attempts: (current.attempts || 0) + (result === 'revealed' ? 0 : 1),
      bookmarked: current.bookmarked,
      flagged: current.flagged,
    },
    source,
  );
}

/** Clear answer/reveal for one question; keep bookmark + flag + attempt count. */
async function resetAttempt(questionNumber, source = config.defaultSource) {
  const current = await getState(questionNumber, source);
  return patchState(
    questionNumber,
    {
      status: 'unseen',
      lastSelected: [],
      lastResult: null,
      attempts: current.attempts || 0,
      bookmarked: current.bookmarked,
      flagged: current.flagged,
    },
    source,
  );
}

/** Reset all answered/revealed questions for default user (keep bookmarks/flags). */
async function resetAllAttempts(source = config.defaultSource) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const now = new Date();
  const result = await db.collection(COLLECTIONS.userQuestionState).updateMany(
    {
      userId,
      source,
      status: { $in: ['answered_correct', 'answered_wrong', 'revealed'] },
    },
    {
      $set: {
        status: 'unseen',
        lastSelected: [],
        lastResult: null,
        updatedAt: now,
      },
    },
  );
  await touchActivity(userId);
  return { matched: result.matchedCount, modified: result.modifiedCount };
}

async function listStates({
  page = 1,
  limit = 50,
  source = config.defaultSource,
  status,
  bookmarked,
  flagged,
} = {}) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const filter = { userId, source };
  if (status) filter.status = status;
  if (bookmarked === true || bookmarked === 'true') filter.bookmarked = true;
  if (flagged === true || flagged === 'true') filter.flagged = true;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    db
      .collection(COLLECTIONS.userQuestionState)
      .find(filter)
      .sort({ questionNumber: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection(COLLECTIONS.userQuestionState).countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

module.exports = {
  getState,
  patchState,
  recordAttempt,
  resetAttempt,
  resetAllAttempts,
  listStates,
  emptyState,
};
