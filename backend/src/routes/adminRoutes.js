import express from 'express';
import {
  getDashboardStats,
  getAllPosts,
  getAllComments,
  getAllLostItems,
  getAllUsers,
  getAdminLogs,
  suspendUser,
  restoreUser,
  getDetailedActivityReport
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
router.get('/lost-items', getAllLostItems);

// User Management
router.get('/users', getAllUsers);
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/restore', restoreUser);

// Logs
router.get('/logs', getAdminLogs);

export default router;
