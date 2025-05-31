import express from 'express';
const router = express.Router();

// GET /admin/login
router.get('/admin/login', (req, res) => {
  res.render('login-regis/admin-login');
});

// POST /admin/login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'tsunyo' && password === 'Tsunyo2019.') {
    req.session.admin = true; // ✅ rõ ràng hơn `user = 'admin'`
    return res.redirect('/admin');
  }

  res.render('login-regis/admin-login', {
    error: 'Sai tài khoản hoặc mật khẩu'
  });
});

// GET /admin/logout
router.get('/admin/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/admin/login');
});

export default router;
