# ✅ Setup Verification Checklist

Use this checklist to verify your intelligent water monitoring system is set up correctly.

---

## Phase 1: Prerequisites ✓

- [ ] Node.js installed (v16.x or v18.x)
  ```powershell
  node --version  # Should show v16.x, v17.x, or v18.x
  ```

- [ ] npm installed (v8+)
  ```powershell
  npm --version  # Should be 8 or higher
  ```

- [ ] MongoDB installed or Atlas account created
  - [ ] Local MongoDB: `mongod --version` works
  - [ ] **OR** MongoDB Atlas: Account created & connection string obtained

- [ ] Git installed (optional but recommended)
  ```powershell
  git --version
  ```

- [ ] VS Code or preferred code editor

- [ ] PowerShell or Command Prompt open

---

## Phase 2: Environment Setup ✓

### Backend Setup

- [ ] `backend/.env` file exists with correct values
  ```powershell
  # From backend folder:
  type .env
  ```
  
  Should contain:
  ```
  PORT=5000
  MONGODB_URI=mongodb://localhost:27017/intelligent-water
  JWT_SECRET=your-secret-key-here
  NODE_ENV=development
  ```

- [ ] MONGODB_URI is reachable
  - [ ] **Local:** `mongod` is running successfully
  - [ ] **Atlas:** Connection string is valid (test in MongoDB Compass if available)

- [ ] `backend/.env.development` exists

- [ ] `backend/.env.production.example` exists (for reference)

### Frontend Setup

- [ ] `frontend/.env.local` exists with:
  ```
  NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
  NEXT_PUBLIC_THINGSPEAK_BASE_URL=https://api.thingspeak.com
  ```

---

## Phase 3: Dependencies Installation ✓

### Backend Dependencies

- [ ] `backend/node_modules` exists
  ```powershell
  # From backend folder:
  dir node_modules | wc -m  # Should show 257 items
  ```

- [ ] All core packages installed:
  ```powershell
  npm list --depth=0
  ```
  
  Should show:
  ```
  ├── express@4.18.2
  ├── mongoose@8.0.0
  ├── jsonwebtoken@9.0.0
  ├── bcryptjs@2.4.3
  ├── cors@2.8.5
  ├── dotenv@16.3.1
  └── nodemon@3.0.1
  ```

- [ ] No vulnerability warnings
  ```powershell
  npm audit
  # Should show: audited XXX packages in X.XXs
  # (0 vulnerabilities OK, minor warnings OK)
  ```

### Frontend Dependencies

- [ ] `frontend/node_modules` exists
  ```powershell
  # From frontend folder:
  dir node_modules | wc -m  # Should show ~462 items
  ```

- [ ] Core Next.js packages present:
  ```powershell
  npm list next react react-dom
  ```
  
  Should show:
  ```
  ├── next@14.0.0
  ├── react@18.2.0
  └── react-dom@18.2.0
  ```

- [ ] shadcn/ui components installed:
  ```powershell
  dir src/components/ui  # Should show *.tsx files
  ```
  
  Files present:
  ```
  badge.tsx
  button.tsx
  card.tsx
  input.tsx
  label.tsx
  progress.tsx
  skeleton.tsx
  textarea.tsx
  ```

---

## Phase 4: Database Setup ✓

### MongoDB Connection

- [ ] MongoDB is running
  ```powershell
  # Test connection:
  mongosh  # or 'mongo' for older versions
  
  # If connected, you'll see: ">"
  # Type: exit
  ```

- [ ] `intelligent-water` database created
  ```powershell
  mongosh
  show databases
  # Should list: intelligent-water
  exit
  ```

- [ ] Collections exist (before seeding, after seeding these should have data)
  ```powershell
  mongosh
  use intelligent-water
  show collections
  # Should show: feedbacks, users
  exit
  ```

### Database Seeding

- [ ] `backend/seed.js` file exists
  ```powershell
  type backend/seed.js  # Should show seed script
  ```

- [ ] Seed was run successfully
  ```powershell
  # From backend folder:
  npm run seed
  
  # Should show output like:
  # ✓ Database seeding completed successfully
  ```

- [ ] Test data exists in database
  ```powershell
  mongosh
  use intelligent-water
  db.users.count()  # Should show: 3
  db.feedbacks.count()  # Should show: 4
  exit
  ```

- [ ] Test accounts created
  ```powershell
  mongosh
  use intelligent-water
  db.users.find()
  
  # Should show users like:
  # { _id: xxx, email: "john@example.com", ... }
  # { _id: xxx, email: "jane@example.com", ... }
  # { _id: xxx, email: "admin@example.com", role: "admin" ... }
  exit
  ```

---

## Phase 5: Backend Server ✓

### File Structure

- [ ] `backend/src/server.js` exists
- [ ] `backend/src/controllers/` exists with 4 controllers:
  - [ ] `authController.js`
  - [ ] `userController.js`
  - [ ] `feedbackController.js`
  - [ ] `adminController.js`

