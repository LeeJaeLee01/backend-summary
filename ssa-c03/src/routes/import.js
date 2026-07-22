const express = require('express');
const config = require('../config');
const importService = require('../services/importService');

const router = express.Router();

function resolveSource(req) {
  return req.body?.sourceFile || req.query?.sourceFile || config.sourceFile;
}

router.get('/status', async (req, res, next) => {
  try {
    res.json(await importService.getImportStatus(resolveSource(req)));
  } catch (err) {
    next(err);
  }
});

/** Xem schema mẫu của 1 câu (read → transform, không ghi DB) */
router.get('/preview/:number', async (req, res, next) => {
  try {
    res.json(await importService.previewOne(resolveSource(req), req.params.number));
  } catch (err) {
    next(err);
  }
});

router.get('/preview', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 3;
    res.json(await importService.previewSample(resolveSource(req), limit));
  } catch (err) {
    next(err);
  }
});

/** Import 1 câu: read → transform → save */
router.post('/one', async (req, res, next) => {
  try {
    const result = await importService.importNext(resolveSource(req), {
      count: 1,
      reset: Boolean(req.body?.reset),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** Import N câu (mỗi câu vẫn qua pipeline riêng) */
router.post('/batch', async (req, res, next) => {
  try {
    const result = await importService.importBatch(resolveSource(req), {
      batchSize: req.body?.batchSize ?? config.importBatchSize,
      reset: Boolean(req.body?.reset),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/run-all', async (req, res, next) => {
  try {
    const sourceFile = resolveSource(req);
    const batchSize = req.body?.batchSize ?? config.importBatchSize;
    const reset = Boolean(req.body?.reset);
    const results = [];

    if (reset) {
      await importService.importNext(sourceFile, { count: 0, reset: true });
    }

    while (true) {
      const result = await importService.importNext(sourceFile, { count: batchSize });
      results.push({
        saved: result.saved,
        remaining: result.remaining,
        completed: result.completed,
        last: result.processed?.[result.processed.length - 1],
      });
      if (result.completed || result.saved === 0) break;
    }

    res.json({
      batches: results,
      status: await importService.getImportStatus(sourceFile),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
