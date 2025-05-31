import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  client: {
    type: String,
    default: 'GENERAL'  // ✅ mặc định nếu không truyền
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


export default mongoose.model('User', userSchema);
