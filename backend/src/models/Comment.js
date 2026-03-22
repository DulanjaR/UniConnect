import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isAcceptedAnswer: { type: Boolean, default: false },
    status: { type: String, default: 'active', enum: ['active', 'deleted', 'flagged'] }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

export const Comment = mongoose.model('Comment', commentSchema);
