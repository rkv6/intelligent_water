import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Import models (needed for index management)
import User from './models/User.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4
};

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intelligent-water', mongoOptions)
  .then(async () => {
    console.log('✓ MongoDB connected');
    
    // Drop old unique index on channelID if it exists
    try {
      await User.collection.dropIndex('channelID_1');
      console.log('✓ Dropped old channelID unique index');
    } catch (err) {
      // Index doesn't exist, that's fine
      if (err.code !== 27) {
        console.log('Note: channelID index cleanup done');
      }
    }
  })
  .catch((error) => {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🌊 Intelligent Water Monitoring System`);
  console.log(`═══════════════════════════════════════`);
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/intelligent-water'}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`═══════════════════════════════════════\n`);
});

export default app;
