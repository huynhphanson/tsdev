import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },              // ✅ thêm slug
  client: { type: String, required: true },            // ✅ thêm client
  description: String,
  location: String,
  thumbnail: String,
  viewerUrl: String,
  uploadedAt: { type: Date, default: Date.now },
  shared: { type: Boolean, default: true },
  clientAccess: { type: Boolean, default: false },
  orderIndex: { type: Number, default: 0 },
});

export default mongoose.model('Project', projectSchema);
