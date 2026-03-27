import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    tags: [{ type: String }],
    category: {
      type: String,
      enum: ['study'],
      required: true,
      default: 'study'
    },
    imageUrl: { type: String },
    isPublished: { type: Boolean, default: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PostShare' }], // Track shares
    commentCount: { type: Number, default: 0 }, // Denormalized for faster queries
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    searchKeywords: [{ type: String }],
    year: { type: Number },
    semester: { type: Number },
    status: { type: String, default: 'active', enum: ['active', 'archived', 'deleted'] }
  },
  { timestamps: true }
);

// Index for search and filtering
postSchema.index({ title: 'text', body: 'text' });
postSchema.index({ category: 1, tags: 1 });
postSchema.index({ author: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

// Drop old problematic index on startup
setTimeout(async () => {
  try {
    await Post.collection.dropIndex('title_text_body_text_tags_1_category_1');
    console.log('✓ Dropped old problematic index from database');
  } catch (err) {
    if (err.message.includes('index not found')) {
      console.log('✓ Old index not found in database (already cleaned)');
    } else {
      console.log('Note:', err.message);
    }
  }
}, 1000);

export { Post };
