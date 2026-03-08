import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUserProfile,
  updateUserProfile,
  getChannelData,
} from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.get('/channel-data/:channelID', authMiddleware, getChannelData);

export default router;
