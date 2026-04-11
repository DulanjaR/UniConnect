import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    complainant: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    category: {
      type: String,
      enum: ['account-issue', 'inappropriate-content', 'technical-bug', 'harassment', 'other'],
      required: true,
      default: 'other'
    },
    type: {
      type: String,
      enum: ['complaint', 'appeal'],
      required: true,
      default: 'complaint'
    },
    relatedItemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'relatedItemType'
    },
    relatedItemType: {
      type: String,
      enum: ['Post', 'Comment', 'User', null],
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'under-review', 'resolved', 'rejected'],
      default: 'pending'
    },
    attachments: [{ type: String }], // URLs of attached files/images
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    adminNotes: {
      type: String,
      default: ''
    },
    resolvedAt: { type: Date },
    resolvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User'
    }
  },
  { 
    timestamps: true 
  }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
