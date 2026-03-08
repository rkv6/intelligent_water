import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import axios from 'axios';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ lastLogin: -1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user and their channel ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.channelID || !user.readAPIKey) {
      return res.status(400).json({ message: 'User has no ThingSpeak channel' });
    }

    // Fetch historical data from ThingSpeak
    const response = await axios.get(
      `${process.env.THINGSPEAK_BASE_URL}/channels/${user.channelID}/feeds.json`,
      {
        params: {
          api_key: user.readAPIKey,
          results: 1000, // Get last 1000 entries for historical analysis
        },
      }
    );

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        channelID: user.channelID,
      },
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user history', error: error.message });
  }
};

export const respondToFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { response: adminResponse } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        status: 'under-review',
        adminResponse,
        respondedAt: new Date(),
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.status(200).json({
      message: 'Response sent successfully',
      feedback,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateFeedbackStatus = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;

    if (!['pending', 'under-review', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { status },
      { new: true }
    ).populate('userId', 'name email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.status(200).json({
      message: 'Status updated successfully',
      feedback,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAdminResponse = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        adminResponse: null,
        respondedAt: null,
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.status(200).json({
      message: 'Response deleted successfully',
      feedback,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
