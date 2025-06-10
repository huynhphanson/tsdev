// server/routes/api/modelMeta.routes.js
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIGS_DIR = path.join(__dirname, '../../public/configs');
console.log(CONFIGS_DIR);
router.get('/clients', (req, res) => {
  const result = {};

  fs.readdirSync(CONFIGS_DIR).forEach(client => {
    const clientDir = path.join(CONFIGS_DIR, client);
    if (fs.statSync(clientDir).isDirectory()) {
      const slugs = fs.readdirSync(clientDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      result[client] = slugs;
    }
  });

  res.json(result);
});

export default router;
