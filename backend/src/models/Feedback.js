import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['quality-issue', 'leak', 'billing', 'other'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under-review', 'resolved'],
      default: 'pending',
    },
    image: {
      type: String, // URL or base64
      default: null,
    },
    adminResponse: {
      type: String,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);
