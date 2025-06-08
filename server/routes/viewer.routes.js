import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/viewer/:client/:slug', (req, res) => {
  const { client, slug } = req.params;

  const configPath = path.resolve('public/configs', client, slug, 'config.json');

  // Nếu không tồn tại file config → 404
  if (!fs.existsSync(configPath)) {
    return res.status(404).render('errors/404', {
      message: `Không tìm thấy mô hình "${slug}" thuộc client "${client}".`
    });
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Nếu tắt quyền chia sẻ → 403
  if (!config.share) {
    return res.status(403).render('errors/403', {
      message: `Mô hình "${config.name}" đã bị tắt quyền chia sẻ.`
    });
  }

  const frontendURL = `http://localhost:5173/viewer/${client}/${slug}/`;
  return res.redirect(frontendURL);
});

export default router;
