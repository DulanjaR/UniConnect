import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    profilePicture: { type: String },
    bio: { type: String },
    university: { type: String },
    academicYear: { type: Number },
    semester: { type: Number },
    phone: { type: String },
    itNumber: { type: String, unique: true, sparse: true },
    intake: { type: String, enum: ['regular', 'irregular'], default: 'regular' },
    isEmailVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiry: { type: Date },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
