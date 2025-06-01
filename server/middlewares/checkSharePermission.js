import Project from '../models/Project.js';

export default async function checkSharePermission(req, res, next) {
  const segments = req.path.split('/').filter(Boolean);

  // Kiểm tra nếu path dạng /viewer/:client/:slug/...
  if (segments[0] !== 'viewer' || segments.length < 3) return next();

  const client = segments[1];
  const slug = segments[2];

  const entry = await Project.findOne({ client, slug });
  if (!entry) return res.status(404).render('errors/404');

  if (entry.clientAccess === true) {
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

  return res.status(403).render('errors/404');
}
