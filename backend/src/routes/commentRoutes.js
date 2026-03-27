import express from 'express';
import { 
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  likeComment,
  markAsAcceptedAnswer,
  getPostEngagement
} from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/post/:postId', getCommentsByPost);

// Protected routes
router.get('/engagement/:postId', authMiddleware, getPostEngagement);
router.post('/', authMiddleware, createComment);
router.put('/:commentId', authMiddleware, updateComment);
router.delete('/:commentId', authMiddleware, deleteComment);
router.post('/:commentId/like', authMiddleware, likeComment);
router.post('/:commentId/accept', authMiddleware, markAsAcceptedAnswer);

export default router;
