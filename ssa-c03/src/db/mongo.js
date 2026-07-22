const { MongoClient } = require('mongodb');
const config = require('../config');

let client;
let db;

const COLLECTIONS = {
  questions: 'questions',
  importJobs: 'import_jobs',
};

async function initCollections() {
  const questions = db.collection(COLLECTIONS.questions);
  const importJobs = db.collection(COLLECTIONS.importJobs);

  await questions.createIndex({ number: 1, source: 1 }, { unique: true });
  await questions.createIndex({ source: 1 });
  await questions.createIndex({ importStatus: 1 });

  await importJobs.createIndex({ sourceFile: 1 }, { unique: true });
}

async function resetDatabase() {
  if (!db) {
    client = new MongoClient(config.mongodbUri);
    await client.connect();
    db = client.db();
  }

  await db.collection(COLLECTIONS.questions).drop().catch(() => {});
  await db.collection(COLLECTIONS.importJobs).drop().catch(() => {});
  await initCollections();

  return {
    database: db.databaseName,
    collections: [COLLECTIONS.questions, COLLECTIONS.importJobs],
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