- [ ] `backend/src/routes/` exists with 4 route files:
  - [ ] `authRoutes.js`
  - [ ] `userRoutes.js`
  - [ ] `feedbackRoutes.js`
  - [ ] `adminRoutes.js`

- [ ] `backend/src/models/` exists with 2 models:
  - [ ] `User.js`
  - [ ] `Feedback.js`

- [ ] `backend/src/middleware/auth.js` exists

### Server Startup

- [ ] Backend starts without errors
  ```powershell
  # From backend folder:
  npm run dev
  
  # Should show:
  # 🌊 Intelligent Water Monitoring System
  # ═══════════════════════════════════════
  # ✓ MongoDB connected
  # ✓ Server running on http://localhost:5000
  ```

- [ ] Server is accessible
  ```powershell
  # In another PowerShell:
  curl http://localhost:5000/api/health
  
  # Should return: {"status":"ok"}
  ```

- [ ] No error logs appearing

- [ ] Ctrl+C stops server cleanly

---

## Phase 6: Frontend Setup ✓

### File Structure

- [ ] `frontend/src/app/` pages exist:
  - [ ] `layout.tsx`
  - [ ] `page.tsx` (home page)
  - [ ] `login/page.tsx`
  - [ ] `signup/page.tsx`
  - [ ] `dashboard/page.tsx`
  - [ ] `profile/page.tsx`
  - [ ] `feedback/page.tsx`

- [ ] `frontend/src/lib/` files exist:
  - [ ] `api.ts` (API client)
  - [ ] `auth.ts` (Auth utilities)
  - [ ] `utils.ts` (Helper functions)

- [ ] `frontend/src/components/ui/` has shadcn components

- [ ] `frontend/src/styles/globals.css` exists

### Frontend Startup

- [ ] Frontend builds successfully
  ```powershell
  # From frontend folder:
  npm run build
  
  # Should show:
  # ✓ Compiled successfully
  ```

- [ ] Frontend server starts
  ```powershell
  # From frontend folder:
  npm run dev
  
  # Should show:
  # ▲ Next.js 14.0.0
  # - Local:        http://localhost:3000
  ```

- [ ] Frontend is accessible
  ```powershell
  # Open browser or:
  curl http://localhost:3000
  ```

- [ ] Homepage loads (blue hero with "Intelligent Water Monitoring System")

- [ ] Navigation links work (Home, Login, Signup)

---

## Phase 7: API Testing ✓

### Authentication Endpoints

- [ ] Signup works
  ```powershell
  # Test with new account:
  curl -X POST http://localhost:5000/api/auth/signup `
    -H "Content-Type: application/json" `
    -d '{
      "name": "Test User",
      "email": "test@example.com",
      "password": "Password123!",
      "address": "123 Main St",
      "serialNumber": "ESP001",
      "channelID": "123456"
    }'
  
  # Response should include: token
  ```

- [ ] Login works
  ```powershell
  curl -X POST http://localhost:5000/api/auth/login `
    -H "Content-Type: application/json" `
    -d '{
      "email": "john@example.com",
      "password": "password123"
    }'
  
  # Response should include: token (JWT string)
  ```

- [ ] Invalid credentials rejected
  ```powershell
  curl -X POST http://localhost:5000/api/auth/login `
    -H "Content-Type: application/json" `
    -d '{
      "email": "john@example.com",
      "password": "wrongpassword"
    }'
  
  # Response should: 401 Invalid credentials
  ```

### Protected Endpoints

