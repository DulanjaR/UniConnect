import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 300 },
    image: { type: String, trim: true },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ createdBy: 1, createdAt: -1 });

export const Group = mongoose.model('Group', groupSchema);
