import bcryptjs from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const toClientRole = (role) => (role === 'admin' ? 'admin' : 'user');

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'user', university, academicYear, semester } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    const normalizedRole = role === 'admin' ? 'user' : role === 'student' ? 'user' : role;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      university,
      academicYear,
      semester
    });

    await user.save();

    const token = generateToken(user._id, user.email, toClientRole(user.role));

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: toClientRole(user.role),
        university: user.university,
        academicYear: user.academicYear,
        semester: user.semester
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive || user.commentModerationStatus === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.email, toClientRole(user.role));

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: toClientRole(user.role),
        university: user.university,
        academicYear: user.academicYear,
        semester: user.semester
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({
      ...user.toObject(),
      role: toClientRole(user.role)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, university, academicYear, semester, phone, profilePicture } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        name,
        bio,
        university,
        academicYear,
        semester,
        phone,
        profilePicture
      },
      { new: true }
    ).select('-password');

    res.json({
      ...user.toObject(),
      role: toClientRole(user.role)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
