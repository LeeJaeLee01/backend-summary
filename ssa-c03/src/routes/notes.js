const express = require('express');
const noteService = require('../services/noteService');
const config = require('../config');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const source = req.query.source || config.defaultSource;
    res.json(await noteService.listNotes({ page, limit, source }));
  } catch (err) {
    next(err);
  }
});

router.get('/:number', async (req, res, next) => {
  try {
    const source = req.query.source || config.defaultSource;
    res.json(await noteService.getNote(req.params.number, source));
  } catch (err) {
    next(err);
  }
});

router.put('/:number', async (req, res, next) => {
  try {
    const source = req.body?.source || req.query.source || config.defaultSource;
    const body = req.body?.body ?? '';
    res.json(await noteService.upsertNote(req.params.number, body, source));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
