import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  submitFeedback,
  getUserFeedback,
  updateFeedback,
} from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/', authMiddleware, submitFeedback);
router.get('/', authMiddleware, getUserFeedback);
router.put('/:id', authMiddleware, updateFeedback);

export default router;
