import express from 'express';
import User from '../models/User.js';

const router = express.Router();


// Đăng Nhập
router.get('/user/login', (req, res) => {
  res.render('login-regis/user-login');
});

router.post('/user/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user || user.password !== password) {
    return res.render('login-regis/user-login', { error: 'Sai tài khoản hoặc mật khẩu' });
  }

  req.session.userClient = user.client; // dùng cho checkSharePermission
  req.session.username = user.username; // dùng để hiển thị avatar

  res.redirect('/');
});


router.get('/user/logout', (req, res) => {
  req.session.userClient = null;
  req.session.username = null;
  res.redirect('/');
});

// Đăng ký
router.get('/user/register', (req, res) => {
  res.render('login-regis/user-register');
});

router.post('/user/register', async (req, res) => {
  const { username, password, confirm } = req.body;

  if (!username || !password || !confirm) {
    return res.render('login-regis/user-register', { error: 'Vui lòng nhập đầy đủ thông tin' });
  }
  if (password !== confirm) {
    return res.render('login-regis/user-register', { error: 'Mật khẩu không khớp' });
  }

  const existing = await User.findOne({ username });
  if (existing) {
    return res.render('login-regis/user-register', { error: 'Tên đăng nhập đã tồn tại' });
  }

  const user = await User.create({ username, password });

  res.redirect('/user/login');
});

export default router;
