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
    isPinned: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    editedAt: { type: Date },
    moderationReason: { type: String },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'reported', 'flagged', 'hidden', 'deleted']
    }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ reportCount: -1 });
commentSchema.index({ isPinned: -1, isAcceptedAnswer: -1, createdAt: -1 });

export const Comment = mongoose.model('Comment', commentSchema);
