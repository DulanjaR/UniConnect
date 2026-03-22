import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    // academic or topic tags
    tags: [{ type: String }],
    // category-based posting (currently only "study")
    category: {
      type: String,
      enum: ['study'],
      required: true
    },
    // image URL (e.g. from Cloudinary)
    imageUrl: { type: String },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Post = mongoose.model('Post', postSchema);
