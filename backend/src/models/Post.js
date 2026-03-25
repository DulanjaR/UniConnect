import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    tags: [{ type: String }],
    category: {
      type: String,
      enum: ['study', 'lost', 'found'],
      required: true
    },
    imageUrl: { type: String },
    isPublished: { type: Boolean, default: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    searchKeywords: [{ type: String }],
    year: { type: Number },
    semester: { type: Number },
    status: { type: String, default: 'active', enum: ['active', 'archived', 'deleted'] }
  },
  { timestamps: true }
);

// Separate text search from array/category filters. Mixing the old text index
// with tags caused MongoDB to reject documents where tags is an array.
postSchema.index({ title: 'text', body: 'text' });
postSchema.index({ tags: 1, category: 1 });
postSchema.index({ author: 1 });
postSchema.index({ createdAt: -1 });

export const Post = mongoose.model('Post', postSchema);
