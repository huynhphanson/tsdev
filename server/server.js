import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { configViewEngine } from './configs/configViewEngine.js';
import connectProjectDB from './configs/connectProjectDB.js';
import adminRoutes from './routes/admin.routes.js';
import projectApiRoutes from './routes/api/projects.routes.js';
import userApiRoutes from './routes/api/users.routes.js';
import authAdminRoutes from './routes/auth.admin.routes.js';
import authUserRoutes from './routes/auth.user.routes.js';
import Project from './models/Project.js';
import checkSharePermission from './middlewares/checkSharePermission.js';



const app = express();
const PORT = process.env.PORT || 3008;

// ✅ Kết nối DB
connectProjectDB();



// ✅ Middleware cơ bản
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ middleware chạy trước static
app.use(checkSharePermission);
// ✅ Cấu hình view engine và static
configViewEngine(app);

// ✅ Auth & routes
app.use(authAdminRoutes);
app.use(authUserRoutes);

// ✅ Admin & API
app.use('/admin', adminRoutes);
app.use('/api/projects', projectApiRoutes);
app.use('/api/users', userApiRoutes);

// ✅ Trang chủ
app.get('/', async (req, res) => {
  const projects = await Project.find().sort({ uploadedAt: -1 });
  res.render('home/index', { 
    projects,
    userClient: req.session?.userClient || null,
    username: req.session?.username || null
  });
});

// ✅ Bắt tất cả các route không khớp
app.use((req, res) => {
  res.status(404).render('errors/404');
});

// ✅ Khởi động server
app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}: http://localhost:${PORT}`);
});
