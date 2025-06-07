// server/routes/api/config.routes.js
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import Project from '../../models/Project.js';

const router = express.Router();

// GET /api/config/:client/:slug
router.get('/configs/:client/:slug', async (req, res) => {
  const { client, slug } = req.params;

  // Kiểm tra quyền ở đây
  const entry = await Project.findOne({ client, slug });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  // Nếu chỉ dành cho userClient
  if (entry.clientAccess === true) {
    const userClient = req.session?.userClient;
    if (!userClient || userClient.toLowerCase() !== client.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (entry.shared !== true) {
    // Không chia sẻ công khai
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Trả file config nếu có quyền
  try {
    const configPath = path.resolve('public/configs', client, `${slug}.json`);
    const data = await fs.readFile(configPath, 'utf8');
    res.type('json').send(data);
  } catch (err) {
    res.status(404).json({ error: 'Config not found' });
  }
});


export default router;
