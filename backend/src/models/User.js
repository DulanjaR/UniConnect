import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'student', 'admin'], default: 'user' },
    profilePicture: { type: String },
    bio: { type: String },
    university: { type: String },
    academicYear: { type: Number },
    semester: { type: Number },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    commentViolationCount: { type: Number, default: 0 },
    commentModerationStatus: {
      type: String,
      enum: ['clear', 'watchlist', 'restricted', 'suspended'],
      default: 'clear'
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
