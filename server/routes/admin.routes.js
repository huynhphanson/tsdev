// routes/admin.routes.js
import express from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';

const router = express.Router();

// ✅ Route đúng duy nhất
router.get('/', async (req, res) => {
  const projects = await Project.find().sort({ uploadedAt: -1 });
  const users = await User.find().sort({ createdAt: -1 });
  res.render('admin/index', { projects, users });
});


export default router;
