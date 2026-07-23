const express = require('express');
const progressService = require('../services/progressService');
const config = require('../config');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    res.json(
      await progressService.listStates({
        page,
        limit,
        source: req.query.source || config.defaultSource,
        status: req.query.status,
        bookmarked: req.query.bookmarked,
        flagged: req.query.flagged,
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.post('/reset-all', async (req, res, next) => {
  try {
    const source = req.body?.source || req.query.source || config.defaultSource;
    res.json(await progressService.resetAllAttempts(source));
  } catch (err) {
    next(err);
  }
});

router.get('/:number', async (req, res, next) => {
  try {
    const source = req.query.source || config.defaultSource;
    res.json(await progressService.getState(req.params.number, source));
  } catch (err) {
    next(err);
  }
});

router.patch('/:number', async (req, res, next) => {
  try {
    const source = req.body?.source || req.query.source || config.defaultSource;
    res.json(await progressService.patchState(req.params.number, req.body || {}, source));
  } catch (err) {
    next(err);
  }
});

router.post('/:number/reset', async (req, res, next) => {
  try {
    const source = req.body?.source || req.query.source || config.defaultSource;
    res.json(await progressService.resetAttempt(req.params.number, source));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
