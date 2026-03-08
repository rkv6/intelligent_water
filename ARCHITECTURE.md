# 🔄 System Architecture Overview

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INTELLIGENT WATER MONITORING SYSTEM              │
└─────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────┐
                          │   ESP32 Sensor   │
                          │   + DHT11/LM35   │
                          └────────┬─────────┘
                                   │
                        Every 15 seconds
                                   │
                                   ▼
                    ┌─────────────────────────┐
                    │   ThingSpeak Cloud      │
                    │  (Channel: 123456)      │
                    │  (FREE TIER)            │
                    │  ✓ Temperature          │
                    │  ✓ Humidity             │
                    │  ✓ pH Level             │
                    │  ✓ TDS/Salinity         │
                    │  ✓ Flow Rate            │
                    │  ✓ Tank Level           │
                    └────────┬────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌─────────────────────┐    ┌──────────────────────┐
    │   Node.js Backend   │    │  React Frontend      │
    │   (Port 5000)       │◄───┤  (Port 3000)         │
    │                     │    │                      │
    │ ✓ Auth & JWT        │    │ ✓ Dashboard          │
    │ ✓ User Profile      │    │ ✓ Water Metrics      │
    │ ✓ Feedback CRUD     │    │ ✓ Profile Manager    │
    │ ✓ Admin Panel       │    │ ✓ Feedback Tracker   │
    └──────────┬──────────┘    └──────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │  MongoDB Database   │
    │  (Local or Atlas)   │
    │                     │
    │ Collections:        │
    │ ✓ users            │
    │ ✓ feedbacks        │
    └─────────────────────┘
```

## Component Interaction Diagram

```
FRONTEND (Next.js + React)
├── Authentication Flow
│   ├── /login → POST /api/auth/login → JWT Token
│   ├── /signup → POST /api/auth/signup → Auto-login
│   └── Token stored in localStorage + Axios interceptor
│
├── Dashboard Page
│   ├── GET /api/user/profile → User data with channelID
│   ├── GET /api/user/channel/{channelID} → ThingSpeak data
│   └── Display metrics: Temperature, Humidity, pH, TDS, Flow, Tank Level
│
├── Profile Page
│   ├── GET /api/user/profile → Current user
│   └── PUT /api/user/profile → Update details
│
└── Feedback Page
    ├── GET /api/feedback → User's feedback list
    ├── POST /api/feedback → Create new feedback
    └── PUT /api/feedback/:id → Update feedback

BACKEND (Express.js)
├── Authentication Routes
│   ├── POST /api/auth/signup
│   ├── POST /api/auth/login
│   └── POST /api/auth/logout
│
├── User Routes (Protected)
│   ├── GET /api/user/profile → User document from MongoDB
│   ├── PUT /api/user/profile → Update MongoDB user
│   ├── GET /api/user/channel/{channelID} → Fetch from ThingSpeak API
│   └── GET /api/user/history → Historical data
│
├── Feedback Routes (Protected)
│   ├── GET /api/feedback → Query with filters
│   ├── POST /api/feedback → Create with validation
│   ├── PUT /api/feedback/:id → Update feedback
│   └── DELETE /api/feedback/:id → Delete feedback
│
└── Admin Routes (Admin Role Only)
    ├── GET /api/admin/users → All users
    ├── GET /api/admin/feedback → All feedback
    ├── PUT /api/admin/feedback/:id/respond → Admin response
    └── DELETE /api/admin/users/:id → User management

DATABASE (MongoDB)
├── users collection
│   ├── _id (ObjectId)
│   ├── name, email (unique index), password (bcrypt)
│   ├── address, serialNumber, channelID (links to ThingSpeak)
│   ├── role (enum: user | admin)
│   ├── createdAt, updatedAt (timestamps)
│   └── Indexes: email (unique), role (sparse)
│
└── feedbacks collection
    ├── _id (ObjectId)
    ├── userId (reference to users)
    ├── type (enum: bug | suggestion | quality)
    ├── title, description
    ├── status (enum: pending | under-review | resolved)
    ├── priority (enum: low | medium | high)
    ├── adminResponse
    ├── createdAt, updatedAt (timestamps)
    └── Indexes: userId, status, createdAt
```

## API Flow Examples

### Example 1: User Login & Dashboard Load

```
User Action: Click Login Button
    │
    ▼
Frontend: POST /api/auth/login
  Request: { email, password }
    │
    ▼
Backend: authController.login()
  ✓ Find user in MongoDB
  ✓ Verify password with bcryptjs
  ✓ Generate JWT token
    │
    ▼
Frontend: Receive { token }
  ✓ Store in localStorage
  ✓ Set Authorization header
    │
    ▼
User Action: Navigate to Dashboard
    │
    ▼
Frontend: GET /api/user/profile
  Header: { Authorization: Bearer <JWT> }
    │
    ▼
Backend: auth.js (Middleware)
  ✓ Verify JWT token
  ✓ Extract userId
    │
    ▼
Backend: userController.getProfile()
  ✓ Query MongoDB for user doc
  ✓ Return user with channelID
    │
    ▼
Frontend: GET /api/user/channel/123456
    │
    ▼
Backend: userController.getChannelData()
  ✓ Call ThingSpeak API with channelID
  ✓ Parse latest sensor readings
    │
    ▼
Frontend: Display Dashboard
  ├── User Name & Profile Pic
  ├── Temperature: 28.5°C
  ├── Humidity: 65%
  ├── pH Level: 7.2
  ├── TDS: 400 ppm
  ├── Flow Rate: 12.3 L/min
  └── Tank Level: 85%
