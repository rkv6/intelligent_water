import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import {
  getAllUsers,
  getAllFeedback,
  getUserHistory,
  respondToFeedback,
  updateFeedbackStatus,
  deleteAdminResponse,
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.get('/feedback', authMiddleware, adminMiddleware, getAllFeedback);
router.get('/user-history/:userId', authMiddleware, adminMiddleware, getUserHistory);
router.post('/feedback/:feedbackId/respond', authMiddleware, adminMiddleware, respondToFeedback);
router.put('/feedback/:feedbackId/status', authMiddleware, adminMiddleware, updateFeedbackStatus);
router.delete('/feedback/:feedbackId/response', authMiddleware, adminMiddleware, deleteAdminResponse);

export default router;
