import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { 
      type: String, 
      enum: ['delete-post', 'delete-comment', 'delete-item', 'flag-item', 'remove-user', 'restore-content', 'suspend-user'],
      required: true 
    },
    targetType: { 
      type: String, 
      enum: ['post', 'comment', 'lostitem', 'user'],
      required: true 
    },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetDetails: mongoose.Schema.Types.Mixed,
    reason: { type: String },
    status: { 
      type: String,
      enum: ['completed', 'pending'],
      default: 'completed'
    },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

adminLogSchema.index({ admin: 1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ createdAt: -1 });

export const AdminLog = mongoose.model('AdminLog', adminLogSchema);
