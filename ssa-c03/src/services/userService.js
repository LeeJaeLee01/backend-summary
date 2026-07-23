const { ObjectId } = require('mongodb');
const { getDb, COLLECTIONS } = require('../db/mongo');
const config = require('../config');

const DEFAULT_PREFERENCES = {
  langLayout: 'bilingual',
  enPrimary: true,
  defaultMode: 'practice',
  examQuestionCount: 65,
  examMinutes: 130,
  lastQuestionNumber: 1,
  lastSource: config.defaultSource,
};

async function ensureDefaultUser() {
  const db = getDb();
  const users = db.collection(COLLECTIONS.users);
  let user = await users.findOne({ username: 'default' });

  if (user) return user;

  const now = new Date();
  const doc = {
    username: 'default',
    displayName: 'Learner',
    preferences: { ...DEFAULT_PREFERENCES },
    activityDates: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await users.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function getDefaultUser() {
  const user = await ensureDefaultUser();
  return user;
}

async function getDefaultUserId() {
  const user = await getDefaultUser();
  return user._id;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function touchActivity(userId) {
  const db = getDb();
  const key = todayKey();
  await db.collection(COLLECTIONS.users).updateOne(
    { _id: userId instanceof ObjectId ? userId : new ObjectId(userId) },
    {
      $addToSet: { activityDates: key },
      $set: { updatedAt: new Date() },
    },
  );
}

async function updatePreferences(patch = {}) {
  const user = await getDefaultUser();
  const preferences = {
    ...DEFAULT_PREFERENCES,
    ...(user.preferences || {}),
    ...patch,
  };

  const db = getDb();
  await db.collection(COLLECTIONS.users).updateOne(
    { _id: user._id },
    { $set: { preferences, updatedAt: new Date() } },
  );

  return { ...user, preferences };
}

async function getStats(userId) {
  const db = getDb();
  const uid = userId instanceof ObjectId ? userId : new ObjectId(userId);
  const states = db.collection(COLLECTIONS.userQuestionState);

  const [totalQuestions, answeredCorrect, answeredWrong, revealed, bookmarked, flagged, withNotes] =
    await Promise.all([
      db.collection(COLLECTIONS.questions).countDocuments({}),
      states.countDocuments({ userId: uid, status: 'answered_correct' }),
      states.countDocuments({ userId: uid, status: 'answered_wrong' }),
      states.countDocuments({ userId: uid, status: 'revealed' }),
      states.countDocuments({ userId: uid, bookmarked: true }),
      states.countDocuments({ userId: uid, flagged: true }),
      db.collection(COLLECTIONS.userNotes).countDocuments({
        userId: uid,
        body: { $exists: true, $ne: '' },
      }),
    ]);

  const graded = answeredCorrect + answeredWrong;
  const accuracy = graded === 0 ? null : Math.round((answeredCorrect / graded) * 1000) / 10;

  const user = await db.collection(COLLECTIONS.users).findOne({ _id: uid });
  const dates = [...(user?.activityDates || [])].sort();
  let streak = 0;
  if (dates.length) {
    const cursor = new Date(`${todayKey()}T00:00:00.000Z`);
    const set = new Set(dates);
    // allow yesterday start if no activity today yet
    if (!set.has(todayKey(cursor))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (set.has(todayKey(cursor))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  return {
    totalQuestions,
    answeredCorrect,
    answeredWrong,
    revealed,
    bookmarked,
    flagged,
    withNotes,
    graded,
    accuracy,
    streakDays: streak,
  };
}

module.exports = {
  DEFAULT_PREFERENCES,
  ensureDefaultUser,
  getDefaultUser,
  getDefaultUserId,
  updatePreferences,
  getStats,
  touchActivity,
};
