import bcryptjs from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';

// Validate IT number format (IT23227736) - case-insensitive
const validateITNumber = (itNumber) => {
  const itPattern = /^IT\d{8}$/i;
  return itPattern.test(itNumber);
};

// Validate SLIIT email format (IT23227736@my.sliit.lk)
const validateSLIITEmail = (email, itNumber) => {
  const expectedEmail = `${itNumber}@my.sliit.lk`;
  return email.toLowerCase() === expectedEmail.toLowerCase();
};

// Request OTP for registration
export const requestOTP = async (req, res) => {
  try {
    let { itNumber, email, name, university, academicYear, semester, intake } = req.body;

    // Normalize IT number to uppercase
    itNumber = itNumber.toUpperCase();

    // Validate input
    if (!itNumber || !email || !name || !university) {
      return res.status(400).json({ message: 'IT Number, email, name, university, year, and semester are required' });
    }

    // Validate IT number format
    if (!validateITNumber(itNumber)) {
      return res.status(400).json({ message: 'Invalid IT Number format. Use format: IT23227736' });
    }

    // Validate SLIIT email format
    if (!validateSLIITEmail(email, itNumber)) {
      return res.status(400).json({ 
        message: `Email must match SLIIT format: ${itNumber}@my.sliit.lk` 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { itNumber }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'This IT Number or email is already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Send OTP to email FIRST (before creating user)
    // If email fails, user won't be created
    await sendOTPEmail(email, otp, name);

    // Create temporary user record with OTP only if email succeeds
    const tempUser = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        name,
        email: email.toLowerCase(),
        itNumber,
        university,
        academicYear: parseInt(academicYear),
        semester: parseInt(semester),
        intake: intake || 'regular',
        otpCode: otp,
        otpExpiry: otpExpiry,
        isEmailVerified: false,
        password: '' // Empty password until registration is complete
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'OTP sent to your email. Valid for 10 minutes.',
      email: email.toLowerCase(),
      itNumber: itNumber,
      tempUserId: tempUser._id
    });
  } catch (err) {
    console.error('Error requesting OTP:', err);
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP and complete registration
export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    // Validate input
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and password are required' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Find user with matching OTP
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'No registration request found for this email' });
    }

    // Check if OTP expired
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Verify OTP
    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Update user with password and clear OTP
    user.password = hashedPassword;
    user.isEmailVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    res.json({
      message: 'Registration completed successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        itNumber: user.itNumber,
        intake: user.intake
      }
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ message: err.message });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.isEmailVerified) {
      return res.status(404).json({ message: 'No pending registration found for this email' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otpCode = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP to email
    await sendOTPEmail(email, otp, user.name);

    res.json({
      message: 'OTP resent to your email. Valid for 10 minutes.',
      email: email.toLowerCase()
    });
  } catch (err) {
    console.error('Error resending OTP:', err);
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user (case-insensitive email lookup)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: 'Please verify your email first. Check your inbox for the OTP.' });
    }

    // Compare passwords
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        itNumber: user.itNumber,
        intake: user.intake,
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
    const user = await User.findById(req.user.userId).select('-password -otpCode');
    res.json(user);
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

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
