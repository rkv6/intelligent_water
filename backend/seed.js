import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Feedback from './src/models/Feedback.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB with SSL options for Node 22
    const mongoOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    };
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intelligent-water', mongoOptions);
    console.log('✓ Connected to MongoDB');

    // Clear existing data (optional - comment out to keep data)
    // await User.deleteMany({});
    // await Feedback.deleteMany({});
    // console.log('✓ Cleared existing data');

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'user',
        channelID: '123456',
        readAPIKey: 'ABC123XYZ',
        profileDetails: {
          phone: '+1-555-123-4567',
          address: '123 Main St, New York, NY',
        },
        lastLogin: new Date(),
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'user',
        channelID: '789012',
        readAPIKey: 'DEF456UVW',
        profileDetails: {
          phone: '+1-555-987-6543',
          address: '456 Oak Ave, Los Angeles, CA',
        },
        lastLogin: new Date(),
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        profileDetails: {
          phone: '+1-555-555-5555',
          address: '789 Admin Plaza, Chicago, IL',
        },
        lastLogin: new Date(),
      },
    ]);

    console.log(`✓ Created ${users.length} test users`);

    // Create test feedback
    const feedbacks = await Feedback.insertMany([
      {
        userId: users[0]._id,
        type: 'quality-issue',
        message: 'Water TDS levels have been consistently above 500ppm for the past week',
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        userId: users[0]._id,
        type: 'leak',
        message: 'Noticed water leaking from the connection pipe near the meter',
        status: 'under-review',
        adminResponse: 'Technician will visit on Monday',
        respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        userId: users[1]._id,
        type: 'quality-issue',
        message: 'pH level dropped below 6.5 - water seems more acidic',
        status: 'resolved',
        adminResponse: 'Water treatment has been adjusted. Levels should normalize within 24 hours.',
        respondedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        userId: users[1]._id,
        type: 'billing',
        message: 'Water bill seems higher than usual for this month',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
    ]);

    console.log(`✓ Created ${feedbacks.length} test feedback entries`);

    // Display summary
    console.log('\n✅ Database seeding complete!');
    console.log('\nTest Credentials:');
    console.log('  User Account:');
    console.log('    Email: john@example.com');
    console.log('    Password: password123');
    console.log('  Admin Account:');
    console.log('    Email: admin@example.com');
    console.log('    Password: password123');
    console.log('\nDatabase Statistics:');
    console.log(`  Users: ${users.length}`);
    console.log(`  Feedback entries: ${feedbacks.length}`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
