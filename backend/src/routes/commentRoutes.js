import express from 'express';
import { 
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  replyToComment,
  toggleTopComment,
  togglePinComment,
  reportComment
} from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/post/:postId', getCommentsByPost);

// Protected routes
router.post('/', authMiddleware, createComment);
router.put('/:id', authMiddleware, updateComment);
router.delete('/:id', authMiddleware, deleteComment);
router.post('/:id/reply', authMiddleware, replyToComment);
router.post('/:id/like', authMiddleware, likeComment);
router.post('/:id/unlike', authMiddleware, unlikeComment);
router.patch('/:id/top', authMiddleware, toggleTopComment);
router.patch('/:id/pin', authMiddleware, togglePinComment);
router.post('/:id/report', authMiddleware, reportComment);

export default router;
