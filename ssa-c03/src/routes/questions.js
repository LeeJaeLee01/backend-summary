const express = require('express');
const importService = require('../services/importService');
const progressService = require('../services/progressService');
const noteService = require('../services/noteService');
const config = require('../config');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const source = req.query.source || config.defaultSource;
    const importStatus = req.query.importStatus;
    const status = req.query.status;
    const bookmarked = req.query.bookmarked;
    const flagged = req.query.flagged;
    const q = (req.query.q || '').trim();

    res.json(
      await importService.listQuestions({
        page,
        limit,
        source,
        importStatus,
        status,
        bookmarked,
        flagged,
        q,
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:number', async (req, res, next) => {
  try {
    const source = req.query.source || config.defaultSource;
    const question = await importService.getQuestion(req.params.number, source);
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const include = String(req.query.include || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = { ...question };
    if (include.includes('state')) {
      payload.userState = await progressService.getState(req.params.number, source);
    }
    if (include.includes('note')) {
      payload.note = await noteService.getNote(req.params.number, source);
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
