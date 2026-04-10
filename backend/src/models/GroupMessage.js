import mongoose from 'mongoose';

const mentionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    itNumber: { type: String, required: true }
  },
  { _id: false }
);

const pollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const replySchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage', required: true },
    text: { type: String, required: true, trim: true },
    user: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const groupMessageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['text', 'file', 'poll', 'task'],
      default: 'text'
    },
    content: { type: String, default: '' },
    mentions: [mentionSchema],
    file: {
      name: { type: String, trim: true },
      url: { type: String, trim: true },
      note: { type: String, trim: true }
    },
    poll: {
      question: { type: String, trim: true },
      options: [pollOptionSchema]
    },
    task: {
      title: { type: String, trim: true },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      completedByName: { type: String, trim: true },
      sourceMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage' },
      sourceType: { type: String, trim: true },
      sourcePreview: { type: String, trim: true }
    },
    replyTo: {
      type: replySchema,
      default: null
    },
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

groupMessageSchema.index({ group: 1, createdAt: 1 });
groupMessageSchema.index({ group: 1, isPinned: 1, pinnedAt: -1 });
groupMessageSchema.index({ group: 1, type: 1, createdAt: -1 });

export const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
