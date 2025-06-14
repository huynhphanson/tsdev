import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { configViewEngine } from './configs/configViewEngine.js';
import corsOptions from './configs/corsConfig.js';
import connectProjectDB from './configs/connectProjectDB.js';
import homeRoutes from './routes/home.routes.js'
import adminRoutes from './routes/admin.routes.js';
import modelMetaRoutes from './routes/api/modelMeta.routes.js'
import projectApiRoutes from './routes/api/projects.routes.js';
import userApiRoutes from './routes/api/users.routes.js';
import authAdminRoutes from './routes/auth.admin.routes.js';
import authUserRoutes from './routes/auth.user.routes.js';
import Project from './models/Project.js';
import checkSharePermission from './middlewares/checkSharePermission.js';
import modelsRoutes from './routes/api/models.routes.js';
import viewerRoutes from './routes/viewer.routes.js'

console.log('NODE_ENV =', process.env.NODE_ENV);
console.log('FRONTEND =', process.env.FRONTEND);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Kết nối DB
connectProjectDB();
app.use(cors(corsOptions));


// ✅ Middleware cơ bản
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ middleware chạy trước static
app.use(checkSharePermission);
// ✅ Cấu hình view engine và static
configViewEngine(app);

// viewer Routes
app.use(viewerRoutes);

// ✅ Auth & routes
app.use(authAdminRoutes);
app.use(authUserRoutes);

// Models
app.use('/api', modelsRoutes);
app.use('/api/model-meta', modelMetaRoutes);

// ✅ Admin & API
app.use('/admin', adminRoutes);
app.use('/api/projects', projectApiRoutes);
app.use('/api/users', userApiRoutes);

// ✅ Trang chủ
app.get('/', homeRoutes);

// ✅ Bắt tất cả các route không khớp
app.use((req, res) => {
  res.status(404).render('errors/404');
});

// ✅ Khởi động server
app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}: http://localhost:${PORT}`);
});
