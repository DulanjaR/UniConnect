import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    profilePicture: { type: String },
    bio: { type: String },
    university: { type: String },
    academicYear: { type: Number },
    semester: { type: Number },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
