import express from 'express';
import {
  createGroup,
  listGroups,
  getMyGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  listGroupMembers,
  addGroupMember,
  removeGroupMember,
  updateGroupMemberRole,
  listGroupJoinRequests,
  reviewGroupJoinRequest
} from '../controllers/groupController.js';
import {
  createGroupMessage,
  listGroupMessages,
  getGroupMessage,
  updateGroupMessage,
  deleteGroupMessage,
  toggleGroupMessageLike,
  createGroupMessageReply,
  updateGroupMessageReply,
  deleteGroupMessageReply,
  toggleGroupMessageReplyLike
} from '../controllers/groupMessageController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { groupManagerMiddleware, groupMemberMiddleware, loadGroupById } from '../middleware/groupAuth.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, listGroups);
router.get('/mine', authMiddleware, getMyGroups);
router.post('/', authMiddleware, createGroup);

router.get('/:id', optionalAuthMiddleware, getGroup);
router.put('/:id', authMiddleware, loadGroupById, groupManagerMiddleware, updateGroup);
router.delete('/:id', authMiddleware, loadGroupById, groupManagerMiddleware, deleteGroup);

router.post('/:id/join', authMiddleware, joinGroup);
router.post('/:id/leave', authMiddleware, leaveGroup);

router.get('/:id/messages', optionalAuthMiddleware, loadGroupById, listGroupMessages);
router.post('/:id/messages', authMiddleware, loadGroupById, groupMemberMiddleware, createGroupMessage);
router.get('/:id/messages/:messageId', optionalAuthMiddleware, loadGroupById, getGroupMessage);
router.put('/:id/messages/:messageId', authMiddleware, loadGroupById, updateGroupMessage);
router.delete('/:id/messages/:messageId', authMiddleware, loadGroupById, deleteGroupMessage);
router.post('/:id/messages/:messageId/like', authMiddleware, loadGroupById, groupMemberMiddleware, toggleGroupMessageLike);
router.post('/:id/messages/:messageId/replies', authMiddleware, loadGroupById, groupMemberMiddleware, createGroupMessageReply);
router.put('/:id/messages/:messageId/replies/:replyId', authMiddleware, loadGroupById, updateGroupMessageReply);
router.delete('/:id/messages/:messageId/replies/:replyId', authMiddleware, loadGroupById, deleteGroupMessageReply);
router.post(
  '/:id/messages/:messageId/replies/:replyId/like',
  authMiddleware,
  loadGroupById,
  groupMemberMiddleware,
  toggleGroupMessageReplyLike
);

router.get('/:id/members', optionalAuthMiddleware, listGroupMembers);
router.post('/:id/members', authMiddleware, loadGroupById, groupManagerMiddleware, addGroupMember);
router.delete('/:id/members/:userId', authMiddleware, loadGroupById, groupManagerMiddleware, removeGroupMember);
router.patch('/:id/members/:userId/role', authMiddleware, loadGroupById, groupManagerMiddleware, updateGroupMemberRole);

router.get('/:id/join-requests', authMiddleware, loadGroupById, groupManagerMiddleware, listGroupJoinRequests);
router.patch(
  '/:id/join-requests/:requestId',
  authMiddleware,
  loadGroupById,
  groupManagerMiddleware,
  reviewGroupJoinRequest
);

export default router;
