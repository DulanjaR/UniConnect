import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  sharePostToGroup,
  getGroupSharedPosts,
  getPostShares,
  removeShare
} from '../controllers/postShareController.js';

const router = express.Router();

// Require authentication for all routes
router.use(authMiddleware);

// Share a post to a group
router.post('/', sharePostToGroup);

// Get posts shared with a group
router.get('/group/:groupId', getGroupSharedPosts);

// Get all shares for a post
router.get('/post/:postId', getPostShares);

// Remove a share
router.delete('/:shareId', removeShare);

export { router as postShareRoutes };
