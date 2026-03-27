import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        itNumber: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    memberITNumbers: [{ type: String }], // Quick lookup for IT numbers in group
    icon: { type: String }, // Group icon/image
    isPrivate: { type: Boolean, default: false },
    status: { type: String, default: 'active', enum: ['active', 'archived', 'deleted'] }
  },
  { timestamps: true }
);

groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ memberITNumbers: 1 });

const Group = mongoose.model('Group', groupSchema);

export { Group };
