import express from 'express';
import Project from '../models/Project.js';

const router = express.Router();

// Middleware kiểm tra chia sẻ
async function checkSharePermission(req, res, next) {
  const { client, slug } = req.params;
  const entry = await Project.findOne({ client, slug });
  if (!entry) return res.status(404).render('errors/404');

  if (entry.clientAccess === true) {
    res.locals.clientAccess = true;
    const userClient = req.session?.userClient;
    if (!userClient || userClient.toLowerCase() !== client.toLowerCase()) {
      return res.status(403).render('errors/403');
    }
    req.projectEntry = entry;
    return next();
  }

  if (entry.shared === true) {
    req.projectEntry = entry;
    return next();
  }

  return res.status(403).render('errors/403');
}

// ✅ Redirect tới file static đã public sẵn
router.get('/viewer/:client/:slug/', checkSharePermission, (req, res) => {
  const { client, slug } = req.projectEntry;
  return res.redirect(`/_viewer/${client}/${slug}/index.html`);
});

export default router;
