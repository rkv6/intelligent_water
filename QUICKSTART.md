# 🌊 Intelligent Water Monitoring System - Full Setup Guide

## 📋 Prerequisites

- **Node.js** 16+ (Download from [nodejs.org](https://nodejs.org))
- **MongoDB** (Local or Atlas - see below)
- **npm** (comes with Node.js)

---

## 🚀 Quick Start (5 minutes)

### Option 1: Using Local MongoDB (Easiest for Development)

#### 1. Install MongoDB Community Edition

**Windows:**
1. Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the default options
3. MongoDB will be installed as a Windows service and automatically starts

**Verify Installation:**
```powershell
mongod --version
```

#### 2. Install Project Dependencies

```powershell
cd backend
npm install

cd ../frontend
npm install --legacy-peer-deps
```

#### 3. Seed the Database (Optional but Recommended)

```powershell
cd backend
npm run seed
```

This creates test users:
- **User**: john@example.com / password123
- **Admin**: admin@example.com / password123

#### 4. Start the Backend

```powershell
cd backend
npm run dev
```

Expected output:
```
🌊 Intelligent Water Monitoring System
═══════════════════════════════════════
✓ MongoDB connected
✓ Server running on http://localhost:5000
```

#### 5. Start the Frontend (New Terminal)

```powershell
cd frontend
npm run dev
```

Expected output:
```
▲ Next.js 14.0.0
- Local:        http://localhost:3000
- Environments: .env.local
```

#### 6. Access the Application

Open your browser and go to: **http://localhost:3000**

---

### Option 2: Using MongoDB Atlas (Cloud - Recommended for Production)

#### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up with your email (free tier available)
3. Create a new project named "intelligent-water"
4. Create a free cluster (M0 tier)

#### 2. Get Connection String

1. Click "Connect" on your cluster
2. Select "Connect your application"
3. Choose Node.js as the driver
4. Copy the connection string

Should look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/intelligent-water?retryWrites=true&w=majority
```

#### 3. Update Backend .env File

Edit `backend/.env` (DO NOT COMMIT THIS FILE):
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/intelligent-water?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here-change-in-production
PORT=5000
THINGSPEAK_BASE_URL=https://api.thingspeak.com
NODE_ENV=development
```

**⚠️ SECURITY:** Never commit `.env` file. Use `.env.example` as template
NODE_ENV=development
```

#### 4. Continue with Steps 2-6 from Option 1

---

## 📁 Project Structure

```
intelligent-water/
├── frontend/                 # Next.js + React + shadcn/ui
│   ├── src/
│   │   ├── app/             # Pages: login, signup, dashboard, profile, feedback
│   │   ├── components/ui/   # shadcn/ui components
│   │   ├── lib/             # API client, auth utilities
│   │   └── styles/          # Global styles & Tailwind
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/                  # Express.js + Node.js
│   ├── src/
│   │   ├── models/          # MongoDB schemas (User, Feedback)
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth & validation
│   │   └── server.js        # Express setup
│   ├── seed.js              # Database seeding script
│   ├── API.md               # API documentation
│   ├── SETUP.md             # Detailed setup guide
│   ├── .env                 # Environment configuration
│   └── package.json
│
└── README.md                # Main documentation
```

---

## 🔌 API Testing

### Using cURL in PowerShell

**Test Backend Health:**
```powershell
curl -Uri "http://localhost:5000/api/health"
```

**Login:**
```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

curl -Uri "http://localhost:5000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**Get User Profile (replace TOKEN):**
```powershell
curl -Uri "http://localhost:5000/api/user/profile" `
  -Headers @{"Authorization" = "Bearer YOUR_JWT_TOKEN"}
```

### Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create a new collection
3. Add requests using the endpoints in [API.md](./API.md)

---

## 🧪 Available Test Accounts

After running `npm run seed`:

### Regular User
- **Email:** john@example.com
- **Password:** password123
- **Channel:** 123456

### Another User
- **Email:** jane@example.com
- **Password:** password123
- **Channel:** 789012

### Admin User
- **Email:** admin@example.com
- **Password:** password123
- **Access:** All admin endpoints

---

## 🛠️ Common Commands

### Backend

```bash
# Development (with auto-reload)
npm run dev

# Production start
npm start

# Seed database with test data
npm run seed

# Run linter
npm run lint
```

### Frontend

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 🔐 Environment Variables

### Backend `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/intelligent-water

# JWT
JWT_SECRET=your-super-secret-key-change-this

# ThingSpeak
THINGSPEAK_BASE_URL=https://api.thingspeak.com
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_THINGSPEAK_BASE_URL=https://api.thingspeak.com
```

---

## 🐛 Troubleshooting

### MongoDB Connection Refused

**Error:** `connect ECONNREFUSED ::1:27017`

**Solutions:**
- Ensure MongoDB is running: `mongod`
- Check MongoDB service status (Windows Services)
- Use MongoDB Atlas connection string instead

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5001
```

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solutions:**
```bash
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
```

### Token Invalid / Expired

**Error:** `401 Invalid token`

**Solutions:**
- Login again to get a new token
- Check JWT_SECRET matches in .env
- Token expires in 7 days by default

---

## 📚 Documentation Files

- **[API.md](./API.md)** - Complete API endpoint documentation
- **[SETUP.md](./SETUP.md)** - Detailed setup troubleshooting
- **[../README.md](../README.md)** - Project overview and architecture

---

## 🚢 Deployment

### Deploy Backend to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create intelligent-water-api

# Set environment variables
heroku config:set MONGODB_URI=your-atlas-uri
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_BASE_URL
# Enter: https://intelligent-water-api.herokuapp.com
```

---

## 📞 Support & Resources

- **MongoDB Documentation:** https://docs.mongodb.com
- **Express.js Guide:** https://expressjs.com/en/
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui Components:** https://ui.shadcn.com
- **JWT Info:** https://jwt.io

---

## ✅ Next Steps

1. ✅ Backend is running on http://localhost:5000
2. ✅ Frontend is running on http://localhost:3000
3. 🔐 Login with test account: john@example.com / password123
4. 📊 View dashboard and create feedback
5. 👨‍💻 Explore the [API Documentation](./API.md)
6. 🎨 Customize components in `frontend/src/components/ui/`

---

**Happy Water Monitoring! 💧**
