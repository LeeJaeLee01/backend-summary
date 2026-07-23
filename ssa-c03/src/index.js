const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectMongo } = require('./db/mongo');
const { ensureDefaultUser } = require('./services/userService');
const importRoutes = require('./routes/import');
const questionRoutes = require('./routes/questions');
const enrichRoutes = require('./routes/enrich');
const meRoutes = require('./routes/me');
const notesRoutes = require('./routes/notes');
const progressRoutes = require('./routes/progress');
const sessionsRoutes = require('./routes/sessions');

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        config.corsOrigins.includes(origin) ||
        origin === config.corsOrigin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ssa-c03' });
});

app.use('/import', importRoutes);
app.use('/questions', questionRoutes);
app.use('/enrich', enrichRoutes);
app.use('/me', meRoutes);
app.use('/notes', notesRoutes);
app.use('/progress', progressRoutes);
app.use('/sessions', sessionsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

async function start() {
  await connectMongo();
  await ensureDefaultUser();
  app.listen(config.port, () => {
    console.log(`ssa-c03 API listening on http://localhost:${config.port}`);
    console.log(`Default source: ${config.sourceFile}`);
    console.log(`CORS origins: ${config.corsOrigins.join(', ')}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
