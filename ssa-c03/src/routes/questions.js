const express = require('express');
const importService = require('../services/importService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const source = req.query.source;
    const importStatus = req.query.importStatus;

    res.json(await importService.listQuestions({ page, limit, source, importStatus }));
  } catch (err) {
    next(err);
  }
});

router.get('/:number', async (req, res, next) => {
  try {
    const question = await importService.getQuestion(req.params.number, req.query.source);
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    res.json(question);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
