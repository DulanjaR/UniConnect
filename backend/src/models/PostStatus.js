import mongoose from 'mongoose';

const postStatusSchema = new mongoose.Schema(
  {
    // Related post
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    // User who created the post
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Academic year of the user (e.g., 1, 2, 3, 4)
    year: { type: Number },
    // Semester of the user (e.g., 1 or 2)
    semester: { type: Number },
    // Status of the post (you can refine allowed values later)
    status: { type: String, default: 'active' }
  },
  { timestamps: true }
);

postStatusSchema.index({ post: 1 });
postStatusSchema.index({ user: 1 });

export const PostStatus = mongoose.model('PostStatus', postStatusSchema);