- [ ] Get profile requires auth token
  ```powershell
  # Get token first:
  $loginResponse = curl -X POST http://localhost:5000/api/auth/login `
    -H "Content-Type: application/json" `
    -d '{"email":"john@example.com","password":"password123"}' | ConvertFrom-Json
  
  $token = $loginResponse.token
  
  # Use token to get profile:
  curl -X GET http://localhost:5000/api/user/profile `
    -H "Authorization: Bearer $token"
  
  # Response should include: user name, email, address
  ```

- [ ] Feedback endpoint requires auth
  ```powershell
  curl -X GET http://localhost:5000/api/feedback `
    -H "Authorization: Bearer $token"
  
  # Response should be: array of feedback objects
  ```

### Admin Endpoints

- [ ] Admin endpoints require admin role
  ```powershell
  # Try with regular user (should fail):
  curl -X GET http://localhost:5000/api/admin/users `
    -H "Authorization: Bearer $regularToken"
  
  # Should return: 403 Forbidden
  
  # Try with admin (should work):
  curl -X GET http://localhost:5000/api/admin/users `
    -H "Authorization: Bearer $adminToken"
  
  # Should return: array of all users
  ```

---

## Phase 8: Frontend-Backend Integration ✓

### API Client Configuration

- [ ] API base URL is correct
  ```powershell
  # Check: frontend/src/lib/api.ts
  # Should have: baseURL: 'http://localhost:5000'
  ```

- [ ] JWT interceptor is configured
  ```powershell
  # Check: frontend/src/lib/api.ts
  # Should attach token to Authorization header
  ```

### End-to-End User Flow

- [ ] Can navigate to login page
  - Open http://localhost:3000
  - Click "Login" or go to /login
  - Should see: email and password form

- [ ] Can login with test account
  - Email: john@example.com
  - Password: password123
  - Should: Redirect to dashboard

- [ ] Dashboard loads user data
  - Should see: Welcome message with username
  - Should see: Water monitoring metrics (placeholder if no ThingSpeak data)

- [ ] Can view profile page
  - Click "Profile" in header
  - Should see: Name, Email, Address, Serial Number, Channel ID
  - Should see: Edit button (optional functionality)

- [ ] Can submit feedback
  - Click "Feedback" in header
  - Fill form: Type, Title, Description, Priority
  - Click "Submit"
  - Should be redirected/show success message
  - Feedback appears in list below form

- [ ] Can logout
  - Click "Logout" in header
  - Should redirect to home page
  - Clicking dashboard should require login again

### Token Management

- [ ] JWT token stored in localStorage
  ```javascript
  // Browser console (F12):
  localStorage.getItem('token')
  // Should show: eyJ... (JWT string)
  ```

- [ ] Token sent with API requests
  ```javascript
  // Browser DevTools → Network tab
  // Click any API request
  // Headers → Look for: Authorization: Bearer eyJ...
  ```

- [ ] Token persists across page reload
  - Login
  - Refresh browser (F5)
  - Should remain logged in

- [ ] Token cleared on logout
  - Login
  - Logout
  - Check: `localStorage.getItem('token')` returns `null`
  - Should be redirected to home

---

## Phase 9: Documentation ✓

- [ ] QUICKSTART.md exists in root
- [ ] ARCHITECTURE.md exists in root
- [ ] TROUBLESHOOTING.md exists in root
- [ ] backend/API.md exists (40+ endpoints documented)
- [ ] backend/SETUP.md exists
- [ ] All README.md files have content

---

## Phase 10: Performance Check ✓

### Frontend Performance

- [ ] Page loads in < 3 seconds
- [ ] Navigation is smooth (no lag)
- [ ] Form submission is responsive
- [ ] No console errors (F12 → Console)

### Backend Performance

- [ ] API responses in < 500ms
- [ ] Database queries are fast
- [ ] No memory leaks (run `npm run dev` for 5 mins, should be stable)

### Database Performance

- [ ] User lookup is fast (< 10ms)
- [ ] Feedback queries are responsive

---

## Phase 11: Security Check ✓

### Password Security

- [ ] Signup password validation works
  - Rejects weak passwords
  - Requires min 8 chars

- [ ] Passwords stored as bcrypt hashes
  ```powershell
  mongosh
  use intelligent-water
  db.users.findOne({email: "admin@example.com"})
  
  # password field should look like: $2b$10$... (bcrypt hash, not plaintext)
  ```

### Token Security

- [ ] JWT tokens expire (default: 7 days)
- [ ] Expired tokens are rejected (401 response)

### CORS Security

- [ ] Backend only accepts requests from frontend origin
- [ ] Admin endpoints require admin role verification

---

## Phase 12: Ready for Production? ✓

### Before Deployment

- [ ] All tests pass locally ✓
- [ ] No console errors in browser
- [ ] No errors in server logs
- [ ] Database backup created (if using Atlas)
- [ ] Environment variables updated for production
- [ ] JWT_SECRET changed to strong value (not sample)
- [ ] MONGODB_URI uses Atlas (not localhost)

### Optional Enhancements

- [ ] Add rate limiting to API endpoints
- [ ] Add request validation middleware
- [ ] Add logging system
- [ ] Add error tracking (Sentry, etc.)
- [ ] Add caching (Redis, etc.)
- [ ] Add image upload for feedback
- [ ] Add testing suite (Jest, etc.)

---

## Final Verification

### All Systems Green? ✓

Run this final test:

```powershell
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend (after backend is ready)
cd frontend
npm run dev

# Terminal 3: Test complete flow
# 1. Open http://localhost:3000
# 2. Click "Signup"
# 3. Create account: test@test.com / Password123!
# 4. Auto-login to dashboard
# 5. Submit feedback
# 6. View profile
# 7. Logout
# 8. Login with john@example.com / password123
# 9. Check database has all entries
```

If all steps work → **System is ready! 🎉**

---

## Troubleshooting Quick Links

- 🔧 **Installation Issues** → See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#installation-issues)
- 🗄️ **MongoDB Issues** → See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#mongodb-problems)
- 🚀 **Backend Issues** → See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#backend-server-issues)
- 🎨 **Frontend Issues** → See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#frontend-issues)
- 📡 **API Issues** → See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#api--authentication)

---

**Congratulations! Your system is fully operational! 🌊💧**
