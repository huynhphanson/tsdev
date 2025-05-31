// routes/api/users.routes.js
import express from 'express';
import User from '../../models/User.js';

const router = express.Router();

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Không thể xoá người dùng' });
  }
});

router.patch('/:id/client', async (req, res) => {
  const { id } = req.params;
  const { client } = req.body;

  if (!client) return res.status(400).json({ error: 'Thiếu client' });

  const updated = await User.findByIdAndUpdate(id, { client }, { new: true });
  if (!updated) return res.sendStatus(404);

  res.json({ success: true });
});

// PATCH /api/users/:id/update-client
router.patch('/:id/update-client', async (req, res) => {
  const { id } = req.params;
  const { client } = req.body;

  console.log('[PATCH] update-client', id, client);
  if (!id || !client) return res.status(400).send('Thiếu dữ liệu');

  try {
    const updated = await User.findByIdAndUpdate(id, { client }, { new: true });
    if (!updated) return res.status(404).send('User không tồn tại');

    // ✅ Nếu người đang đăng nhập là người bị cập nhật → update session
    if (req.session?.username && updated.username === req.session.username) {
      req.session.userClient = updated.client;
    }

    res.sendStatus(204);
  } catch (err) {
    console.error('Lỗi cập nhật client:', err);
    res.status(500).send('Lỗi server');
  }
});



export default router;
