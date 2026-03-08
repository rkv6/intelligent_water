import User from '../models/User.js';
import axios from 'axios';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, profileDetails, channelID, readAPIKey } = req.body;

    // Build update object
    const updateData = {
      name,
      profileDetails,
    };

    // Only update channelID if provided
    if (channelID !== undefined) {
      updateData.channelID = channelID || null;
    }

    // Only update readAPIKey if provided
    if (readAPIKey !== undefined) {
      updateData.readAPIKey = readAPIKey || null;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getChannelData = async (req, res) => {
  try {
    const { channelID } = req.params;
    const { readAPIKey } = req.query;

    // Verify the user owns this channel
    const user = await User.findById(req.userId);
    if (user.channelID !== channelID) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch data from ThingSpeak API
    const response = await axios.get(
      `${process.env.THINGSPEAK_BASE_URL}/channels/${channelID}/feeds.json`,
      {
        params: {
          api_key: readAPIKey,
          results: 60, // Last 60 entries
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch channel data', error: error.message });
  }
};
