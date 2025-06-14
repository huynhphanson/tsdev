import express from 'express';
import Project from '../models/Project.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ orderIndex: 1, uploadedAt: -1 });
    res.render('home/index', {
      projects,
      userClient: req.session?.userClient || null,
      username: req.session?.username || null
    });
  } catch (err) {
    console.error('Error loading homepage:', err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
