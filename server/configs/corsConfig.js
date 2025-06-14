// server/configs/corsConfig.js
import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = (process.env.FRONTEND_CORS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

export default corsOptions;
