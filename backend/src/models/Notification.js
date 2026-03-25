import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    groupMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage' },
    type: {
      type: String,
      enum: [
        'post-comment',
        'comment-reply',
        'comment-top',
        'comment-pin',
        'comment-report',
        'group-member-added',
        'group-join-approved',
        'group-message-reply',
        'group-message-like'
      ],
      required: true
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

notificationSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
