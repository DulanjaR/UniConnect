import mongoose from 'mongoose';

const postShareSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedToGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    caption: { type: String }, // Optional caption when sharing
    status: { type: String, default: 'active', enum: ['active', 'deleted'] }
  },
  { timestamps: true }
);

postShareSchema.index({ post: 1 });
postShareSchema.index({ sharedBy: 1 });
postShareSchema.index({ sharedToGroup: 1 });
postShareSchema.index({ post: 1, sharedToGroup: 1 });

const PostShare = mongoose.model('PostShare', postShareSchema);

export { PostShare };
