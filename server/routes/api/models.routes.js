// server/routes/api/config.routes.js
import express from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// GET /api/config/:client/:slug
router.get('/configs/:client/:slug', async (req, res) => {
  const { client, slug } = req.params;
  // TODO: kiểm soát quyền ở đây nếu cần
  try {
    const configPath = path.resolve('public/configs', client, `${slug}.json`);
    const data = await fs.readFile(configPath, 'utf8');
    res.type('json').send(data);
  } catch (err) {
    res.status(404).json({ error: 'Config not found' });
  }
});

export default router;
