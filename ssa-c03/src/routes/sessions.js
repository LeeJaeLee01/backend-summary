const express = require('express');
const sessionService = require('../services/sessionService');
const config = require('../config');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const session = await sessionService.createSession({
      mode: req.body?.mode || 'practice',
      count: req.body?.count,
      questionNumbers: req.body?.questionNumbers,
      source: req.body?.source || config.defaultSource,
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const session = await sessionService.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const reveal =
      session.status === 'completed' ||
      session.mode === 'study' ||
      req.query.reveal === 'true';

    // attach current question optionally
    let question = null;
    const number = req.query.number
      ? Number(req.query.number)
      : session.questionNumbers[session.currentIndex || 0];

    if (number) {
      const raw = await sessionService.getQuestionForSession(session, number);
      question = sessionService.stripAnswers(raw, {
        reveal: reveal || session.mode === 'practice',
      });
      // practice still hides until graded — strip unless reveal flag or completed
      if (session.mode === 'practice' && session.status === 'in_progress' && !req.query.reveal) {
        const already = session.results?.[String(number)];
        question = sessionService.stripAnswers(raw, { reveal: Boolean(already) });
      }
      if (session.mode === 'exam' && session.status === 'in_progress') {
        question = sessionService.stripAnswers(raw, { reveal: false });
      }
    }

    res.json({ session, question });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/answer', async (req, res, next) => {
  try {
    const result = await sessionService.answerQuestion(req.params.id, {
      number: req.body?.number,
      selected: req.body?.selected || [],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reveal', async (req, res, next) => {
  try {
    const result = await sessionService.revealQuestion(req.params.id, {
      number: req.body?.number,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/finish', async (req, res, next) => {
  try {
    const session = await sessionService.finishSession(req.params.id);
    res.json(session);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
