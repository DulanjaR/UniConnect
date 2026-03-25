import express from 'express';
import { getUserProfile, searchUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/search', searchUsers);
router.get('/:userId', getUserProfile);

export default router;
