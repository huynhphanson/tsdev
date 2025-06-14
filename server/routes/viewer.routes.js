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
      return res.status(404).render('errors/404');
    }

    if (project.locked) {
      return res.status(423).render('errors/423');
    }

    if (!project.shared && !req.session?.userClient) {
      return res.status(403).render('errors/403');
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
