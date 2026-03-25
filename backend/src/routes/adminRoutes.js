import express from 'express';
import {
  getDashboardStats,
  getAllPosts,
  getAllComments,
  updateCommentStatus,
  adminDeleteComment,
  getCommentReports,
  reviewComment,
  getAllLostItems,
  getAllUsers,
  getAdminLogs,
  suspendUser,
  restoreUser,
  getDetailedActivityReport,
  updateUserCommentModeration,
  getAllGroups,
  deleteAnyGroup
} from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/activity-report', getDetailedActivityReport);

// Content Management
router.get('/posts', getAllPosts);
router.get('/comments', getAllComments);
router.get('/comments/reports', getCommentReports);
router.patch('/comments/:id/status', updateCommentStatus);
router.patch('/comments/:id/review', reviewComment);
router.delete('/comments/:id', adminDeleteComment);
router.get('/lost-items', getAllLostItems);
router.get('/groups', getAllGroups);
router.delete('/groups/:id', deleteAnyGroup);

// User Management
router.get('/users', getAllUsers);
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/restore', restoreUser);
router.patch('/users/:userId/comment-moderation', updateUserCommentModeration);

// Logs
router.get('/logs', getAdminLogs);

export default router;
