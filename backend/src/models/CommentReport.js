import mongoose from 'mongoose';

const commentReportSchema = new mongoose.Schema(
  {
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: ['spam', 'offensive', 'irrelevant', 'harassment'],
      required: true
    },
    description: { type: String }
  },
  { timestamps: true }
);

commentReportSchema.index({ comment: 1, reportedBy: 1 }, { unique: true });
commentReportSchema.index({ reason: 1, createdAt: -1 });

export const CommentReport = mongoose.model('CommentReport', commentReportSchema);