```

### Example 2: Submit Feedback (Async Flow)

```
User Action: Fill Feedback Form + Submit
    │
    ▼
Frontend: POST /api/feedback
  Request: {
    type: "suggestion",
    title: "Better UI",
    description: "...",
    priority: "low"
  }
  Header: { Authorization: Bearer <JWT> }
    │
    ▼
Backend: auth.js Middleware → Extract userId
    │
    ▼
Backend: feedbackController.createFeedback()
  ✓ Validate input
  ✓ Create MongoDB document
  ✓ Set status = "pending"
  ✓ Assign userId
    │
    ▼
Backend: Save to MongoDB feedbacks collection
    │
    ▼
Frontend: Receive 201 Created
  ✓ Show success notification
  ✓ Redirect to /feedback page
    │
    ▼
Frontend: GET /api/feedback
  Header: { Authorization: Bearer <JWT> }
    │
    ▼
Backend: feedbackController.getUserFeedback()
  ✓ Query MongoDB: { userId: currentUser._id }
  ✓ Sort by createdAt descending
    │
    ▼
Frontend: Display Feedback List
  ├── [PENDING] Better UI - low priority
  ├── [RESOLVED] Dark mode requested
  └── [UNDER-REVIEW] API optimization
```

## Security Architecture

```
┌──────────────────────────────────────────────────────┐
│           AUTHENTICATION & AUTHORIZATION             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Login/Signup                                        │
│  ├─ Password: Hashed with bcryptjs (salt rounds: 10)│
│  ├─ Storage: MongoDB with indexed unique constraint │
│  └─ Never transmitted in plaintext                  │
│                                                      │
│  JWT Token                                           │
│  ├─ Claims: { userId, role, iat, exp }             │
│  ├─ Secret: Stored in .env (not in code)           │
│  ├─ Expiry: 7 days                                  │
│  ├─ Refresh: Re-login required                      │
│  └─ Storage: localStorage (with httpOnly warning)   │
│                                                      │
│  Request Authorization                              │
│  ├─ Header: "Authorization: Bearer <token>"         │
│  ├─ Middleware: auth.js verifies token              │
│  ├─ Extract: userId + role                          │
│  └─ Validate: Role-based access control (RBAC)      │
│                                                      │
│  Admin Verification                                  │
│  ├─ Check: user.role === "admin"                    │
│  ├─ Routes: /api/admin/* require admin role         │
│  └─ Response: 403 Forbidden if not admin            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Deployment Architecture (Optional)

```
┌──────────────────────────────────────────────────────┐
│         PRODUCTION DEPLOYMENT OPTION                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Frontend                    Backend                 │
│  ┌──────────────┐           ┌──────────────┐       │
│  │   Vercel     │           │   Heroku     │       │
│  │  (Next.js)   │◄─────────►│ (Express)    │       │
│  │              │  API Calls │              │       │
│  │ Port: 443    │           │ Port: 443    │       │
│  │ auto SSL     │           │ (HTTPS)      │       │
│  └──────────────┘           └──────┬───────┘       │
│                                    │                 │
│                                    ▼                 │
│                          ┌──────────────────┐       │
│                          │ MongoDB Atlas    │       │
│                          │ (Cloud Database) │       │
│                          │ with backup      │       │
│                          └──────────────────┘       │
│                                                      │
│  Environment Variables:                              │
│  Backend:                                            │
│  ├─ MONGODB_URI (Atlas connection string)           │
│  ├─ JWT_SECRET (strong random key)                  │
│  ├─ NODE_ENV=production                             │
│  └─ PORT (auto from Heroku)                         │
│                                                      │
│  Frontend:                                           │
│  ├─ NEXT_PUBLIC_API_BASE_URL                        │
│  │   = https://intelligent-water-api.herokuapp.com  │
│  └─ NEXT_PUBLIC_THINGSPEAK_BASE_URL                 │
│     = https://api.thingspeak.com                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Hardware** | ESP32 + DHT11/LM35 | Real-time sensor data collection |
| **IoT Cloud** | ThingSpeak | Free tier, 15-second intervals, public/private channels |
| **Backend** | Node.js + Express | REST API server, business logic |
| **Database** | MongoDB + Mongoose | Document storage, user & feedback data |
| **Auth** | JWT + bcryptjs | Stateless authentication, password hashing |
| **Frontend** | Next.js 14 (App Router) | Server-side rendering, file-based routing |
| **UI** | React 18 + shadcn/ui | Component library, Tailwind CSS styling |
| **HTTP Client** | Axios | API requests with interceptors |
| **Charts** | Recharts | Data visualization (optional) |

## Performance Considerations

```
┌─────────────────────────────────────────┐
│    OPTIMIZATION STRATEGIES              │
├─────────────────────────────────────────┤
│                                         │
│ Frontend:                               │
│ ✓ Next.js Image Optimization            │
│ ✓ Code Splitting (dynamic imports)      │
│ ✓ CSS-in-JS (Tailwind)                  │
│ ✓ Token caching in localStorage         │
│ ✓ API call debouncing                   │
│                                         │
│ Backend:                                │
│ ✓ Database indexes on frequent queries  │
│ ✓ JWT verification (stateless)          │
│ ✓ Error handling with try-catch         │
│ ✓ CORS configured for frontend domain  │
│ ✓ Rate limiting (todo)                  │
│                                         │
│ Database:                               │
│ ✓ MongoDB indexes: email, userId        │
│ ✓ Indexed fields for fast queries       │
│ ✓ TTL indexes for session cleanup       │
│ ✓ Connection pooling via Mongoose       │
│                                         │
└─────────────────────────────────────────┘
```
