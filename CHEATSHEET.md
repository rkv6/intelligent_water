# 📝 Quick Reference Cheat Sheet

A fast lookup guide for common commands, paths, and endpoints.

---

## 🚀 Startup Commands

### Start Everything (from project root)

```powershell
# Terminal 1: MongoDB (if local)
mongod

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Access URLs
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **MongoDB:** localhost:27017

---

## 📁 Important File Paths

### Backend Core Files
```
backend/
├── .env                    # Environment variables
├── package.json            # Dependencies
├── seed.js                # Database seeding script
├── src/
│   ├── server.js          # Express app
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── feedbackController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── User.js
│   │   └── Feedback.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── feedbackRoutes.js
│   │   └── adminRoutes.js
│   └── middleware/
│       └── auth.js
├── API.md                 # API documentation
└── SETUP.md              # Setup guide
```

### Frontend Core Files
```
frontend/
├── .env.local            # Environment variables
├── package.json          # Dependencies
├── next.config.js        # Next.js config
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
├── src/
│   ├── app/
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   └── feedback/page.tsx
│   ├── components/ui/    # shadcn components
│   ├── lib/
│   │   ├── api.ts        # Axios client
│   │   ├── auth.ts       # Auth utilities
│   │   └── utils.ts      # Helper functions
│   └── styles/
│       └── globals.css   # Global styles
```

### Root Documentation
```
QUICKSTART.md            # 5-minute setup guide
ARCHITECTURE.md          # System architecture diagrams
TROUBLESHOOTING.md       # FAQ & fixes
VERIFICATION.md          # Setup checklist
```

---

## 🔑 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/intelligent-water
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
THINGSPEAK_BASE_URL=https://api.thingspeak.com
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_THINGSPEAK_BASE_URL=https://api.thingspeak.com
```

---

## 🧪 Test Accounts (After `npm run seed`)

| Email | Password | Role | Channel |
|-------|----------|------|---------|
| john@example.com | password123 | user | 123456 |
| jane@example.com | password123 | user | 789012 |
| admin@example.com | password123 | admin | 345678 |

---

## 📡 API Endpoint Quick Reference

### Authentication
```
POST   /api/auth/signup           # Register new user
POST   /api/auth/login            # Login (returns JWT)
POST   /api/auth/logout           # Logout
```

### User Profile
```
GET    /api/user/profile          # Get current user
PUT    /api/user/profile          # Update profile
GET    /api/user/channel/:id      # Get ThingSpeak data
GET    /api/user/history          # Historical data
```

### Feedback
```
GET    /api/feedback              # List user's feedback
GET    /api/feedback/:id          # Get feedback detail
POST   /api/feedback              # Create feedback
PUT    /api/feedback/:id          # Update feedback
DELETE /api/feedback/:id          # Delete feedback
```

### Admin Only
```
GET    /api/admin/users           # List all users (admin)
GET    /api/admin/feedback        # List all feedback (admin)
PUT    /api/admin/feedback/:id/respond  # Admin response
DELETE /api/admin/users/:id       # Delete user (admin)
```

### Health Check
```
GET    /api/health                # Server status
```

---

## 🔐 Authorization Header Format

For all protected endpoints, include:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example cURL:**
```powershell
curl http://localhost:5000/api/user/profile `
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Example Axios (frontend):**
```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 📊 Database Collections

### `users` Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique index),
  password: String (bcryptjs hashed),
  address: String,
  serialNumber: String (ESP32 ID),
  channelID: String (ThingSpeak channel),
  role: String (enum: "user", "admin"),
  createdAt: Date,
  updatedAt: Date
}
```

### `feedbacks` Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: String (enum: "bug", "suggestion", "quality"),
  title: String,
  description: String,
  priority: String (enum: "low", "medium", "high"),
  status: String (enum: "pending", "under-review", "resolved"),
  adminResponse: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🪄 Useful npm Commands

### Backend
```powershell
npm install              # Install dependencies
npm run dev             # Start with auto-reload (nodemon)
npm start               # Start production server
npm run seed            # Populate database with test data
npm run lint            # Run linter (if configured)
npm test                # Run tests (if configured)
```

### Frontend
```powershell
npm install             # Install dependencies
npm run dev             # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run linter
```

---

## 🗄️ MongoDB Commands (mongosh)

### Connect to Database
```powershell
mongosh              # Open MongoDB shell
mongo                # Alternative (older version)
```

### Database Operations
```javascript
// Switch to database
use intelligent-water

// View all collections
show collections

// Count documents
db.users.count()
db.feedbacks.count()

// Find all users
db.users.find()

// Find specific user
db.users.findOne({ email: "john@example.com" })

// View user password hash (verify bcrypt format)
db.users.findOne({ email: "john@example.com" }, { password: 1 })

// Count feedback by status
db.feedbacks.countDocuments({ status: "pending" })

// Update user
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { name: "John Doe" } }
)

// Delete feedback
db.feedbacks.deleteOne({ _id: ObjectId("...") })

// Clear collection (destructive!)
db.users.deleteMany({})
db.feedbacks.deleteMany({})

// Check indexes
db.users.getIndexes()

// Exit
exit
```

