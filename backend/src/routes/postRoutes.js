import express from 'express';
import {
  createPost,
  getPosts,
  getPostFeed,
  getPostsByAuthor,
  getPost,
  updatePost,
  deletePost,
  likePost
} from '../controllers/postController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/feed', getPostFeed);
router.get('/author/:authorId', getPostsByAuthor);
router.get('/:id', getPost);

router.post('/', authMiddleware, createPost);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, likePost);

export default router;
