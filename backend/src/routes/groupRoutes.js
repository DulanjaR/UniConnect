import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createGroup,
  getMyGroups,
  getGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  deleteGroup
} from '../controllers/groupController.js';

const router = express.Router();

// Require authentication for all routes
router.use(authMiddleware);

// Create a new group
router.post('/', createGroup);

// Get all groups for current user
router.get('/', getMyGroups);

// Get specific group
router.get('/:groupId', getGroup);

// Add member to group
router.post('/:groupId/members', addMemberToGroup);

// Remove member from group
router.delete('/:groupId/members/:memberId', removeMemberFromGroup);

// Delete group
router.delete('/:groupId', deleteGroup);

export { router as groupRoutes };
