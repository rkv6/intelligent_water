# Intelligent Water Monitoring System

A full-stack web application for real-time water quality monitoring combining an IoT (ESP32) sensor network with a decoupled web interface.

## 📋 System Architecture

```
ESP32 (Sensor Hardware)
    ↓ (Every 15 seconds)
ThingSpeak (Time-Series Data Store)
    ↓
Node.js Backend API (Metadata & User Management)
    ↓
MongoDB (User Profiles, Feedback, Device Mapping)
    ↓
React.js Frontend (Mobile-First Dashboard)
```

## 🎯 Key Features

### 📊 Dashboard
- **Live Metrics**: pH, TDS (Total Dissolved Solids), and Water Level gauges
- **Intelligent Status Indicators**: Color-coded warnings (red for out-of-range values)
- **Trend Analysis**: Daily, Weekly, Monthly views of historical data
- **Time-Series Visualization**: Charts powered by Recharts

### 👥 User Management
- **Authentication**: JWT-based secure login
- **Profile Management**: Update contact info, address, phone number
- **Device Mapping**: Link user account to ThingSpeak Channel ID
- **Last Login Tracking**: Admin can see user activity

### 📮 Feedback Portal
- **Multi-type Submissions**: Quality issues, leaks, billing, etc.
- **Image Attachment**: Document problems with photos
- **Status Tracking**: Pending → Under Review → Resolved

### 🛡️ Admin Dashboard
- **User Directory**: View all registered users and login history
- **Feedback Management**: Central inbox for all user submissions
- **Data Trends**: Admin can pull historical water data for any user
- **Response System**: Reply to user feedback with updates

## 🏗️ Project Structure

```
intelligent-water/
├── frontend/                    # Next.js + React
│   ├── src/
│   │   ├── app/               # Next.js app pages
│   │   ├── pages/             # User pages (login, dashboard, profile, feedback)
│   │   ├── components/        # Reusable Components
│   │   ├── lib/               # API client & auth utilities
│   │   └── styles/            # Global CSS
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── backend/                    # Express.js + Node.js
│   ├── src/
│   │   ├── models/            # MongoDB Schemas (User, Feedback)
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth & RBAC middleware
│   │   ├── utils/             # Helper functions
│   │   └── server.js          # Express server
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- npm/yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev  # Starts on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/signup       - Register new user
POST   /api/auth/login        - Login user
POST   /api/auth/logout       - Logout user
```

### User
```
GET    /api/user/profile                - Get user profile
PUT    /api/user/profile                - Update profile
GET    /api/user/channel-data/:channelID - Fetch ThingSpeak data
```

### Feedback
```
POST   /api/feedback          - Submit feedback
GET    /api/feedback          - Get user's feedback
PUT    /api/feedback/:id      - Update feedback status
```

### Admin (Requires RBAC Authorization)
```
GET    /api/admin/users                        - List all users
GET    /api/admin/feedback                     - List all feedback
GET    /api/admin/user-history/:userId         - Get user's water data history
POST   /api/admin/feedback/:feedbackId/respond - Respond to feedback
```

## 🗄️ Database Schema

### User Document
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "role": "user",  // or "admin"
  "channelID": "123456",
  "readAPIKey": "XYZ123...",
  "profileDetails": {
    "phone": "+1-555-123-4567",
    "address": "123 Main St, City, State"
  },
  "lastLogin": "2026-03-03T10:30:00Z",
  "createdAt": "2026-03-01T...",
  "updatedAt": "2026-03-03T..."
}
```

### Feedback Document
```json
{
  "_id": "ObjectId",
  "userId": "REF_TO_USER",
  "type": "quality-issue",  // or "leak", "billing", "other"
  "message": "Water TDS is consistently above 500ppm.",
  "status": "pending",  // or "under-review", "resolved"
  "image": "URL or base64",
  "adminResponse": null,
  "respondedAt": null,
  "createdAt": "2026-03-03T...",
  "updatedAt": "2026-03-03T..."
}
```

## 🔐 Security Features

- **JWT Tokens**: Secure session management with expiration
- **Password Hashing**: bcryptjs for secure password storage
- **Role-Based Access Control**: User vs Admin permissions
- **CORS**: Configured for frontend-backend communication
- **Input Validation**: Server-side validation on all endpoints

## 🔄 Data Flow

1. **User Registration/Login**
   - Frontend → POST `/api/auth/login`
   - Backend verifies credentials, returns JWT token
   - Frontend stores token in localStorage

2. **Fetch Water Sensor Data**
   - Frontend → GET `/api/user/profile` (with JWT)
   - Backend returns user's ThingSpeak Channel ID
   - Frontend → Call ThingSpeak API directly with channel data
   - Dashboard displays live metrics in gauges

3. **Submit Feedback**
   - User fills form on frontend
   - Frontend → POST `/api/feedback` (with JWT + form data)
   - Backend stores in MongoDB
   - Admin can view/respond at `/admin/feedback`

4. **Admin Reviews Data**
   - Admin → GET `/api/admin/users` → See all users
   - Admin → GET `/api/admin/user-history/:userId` → Pull that user's water data from ThingSpeak
   - Admin → POST `/api/admin/feedback/:id/respond` → Reply to feedback

## 📚 Technology Stack

**Frontend:**
- Next.js (React framework)
- TypeScript
- Tailwind CSS (styling)
- Axios (HTTP client)
- Recharts (data visualization)

**Backend:**
- Express.js (web framework)
- MongoDB (database)
- JWT (authentication)
- bcryptjs (password hashing)
- CORS (cross-origin requests)

**Infrastructure:**
- ThingSpeak (IoT data aggregation)
- MongoDB Atlas (cloud database)
- Vercel/Heroku (deployment ready)

## 🚢 Deployment

### Backend (Heroku/Railway)
```bash
# Set environment variables in platform dashboard
MONGODB_URI=<atlas-uri>
JWT_SECRET=<random-key>
NODE_ENV=production
```

### Frontend (Vercel/Netlify)
```bash
# Set environment variable
NEXT_PUBLIC_API_BASE_URL=<backend-url>
```

## 🛠️ Development

### Adding New Features

1. **New API Route**: Create in `backend/src/controllers/` and `routes/`
2. **Frontend Page**: Add to `frontend/src/pages/`
3. **API Call**: Add client method in `frontend/src/lib/api.ts`

### Running Tests

```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm run test
```

## 📄 License

MIT

## 👨‍💻 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ for intelligent water management**
