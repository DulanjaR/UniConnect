import express from 'express';
import { requestOTP, verifyOTPAndRegister, resendOTP, login, getUserProfile, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// OTP-based registration flow
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTPAndRegister);
router.post('/resend-otp', resendOTP);

// Login
router.post('/login', login);

// Profile (protected routes)
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;
