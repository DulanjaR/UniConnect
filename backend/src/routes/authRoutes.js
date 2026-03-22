import express from 'express';
import { register, login, getUserProfile, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;
