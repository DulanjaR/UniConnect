import mongoose from 'mongoose';

const groupMessageReplySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

const groupMessageSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    attachments: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [groupMessageReplySchema]
  },
  { timestamps: true }
);

groupMessageSchema.index({ groupId: 1, createdAt: -1 });
groupMessageSchema.index({ userId: 1, createdAt: -1 });
groupMessageSchema.index({ 'replies.userId': 1 });

export const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
