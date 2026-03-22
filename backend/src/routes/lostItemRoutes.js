import express from 'express';
import { 
  createLostItem,
  getLostItems,
  getLostItem,
  updateLostItem,
  deleteLostItem,
  markAsResolved,
  addComment,
  flagItem
} from '../controllers/lostItemController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getLostItems);
router.get('/:id', getLostItem);

// Protected routes
router.post('/', authMiddleware, createLostItem);
router.put('/:id', authMiddleware, updateLostItem);
router.delete('/:id', authMiddleware, deleteLostItem);
router.post('/:id/resolve', authMiddleware, markAsResolved);
router.post('/:id/comment', authMiddleware, addComment);

// Admin routes
router.post('/:id/flag', authMiddleware, adminMiddleware, flagItem);

export default router;
