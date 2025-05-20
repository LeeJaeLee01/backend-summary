import express from 'express';
import { safeGet, safeSet } from './redis/index.js';

const app = express();
const port = 3030;

app.use(express.json());

app.post('/set', async (req, res) => {
  try {
    const { key, value } = req.body;
    await safeSet(key, value);
    res.json({ status: 'ok', key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/get/:key', async (req, res) => {
  try {
    const value = await safeGet(req.params.key);
    res.json({ key: req.params.key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
