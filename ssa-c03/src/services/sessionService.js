const { ObjectId } = require('mongodb');
const { getDb, COLLECTIONS } = require('../db/mongo');
const config = require('../config');
const { getDefaultUserId, touchActivity, updatePreferences } = require('./userService');
const { recordAttempt } = require('./progressService');

function sameAnswers(selected = [], correct = []) {
  const a = [...selected].map(String).map((s) => s.toUpperCase()).sort();
  const b = [...correct].map(String).map((s) => s.toUpperCase()).sort();
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

async function createSession({ mode = 'practice', count, questionNumbers, source } = {}) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const src = source || config.defaultSource;
  const now = new Date();

  let numbers = Array.isArray(questionNumbers)
    ? questionNumbers.map(Number).filter(Boolean)
    : null;

  if (!numbers || numbers.length === 0) {
    const all = await db
      .collection(COLLECTIONS.questions)
      .find({ source: src })
      .project({ number: 1 })
      .sort({ number: 1 })
      .toArray();
    const pool = all.map((q) => q.number);

    if (mode === 'exam') {
      const user = await db.collection(COLLECTIONS.users).findOne({ _id: userId });
      const n = Number(count) || user?.preferences?.examQuestionCount || 65;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      numbers = shuffled.slice(0, Math.min(n, shuffled.length));
    } else {
      numbers = pool;
    }
  }

  let endsAt = null;
  if (mode === 'exam') {
    const user = await db.collection(COLLECTIONS.users).findOne({ _id: userId });
    const minutes = user?.preferences?.examMinutes || 130;
    endsAt = new Date(now.getTime() + minutes * 60 * 1000);
  }

  const doc = {
    userId,
    mode,
    source: src,
    questionNumbers: numbers,
    answers: {},
    results: {},
    currentIndex: 0,
    startedAt: now,
    endsAt,
    completedAt: null,
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTIONS.examSessions).insertOne(doc);
  await touchActivity(userId);
  return { ...doc, _id: result.insertedId };
}

async function getSession(id) {
  const db = getDb();
  const session = await db.collection(COLLECTIONS.examSessions).findOne({
    _id: new ObjectId(id),
  });
  return session;
}

async function getQuestionForSession(session, number) {
  const db = getDb();
  return db.collection(COLLECTIONS.questions).findOne({
    number: Number(number),
    source: session.source,
  });
}

function stripAnswers(question, { reveal }) {
  if (!question) return null;
  if (reveal) return question;
  const { correctAnswers, summaryNote, ...rest } = question;
  return {
    ...rest,
    options: (question.options || []).map(({ explanation, ...opt }) => ({
      ...opt,
      explanation: '',
    })),
    correctAnswers: [],
    summaryNote: '',
  };
}

async function answerQuestion(sessionId, { number, selected = [] }) {
  const db = getDb();
  const session = await getSession(sessionId);
  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }
  if (session.status !== 'in_progress') {
    const err = new Error('Session is not in progress');
    err.status = 400;
    throw err;
  }
  if (session.endsAt && new Date() > new Date(session.endsAt)) {
    return finishSession(sessionId);
  }

  const qNumber = Number(number);
  if (!session.questionNumbers.includes(qNumber)) {
    const err = new Error('Question not in session');
    err.status = 400;
    throw err;
  }

  const question = await getQuestionForSession(session, qNumber);
  if (!question) {
    const err = new Error('Question not found');
    err.status = 404;
    throw err;
  }

  const selectedKeys = [...selected].map((s) => String(s).toUpperCase());
  const answers = { ...(session.answers || {}), [String(qNumber)]: selectedKeys };

  let payload = {
    number: qNumber,
    selected: selectedKeys,
    graded: false,
  };

  if (session.mode === 'practice') {
    const correct = sameAnswers(selectedKeys, question.correctAnswers || []);
    const results = {
      ...(session.results || {}),
      [String(qNumber)]: { correct, selected: selectedKeys },
    };
    await db.collection(COLLECTIONS.examSessions).updateOne(
      { _id: session._id },
      { $set: { answers, results, updatedAt: new Date() } },
    );
    await recordAttempt({
      questionNumber: qNumber,
      source: session.source,
      selected: selectedKeys,
      result: correct ? 'correct' : 'wrong',
      status: correct ? 'answered_correct' : 'answered_wrong',
    });
    await updatePreferences({ lastQuestionNumber: qNumber, lastSource: session.source });
    payload = {
      ...payload,
      graded: true,
      correct,
      correctAnswers: question.correctAnswers || [],
      summaryNote: question.summaryNote || '',
      options: question.options || [],
    };
  } else if (session.mode === 'exam') {
    await db.collection(COLLECTIONS.examSessions).updateOne(
      { _id: session._id },
      { $set: { answers, updatedAt: new Date() } },
    );
    await updatePreferences({ lastQuestionNumber: qNumber, lastSource: session.source });
  } else {
    // study: selecting does not grade; use reveal endpoint
    await db.collection(COLLECTIONS.examSessions).updateOne(
      { _id: session._id },
      { $set: { answers, updatedAt: new Date() } },
    );
  }

  return payload;
}

async function revealQuestion(sessionId, { number }) {
  const session = await getSession(sessionId);
  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }
  if (session.mode === 'exam' && session.status === 'in_progress') {
    const err = new Error('Reveal is disabled during an active exam');
    err.status = 400;
    throw err;
  }

  const qNumber = Number(number);
  const question = await getQuestionForSession(session, qNumber);
  if (!question) {
    const err = new Error('Question not found');
    err.status = 404;
    throw err;
  }

  await recordAttempt({
    questionNumber: qNumber,
    source: session.source,
    selected: session.answers?.[String(qNumber)] || [],
    result: 'revealed',
    status: 'revealed',
  });
  await updatePreferences({ lastQuestionNumber: qNumber, lastSource: session.source });

  return {
    number: qNumber,
    correctAnswers: question.correctAnswers || [],
    summaryNote: question.summaryNote || '',
    options: question.options || [],
  };
}

async function finishSession(sessionId) {
  const db = getDb();
  const session = await getSession(sessionId);
  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }
  if (session.status === 'completed') {
    return session;
  }

  const results = { ...(session.results || {}) };
  let correctCount = 0;

  for (const number of session.questionNumbers) {
    const key = String(number);
    const selected = session.answers?.[key] || [];
    const question = await getQuestionForSession(session, number);
    const correct = sameAnswers(selected, question?.correctAnswers || []);
    if (correct) correctCount += 1;
    results[key] = { correct, selected };

    if (session.mode === 'exam') {
      await recordAttempt({
        questionNumber: number,
        source: session.source,
        selected,
        result: correct ? 'correct' : 'wrong',
        status: correct ? 'answered_correct' : 'answered_wrong',
      });
    }
  }

  const completedAt = new Date();
  const score = {
    correct: correctCount,
    total: session.questionNumbers.length,
    percent:
      session.questionNumbers.length === 0
        ? 0
        : Math.round((correctCount / session.questionNumbers.length) * 1000) / 10,
  };

  await db.collection(COLLECTIONS.examSessions).updateOne(
    { _id: session._id },
    {
      $set: {
        results,
        score,
        status: 'completed',
        completedAt,
        updatedAt: completedAt,
      },
    },
  );

  await touchActivity(session.userId);
  return getSession(sessionId);
}

module.exports = {
  sameAnswers,
  createSession,
  getSession,
  answerQuestion,
  revealQuestion,
  finishSession,
  stripAnswers,
  getQuestionForSession,
};
