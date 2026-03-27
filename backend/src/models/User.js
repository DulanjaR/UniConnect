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
    itNumber: { type: String, unique: true, sparse: true }, // Student IT number for group creation
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }] // Groups user is member of
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
