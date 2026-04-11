import express from 'express';
import { 
  createComplaint, 
  getUserComplaints, 
  getComplaintDetails, 
  updateComplaintStatus, 
  deleteComplaint,
  getAllComplaints 
} from '../controllers/complaintController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/', authMiddleware, createComplaint);
router.get('/user/my-complaints', authMiddleware, getUserComplaints);
router.get('/:complaintId', authMiddleware, getComplaintDetails);
router.delete('/:complaintId', authMiddleware, deleteComplaint);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, getAllComplaints);
router.put('/:complaintId/status', authMiddleware, adminMiddleware, updateComplaintStatus);

export default router;
