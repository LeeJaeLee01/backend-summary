const express = require('express');
const userService = require('../services/userService');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const user = await userService.getDefaultUser();
    const stats = await userService.getStats(user._id);
    res.json({ user, stats });
  } catch (err) {
    next(err);
  }
});

router.patch('/preferences', async (req, res, next) => {
  try {
    const user = await userService.updatePreferences(req.body || {});
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
