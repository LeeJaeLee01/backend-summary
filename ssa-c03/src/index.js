const express = require('express');
const config = require('./config');
const { connectMongo } = require('./db/mongo');
const importRoutes = require('./routes/import');
const questionRoutes = require('./routes/questions');
const enrichRoutes = require('./routes/enrich');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ssa-c03' });
});

app.use('/import', importRoutes);
app.use('/questions', questionRoutes);
app.use('/enrich', enrichRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

async function start() {
  await connectMongo();
  app.listen(config.port, () => {
    console.log(`ssa-c03 API listening on http://localhost:${config.port}`);
    console.log(`Default source: ${config.sourceFile}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
