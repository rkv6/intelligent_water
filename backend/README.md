# Intelligent Water Monitoring System - Backend

## Environment Variables

Create a `.env` file in the root directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/intelligent-water
JWT_SECRET=your-secret-key-here
THINGSPEAK_BASE_URL=https://api.thingspeak.com
NODE_ENV=development
```

## Setup

1. Install dependencies: `npm install`
2. Start the server: `npm run dev`

## Project Structure

```
backend/
├── src/
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Route handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   ├── utils/           # Helper functions
│   └── server.js        # Main entry point
├── .env                 # Environment variables
└── package.json
```

## API Routes

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/channel-data/:channelID` - Fetch ThingSpeak data

### Feedback
- `GET /api/feedback` - Get user's feedback
- `POST /api/feedback` - Submit feedback
- `PUT /api/feedback/:id` - Update feedback

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/feedback` - Get all feedback
- `GET /api/admin/user-history/:userId` - Get user's water data history
- `POST /api/admin/feedback/:id/respond` - Respond to feedback