---

## 🐛 Common Troubleshooting Commands

### Check if Services Running
```powershell
# MongoDB
mongosh
# If connected, shows ">" prompt, then type: exit

# Backend (should show "✓ Server running")
curl http://localhost:5000/api/health

# Frontend (should return HTML)
curl http://localhost:3000
```

### Kill Processes Using Ports
```powershell
# Find process
netstat -ano | findstr :5000    # Backend
netstat -ano | findstr :3000    # Frontend
netstat -ano | findstr :27017   # MongoDB

# Kill process (replace <PID> with process ID)
taskkill /PID <PID> /F
```

### Clear Cache & Reinstall
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Frontend
cd ../frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
Remove-Item package-lock.json
npm install
```

### Verify Network Connectivity
```powershell
# Can frontend reach backend?
curl http://localhost:5000/api/health

# Can backend reach MongoDB Atlas?
# (Check network tab in browser DevTools)
```

---

## 🔍 Browser DevTools Tips

### Check Authentication Token
```javascript
// Console (Press F12 → Console tab)
localStorage.getItem('token')   // Should show JWT
localStorage.getItem('user')    // May show user data
```

### Test API Endpoint
```javascript
// Console
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)

// With auth token:
const token = localStorage.getItem('token')
fetch('http://localhost:5000/api/user/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(console.log)
```

### Monitor Network Requests
1. Open DevTools (F12)
2. Click "Network" tab
3. Perform action (login, submit form)
4. See all requests and responses

### Clear All Storage
1. DevTools (F12) → Application
2. Storage → Clear Site Data
3. Then logout and login again

---

## 📈 Performance Metrics to Check

### Frontend Performance
- Page load: < 3 seconds ✓
- API response: < 500ms ✓
- Form submission: < 2 seconds ✓

### Backend Performance
- Database query: < 100ms ✓
- API response: < 200ms ✓
- Token verification: < 50ms ✓

### Database Performance
- User login query: < 20ms ✓
- Feedback list query: < 50ms ✓
- Indexing: Working (check `db.users.getIndexes()`) ✓

---

## 🚀 Deployment Quick Reference

### Deploy Backend to Heroku
```powershell
heroku login
heroku create intelligent-water-api

# Set env variables
heroku config:set MONGODB_URI=<your-atlas-uri>
heroku config:set JWT_SECRET=<strong-secret-key>
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Deploy Frontend to Vercel
```powershell
npm install -g vercel
cd frontend
vercel

# During deployment, set:
# NEXT_PUBLIC_API_BASE_URL = https://intelligent-water-api.herokuapp.com
```

---

## 📚 Resource Links

| Resource | URL |
|----------|-----|
| MongoDB Docs | https://docs.mongodb.com |
| Express Docs | https://expressjs.com |
| Next.js Docs | https://nextjs.org/docs |
| JWT Info | https://jwt.io |
| shadcn/ui | https://ui.shadcn.com |
| Tailwind CSS | https://tailwindcss.com |
| Axios Docs | https://axios-http.com |
| Mongoose Docs | https://mongoosejs.com |

---

## 🎯 Common Task Quick Links

- **Change password hashing strength**: `authController.js` line ~25, change `bcryptjs.genSalt(10)`
- **Extend JWT expiration**: `authController.js` line ~35, change `{ expiresIn: '7d' }`
- **Add database field**: `User.js` or `Feedback.js`, add to schema
- **Add API endpoint**: Create route in `routes/`, handler in `controllers/`
- **Change UI colors**: `frontend/src/styles/globals.css` (CSS variables)
- **Add validation**: `middleware/auth.js` or controller functions

---

## ⚡ Speed Dial

```powershell
# Setup (one-time)
cd backend && npm install && npm run seed
cd ../frontend && npm install

# Daily workflow (Terminal 1)
cd backend && npm run dev

# Daily workflow (Terminal 2)
cd frontend && npm run dev

# View database
mongosh
use intelligent-water
db.users.find()

# Reset everything
npm run seed        # Reseed database
npm run build       # Rebuild frontend
```

---

## 📞 When Stuck

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Verify checklist in [VERIFICATION.md](./VERIFICATION.md)
3. Check server logs for errors (Terminal running `npm run dev`)
4. Check browser console (F12 → Console)
5. Check MongoDB data: `mongosh → use intelligent-water → db.users.find()`
6. Test API manually: `curl http://localhost:5000/api/health`

---

**💡 Pro Tip:** Bookmark this file for quick lookup!
