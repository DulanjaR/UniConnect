import mongoose from 'mongoose';

const groupJoinRequestSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

groupJoinRequestSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupJoinRequestSchema.index({ status: 1, createdAt: -1 });

export const GroupJoinRequest = mongoose.model('GroupJoinRequest', groupJoinRequestSchema);
