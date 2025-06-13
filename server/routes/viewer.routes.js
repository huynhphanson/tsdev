import express from 'express';
import Project from '../models/Project.js';


const router = express.Router();
const frontendBase = process.env.FRONTEND;

// Kiểm tra trạng thái của mô hình
router.head('/viewer/:client/:slug', async (req, res) => {
  const { client, slug } = req.params;
  try {
    const project = await Project.findOne({ client, slug });
    if (!project) return res.sendStatus(404);
    if (!project.shared) return res.sendStatus(403);

    return res.sendStatus(200);
  } catch (err) {
    console.error('HEAD error:', err);
    return res.sendStatus(500);
  }
});

router.get('/viewer/:client/:slug', async (req, res) => {
  const { client, slug } = req.params;

  try {
    const project = await Project.findOne({ client, slug });

    if (!project) {
      return res.status(404).render('errors/404', {
        message: `Không tìm thấy mô hình "${slug}" thuộc client "${client}".`
      });
    }

    if (project.locked) {
      return res.status(423).render('errors/423', {
        message: `Mô hình "${slug}" đang được phát triển.`
      });
    }

    if (!project.shared && !req.session?.userClient) {
      return res.status(403).render('errors/403', {
        message: `Bạn không có quyền truy cập mô hình "${slug}".`
      });
    }

    // ✅ Nếu hợp lệ thì redirect sang frontend
    const frontendURL = `${frontendBase}/viewer/${client}/${slug}/`;
    return res.redirect(frontendURL);

  } catch (err) {
    console.error('viewer error:', err);
    return res.status(500).render('errors/403', {
      message: 'Lỗi hệ thống khi xử lý mô hình.'
    });
  }
});


export default router;
