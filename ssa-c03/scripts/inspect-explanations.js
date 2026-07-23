const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssa_c03';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const total = await db.collection('questions').countDocuments();
  const withAnyExpl = await db.collection('questions').countDocuments({
    options: { $elemMatch: { explanation: { $exists: true, $nin: [null, ''] } } },
  });

  const cursor = db.collection('questions').find({}).project({
    number: 1,
    correctAnswers: 1,
    summaryNote: 1,
    options: 1,
  });

  let missingAll = 0;
  let missingSome = 0;
  let complete = 0;
  let emptyCorrectExpl = 0;
  const samples = [];

  for await (const q of cursor) {
    const opts = q.options || [];
    const empty = opts.filter((o) => !o.explanation || !String(o.explanation).trim());
    const filled = opts.length - empty.length;
    if (filled === 0) missingAll += 1;
    else if (empty.length > 0) missingSome += 1;
    else complete += 1;

    const correct = new Set((q.correctAnswers || []).map((k) => String(k).toUpperCase()));
    for (const o of opts) {
      if (correct.has(String(o.key).toUpperCase()) && (!o.explanation || !String(o.explanation).trim())) {
        emptyCorrectExpl += 1;
      }
    }

    if (samples.length < 3 && empty.length > 0) {
      samples.push({
        number: q.number,
        correctAnswers: q.correctAnswers,
        summaryNote: (q.summaryNote || '').slice(0, 160),
        options: opts.map((o) => ({
          key: o.key,
          en: (o.text?.en || '').slice(0, 80),
          expl: (o.explanation || '').slice(0, 100),
        })),
      });
    }
  }

  console.log(
    JSON.stringify(
      { total, withAnyExpl, complete, missingSome, missingAll, emptyCorrectExpl, samples },
      null,
      2,
    ),
  );
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
