import mongoose from 'mongoose';

const lostItemSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['electronics', 'documents', 'accessories', 'books', 'clothing', 'other'],
      required: true
    },
    itemType: {
      type: String,
      enum: ['lost', 'found'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'removed'],
      default: 'active'
    },
    images: [{ type: String }],
    location: { type: String },
    dateOfIncident: { type: Date, required: true },
    contactInfo: {
      email: { type: String },
      phone: { type: String }
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedDate: { type: Date },
    views: { type: Number, default: 0 },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    flagged: { type: Boolean, default: false },
    flagReason: { type: String }
  },
  { timestamps: true }
);

lostItemSchema.index({ reporter: 1 });
lostItemSchema.index({ itemType: 1, status: 1 });
lostItemSchema.index({ createdAt: -1 });

export const LostItem = mongoose.model('LostItem', lostItemSchema);
