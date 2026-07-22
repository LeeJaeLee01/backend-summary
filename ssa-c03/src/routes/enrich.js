const express = require('express');
const enrichment = require('../services/answerEnrichmentService');
const config = require('../config');

const router = express.Router();

router.get('/status', async (_req, res, next) => {
  try {
    res.json(await enrichment.getEnrichStatus());
  } catch (err) {
    next(err);
  }
});

router.post('/markdown', async (req, res, next) => {
  try {
    res.json(await enrichment.enrichFromMarkdown({ force: Boolean(req.body?.force) }));
  } catch (err) {
    next(err);
  }
});

router.post('/ai', async (req, res, next) => {
  try {
    const limit = req.body?.limit ?? config.enrichBatchSize;
    const number = req.body?.number;
    res.json(await enrichment.enrichWithAi({ limit, number }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
