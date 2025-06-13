import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import Project from '../../models/Project.js';

const router = express.Router();

router.get('/configs/:client/:slug', async (req, res) => {
  const { client, slug } = req.params;

  try {
    const entry = await Project.findOne({ client, slug });

    if (!entry) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Nếu mô hình đang phát triển
    if (entry.locked === true) {
      return res.status(423).json({ error: 'Model is in development' });
    }

    // Kiểm tra quyền userClient
    if (entry.clientAccess === true) {
      const userClient = req.session?.userClient;
      if (!userClient || userClient.toLowerCase() !== client.toLowerCase()) {
        return res.status(403).json({ error: 'Client access denied' });
      }
    }

    // Kiểm tra chia sẻ công khai
    if (entry.shared !== true) {
      return res.status(403).json({ error: 'Public access denied' });
    }

    // Trả file config nếu hợp lệ
    const configPath = path.resolve('public/configs', client, `${slug}.json`);

    try {
      const data = await fs.readFile(configPath, 'utf8');
      res.type('json').send(data);
    } catch (err) {
      return res.status(404).json({ error: 'Config file not found' });
    }

  } catch (err) {
    console.error('Error in /api/configs/:client/:slug:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
