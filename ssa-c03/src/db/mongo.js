const { MongoClient } = require('mongodb');
const config = require('../config');

let client;
let db;

const COLLECTIONS = {
  questions: 'questions',
  importJobs: 'import_jobs',
  users: 'users',
  userNotes: 'user_notes',
  userQuestionState: 'user_question_state',
  examSessions: 'exam_sessions',
};

async function initCollections() {
  const questions = db.collection(COLLECTIONS.questions);
  const importJobs = db.collection(COLLECTIONS.importJobs);
  const users = db.collection(COLLECTIONS.users);
  const userNotes = db.collection(COLLECTIONS.userNotes);
  const userQuestionState = db.collection(COLLECTIONS.userQuestionState);
  const examSessions = db.collection(COLLECTIONS.examSessions);

  await questions.createIndex({ number: 1, source: 1 }, { unique: true });
  await questions.createIndex({ source: 1 });
  await questions.createIndex({ importStatus: 1 });
  await questions.createIndex({ title: 1 });

  await importJobs.createIndex({ sourceFile: 1 }, { unique: true });

  await users.createIndex({ username: 1 }, { unique: true });

  await userNotes.createIndex(
    { userId: 1, questionNumber: 1, source: 1 },
    { unique: true },
  );
  await userNotes.createIndex({ userId: 1, updatedAt: -1 });

  await userQuestionState.createIndex(
    { userId: 1, questionNumber: 1, source: 1 },
    { unique: true },
  );
  await userQuestionState.createIndex({ userId: 1, status: 1 });
  await userQuestionState.createIndex({ userId: 1, bookmarked: 1 });
  await userQuestionState.createIndex({ userId: 1, flagged: 1 });

  await examSessions.createIndex({ userId: 1, createdAt: -1 });
  await examSessions.createIndex({ status: 1 });
}

async function resetDatabase() {
  if (!db) {
    client = new MongoClient(config.mongodbUri);
    await client.connect();
    db = client.db();
  }

  await db.collection(COLLECTIONS.questions).drop().catch(() => {});
  await db.collection(COLLECTIONS.importJobs).drop().catch(() => {});
  await db.collection(COLLECTIONS.users).drop().catch(() => {});
  await db.collection(COLLECTIONS.userNotes).drop().catch(() => {});
  await db.collection(COLLECTIONS.userQuestionState).drop().catch(() => {});
  await db.collection(COLLECTIONS.examSessions).drop().catch(() => {});
  await initCollections();

  return {
    database: db.databaseName,
    collections: Object.values(COLLECTIONS),
  };
}

async function connectMongo() {
  if (db) return db;

  client = new MongoClient(config.mongodbUri);
  await client.connect();
  db = client.db();

  await initCollections();

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongo() first.');
  }
  return db;
}

async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connectMongo,
  getDb,
  closeMongo,
  resetDatabase,
  COLLECTIONS,
};
