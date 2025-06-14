import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
      break;
    } catch (err) {
      attempt++;
      console.log(`❌ MongoDB connection failed (attempt ${attempt}): ${err.message}`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
};

export default connectDB;