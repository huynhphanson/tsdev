import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Project from '../../models/Project.js';

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET all projects
router.get('/', async (req, res) => {
  const projects = await Project.find().sort({ uploadedAt: -1 });
  res.json(projects);
});

// GET by client + slug
router.get('/:client/:slug', async (req, res) => {
  const { client, slug } = req.params;
  const project = await Project.findOne({ client, slug });
  if (!project) return res.sendStatus(404);
  res.json(project);
});

// CREATE new project
router.post('/', upload.single('thumbnail'), async (req, res) => {
  try {
    const { name, slug, client, description, location } = req.body;
    const thumbnailPath = req.file ? '/uploads/' + req.file.filename : '/uploads/default.jpg';
    const viewerUrl = `/viewer/${client}/${slug}/`;

    const created = await Project.create({
      name: name?.trim() || 'Chưa đặt tên',
      slug: slug?.trim() || 'slug-none',
      client,
      description: description?.trim() || 'Không có mô tả',
      location: location?.trim() || 'Không xác định',
      thumbnail: thumbnailPath,
      viewerUrl,
      shared: true,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Lỗi tạo mới:', err.message);
    res.status(500).json({ error: 'Tạo mới thất bại', details: err.message });
  }
});

// UPDATE project by client + slug
router.put('/:client/:slug', upload.single('thumbnail'), async (req, res) => {
  const { client, slug } = req.params;
  const update = {
    name: req.body.name,
    slug: req.body.slug,
    description: req.body.description,
    location: req.body.location,
  };

  if (req.file) {
    const oldProject = await Project.findOne({ client, slug });
    if (!oldProject) return res.sendStatus(404);

    if (oldProject.thumbnail) {
      const oldPath = path.join('public', oldProject.thumbnail);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    update.thumbnail = '/uploads/' + req.file.filename;
  }

  const updated = await Project.findOneAndUpdate({ client, slug }, update, { new: true });
  if (!updated) return res.sendStatus(404);

  res.json(updated);
});

// DELETE by client + slug
router.delete('/:client/:slug', async (req, res) => {
  const { client, slug } = req.params;
  const project = await Project.findOne({ client, slug });
  if (!project) return res.sendStatus(404);

  if (project.thumbnail) {
    const imgPath = path.join('public', project.thumbnail);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  await project.deleteOne();
  res.sendStatus(204);
});

// TOGGLE public share
router.patch('/:client/:slug/toggle-share', async (req, res) => {
  const { client, slug } = req.params;
  const project = await Project.findOne({ client, slug });
  if (!project) return res.sendStatus(404);

  project.shared = !project.shared;
  await project.save();

  res.json({ shared: project.shared });
});

// TOGGLE client-only access
router.patch('/:client/:slug/client-access', async (req, res) => {
  const { client, slug } = req.params;
  const { clientAccess } = req.body;

  const project = await Project.findOne({ client, slug });
  if (!project) return res.sendStatus(404);

  project.clientAccess = !!clientAccess;
  await project.save();

  res.json({ clientAccess: project.clientAccess });
});

// Sort Order Cards
router.patch('/order', async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.sendStatus(400);

  await Promise.all(order.map((id, index) =>
    Project.findByIdAndUpdate(id, { orderIndex: index })
  ));

  res.sendStatus(200);
});

export default router;
