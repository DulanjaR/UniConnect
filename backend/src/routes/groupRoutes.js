import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import chatUpload from '../middleware/chatUpload.js';
import {
  createGroup,
  getMyGroups,
  getGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  deleteGroup
} from '../controllers/groupController.js';
import {
  getGroupChat,
  createGroupChatMessage,
  updateGroupChatMessage,
  deleteGroupChatMessage,
  togglePinnedMessage,
  voteOnPollMessage,
  convertMessageToTask,
  toggleTaskMessage,
  updateTypingStatus
} from '../controllers/groupChatController.js';

const router = express.Router();

// Require authentication for all routes
router.use(authMiddleware);

// Create a new group
router.post('/', createGroup);

// Get all groups for current user
router.get('/', getMyGroups);

// Get specific group
router.get('/:groupId', getGroup);

// Group chat
router.get('/:groupId/chat', getGroupChat);
router.post(
  '/:groupId/chat/messages',
  chatUpload.single('file'),
  createGroupChatMessage,
  (err, req, res, next) => {
    res.status(400).json({
      message: err.message || 'Failed to upload file'
    });
  }
);
router.patch('/:groupId/chat/messages/:messageId', updateGroupChatMessage);
router.delete('/:groupId/chat/messages/:messageId', deleteGroupChatMessage);
router.post('/:groupId/chat/messages/:messageId/pin', togglePinnedMessage);
router.post('/:groupId/chat/messages/:messageId/poll-vote', voteOnPollMessage);
router.post('/:groupId/chat/messages/:messageId/convert-to-task', convertMessageToTask);
router.post('/:groupId/chat/messages/:messageId/task-toggle', toggleTaskMessage);
router.post('/:groupId/chat/typing', updateTypingStatus);

// Add member to group
router.post('/:groupId/members', addMemberToGroup);

// Remove member from group
router.delete('/:groupId/members/:memberId', removeMemberFromGroup);

// Delete group
router.delete('/:groupId', deleteGroup);

export { router as groupRoutes };
