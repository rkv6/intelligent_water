import Feedback from '../models/Feedback.js';
import User from '../models/User.js';

export const submitFeedback = async (req, res) => {
  try {
    const { type, message } = req.body;

    const feedback = new Feedback({
      userId: req.userId,
      type,
      message,
      image: req.file ? req.file.path : null, // If file upload is enabled
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Verify ownership
    if (feedback.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      message: 'Feedback updated successfully',
      feedback,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
