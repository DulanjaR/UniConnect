import express from 'express';
import { getUserProfile, searchUsers, searchUsersByItNumber } from '../controllers/userController.js';

const router = express.Router();

router.get('/search', searchUsers);
router.get('/search-by-it', searchUsersByItNumber);
router.get('/:userId', getUserProfile);

export default router;
