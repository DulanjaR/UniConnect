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
import upload from '../middleware/upload.js';
import { getMyItems } from '../controllers/lostItemController.js';

const router = express.Router();

// Public routes
router.get('/', getLostItems);
router.get('/my-items', authMiddleware, getMyItems);
router.get('/:id', getLostItem);

// Protected routes
router.post('/', authMiddleware, upload.array('images'), createLostItem);
router.put('/:id', authMiddleware, upload.array('images'), updateLostItem);
router.delete('/:id', authMiddleware, deleteLostItem);
router.post('/:id/resolve', authMiddleware, markAsResolved);
router.post('/:id/comment', authMiddleware, addComment);

// Admin routes
router.post('/:id/flag', authMiddleware, adminMiddleware, flagItem);

export default router;
