export function requireAdminLogin(req, res, next) {
  if (req.session?.admin === true) return next();
  return res.redirect('/admin/login');
}
