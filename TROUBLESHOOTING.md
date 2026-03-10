# ❓ FAQ & Troubleshooting Guide

## Contents
1. [Installation Issues](#installation-issues)
2. [MongoDB Problems](#mongodb-problems)
3. [Backend Server Issues](#backend-server-issues)
4. [Frontend Issues](#frontend-issues)
5. [API & Authentication](#api--authentication)
6. [Database & Data](#database--data)
7. [Deployment Issues](#deployment-issues)
8. [General Tips](#general-tips)

---

## Installation Issues

### Q: "npm ERR! 404 Not Found - canvas-gauges"
**A:** This package is not available on npm and was incorrectly included. **Solution:**
- The new frontend (shadcn/ui) doesn't use canvas-gauges ✓ Already fixed
- If upgrading: Remove `canvas-gauges` from package.json dependencies

### Q: "npm install" hangs or takes forever
**A:** Common causes and solutions:
```powershell
# Clear npm cache
npm cache clean --force

# Install with legacy peer deps (Next.js sometimes requires this)
npm install --legacy-peer-deps

# Try using yarn instead
yarn install

# Set npm registry explicitly
npm config set registry https://registry.npmjs.org/
```

### Q: "Module not found" errors after npm install
**A:** Node modules cache issue:
```powershell
# Delete node_modules and lock file
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall fresh
npm install
```

### Q: Different package versions than expected
**A:** Check Node.js version:
```powershell
node --version
npm --version

# Ensure Node 16 or higher
# Download from https://nodejs.org if needed
```

---

## MongoDB Problems

### Q: "connect ECONNREFUSED ::1:27017" when starting backend
**A:** MongoDB is not running locally. Three solutions:

**Option 1: Start MongoDB Service (Windows)**
```powershell
# Check if MongoDB service exists
Get-Service MongoDB

# If not installed, install it first from MSI
# Then start the service:
Start-Service MongoDB

# Verify it's running:
Get-Service MongoDB | Select-Object Status
```

**Option 2: Run MongoDB Manually**
```powershell
# Open new PowerShell as Administrator
mongod

# Should see: "Listening on port 27017"
```

**Option 3: Use MongoDB Atlas (Cloud)**
```
1. Create account at https://mongodb.com/cloud/atlas
2. Create free M0 cluster
3. Get connection string from Atlas (store in .env, never in docs)
4. Update MONGODB_URI in backend/.env
5. Ensure IP whitelist allows 0.0.0.0/0 for development
```

### Q: "Unauthorized: not authorized on admin to execute command"
**A:** Atlas connection string issue:
- Check username/password in connection string are URL-encoded
- Special characters like `@` should be `%40`, `:` can stay as is
- Store credentials in `.env` file, never in documentation

### Q: "MongoDB process already running on port 27017"
**A:** Check if MongoDB is already running:
```powershell
# Find process using port 27017
netstat -ano | findstr :27017

# Kill the process if needed
taskkill /PID <PID> /F
```

### Q: "Cannot create index, duplicate key error"
**A:** Duplicate data in collection:
```powershell
# In MongoDB shell:
mongo

# Switch to database
use intelligent-water

# Drop unique index (be careful!)
db.users.dropIndex("email_1")

# Or drop entire collection to start fresh
db.users.drop()
db.feedbacks.drop()

# Exit shell
exit
```

---

## Backend Server Issues

### Q: Backend won't start - "Cannot find module 'express'"
**A:** Dependencies not installed:
```powershell
cd backend
npm install

# Verify server.js exists:
ls src/server.js
```

### Q: "Error: listen EADDRINUSE: address already in use :::5000"
**A:** Port 5000 is already in use:

**Option 1: Kill the existing process**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace <PID> with actual id)
taskkill /PID <PID> /F
```

**Option 2: Use different port**
```env
# Edit backend/.env
PORT=5001
```

### Q: "CORS error - blocked by browser"
**A:** Frontend making request to wrong origin:

**Check:**
1. Backend CORS is configured: Check `server.js` for CORS middleware
2. Frontend API_BASE_URL matches backend: Should be `http://localhost:5000`
3. Update `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Q: "Error: JWT_SECRET is not defined"
**A:** Environment variable not loaded:
```powershell
# Ensure backend/.env exists with:
JWT_SECRET=your-super-secret-key-change-in-production

# Restart server to reload .env
npm run dev
```

### Q: Server crashes with "Cannot read property 'userId' of undefined"
**A:** JWT token is missing or invalid:
- Check frontend is sending Authorization header
- Verify token format: `Bearer <token>` (with space)
- Test with Postman manually adding header

---

## Frontend Issues

### Q: Blank white page on http://localhost:3000
**A:** Frontend not properly served:

**Check 1: Is frontend running?**
```powershell
# In frontend folder
npm run dev

# Should show: "Local: http://localhost:3000"
```

**Check 2: Clear Next.js cache**
```powershell
# Delete cache and rebuild
Remove-Item -Recurse -Force .next
npm run dev
```

**Check 3: Browser console errors**
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Q: "Module not found: Can't resolve '@/components/ui/button'"
**A:** Component import path issue:
- Ensure components exist in `src/components/ui/`
- Check `tsconfig.json` has `"@": ["./src"]` path mapping
- Component names should match filenames (case-sensitive on Windows)

### Q: Login form not submitting
**A:** Check frontend → backend connectivity:

**Test:**
```powershell
# From browser console (F12):
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)
```

If error: Backend not running or wrong URL

### Q: "localStorage is not defined" Build Error
**A:** Next.js server-side render issue:
```typescript
// Wrong:
const token = localStorage.getItem('token')  // ❌ Server-side

// Right:
'use client'  // ← Add this at top of file
const token = localStorage.getItem('token')  // ✓ Client-side
```

All files accessing localStorage need `'use client'` directive.

### Q: Tailwind CSS not applied (unstyled components)
**A:** Tailwind not properly configured:

**Check 1: Build includes Tailwind**
```bash
npm run build
# Should show: "done in X.XXs"
```

**Check 2: globals.css has directives**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Check 3: Restart dev server**
```powershell
# Ctrl+C to stop
npm run dev
```

---

## API & Authentication

### Q: Login returns "Invalid credentials"
**A:** Check test account exists in database:

**Verify:**
```powershell
# In MongoDB shell:
mongo
use intelligent-water
db.users.find()  # Should show seed data

# If empty, run seed:
# (Exit mongo first)
npm run seed
```

### Q: "401 Unauthorized - Invalid token"
**A:** Token verification failed:

**Check 1: Token exists**
```javascript
// Browser console
localStorage.getItem('token')  // Should show JWT string
```

**Check 2: Token format correct**
- Should start with `eyJ...` (base64)
- Value in Authorization header: `Bearer <token>`

**Check 3: JWT_SECRET matches**
- Backend `.env` JWT_SECRET must match token signing key
- Change requires logout and re-login

### Q: "403 Forbidden - Admin role required"
**A:** Accessing admin endpoint without admin role:

**Check:**
```javascript
// Browser console
const token = localStorage.getItem('token')

// Decode (don't do this in production):
const parts = token.split('.')
const payload = JSON.parse(atob(parts[1]))
console.log(payload)  // Check if role === "admin"
```

**Login as admin:**
- Email: admin@example.com
- Password: password123
- (Only available after running `npm run seed`)

### Q: API requests hang without response
**A:** Server processing timeout:

**Check 1: See server logs**
```powershell
# Terminal should show request: "GET /api/..." 
# If nothing appears: request not reaching backend
```

**Check 2: Check database speed**
```powershell
# Open MongoDB shell
mongo
db.users.find().explain("executionStats")
# Should execute in < 100ms
```

**Check 3: Increase timeout** (in frontend api.ts)
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000  // 10 seconds
})
```

---

## Database & Data

### Q: "TypeError: user.toJSON is not a function"
**A:** Mongoose model issue:
```javascript
// Wrong:
const user = await User.findById(id)
return user.toJSON()  // ❌ Not a method

// Right:
const user = await User.findById(id)
return user.toObject()  // ✓ Mongoose method
return JSON.parse(JSON.stringify(user))  // ✓ Serialization
```

### Q: Seed script runs but no data appears in DB
**A:** Check seed.js execution:

**Run with detailed logging:**
```powershell
# In backend folder:
node -e "console.log('Node works'); require('./seed.js')"
```

**Common issues:**
- MongoDB not running: `mongod` in another terminal first
- Wrong MONGODB_URI in .env
- Seed.js has syntax error: Check for typos

### Q: Can't delete users/feedback - "Document not found"
**A:** ObjectID format issue:

**Check MongoDB shell:**
```powershell
mongo
use intelligent-water
db.users.findById(ObjectId("..."))  # Should work
```

**In code:** Ensure _id is ObjectId, not string:
```javascript
// Wrong:
const userId = "507f1f77bcf86cd799439011"
await User.findById(userId)  // May fail

// Right:
const { ObjectId } = require('mongodb')
const userId = new ObjectId("507f1f77bcf86cd799439011")
await User.findById(userId)
```

### Q: Data persists after deleting - seems like cache
**A:** Browser cache or in-memory state:

**Solutions:**
```powershell
# Hard refresh browser
Ctrl+Shift+R  (or Cmd+Shift+R on Mac)

# Clear All Site Data
# DevTools → Application → Storage → Clear Site Data

# Logout and login again
```

---

## Deployment Issues

### Q: "Heroku Push Rejected" error
**A:** Common causes:

**Check 1: Heroku Login**
```powershell
heroku login
# Follow prompts in browser
```

**Check 2: Git Initialization**
```powershell
git init
git add .
git commit -m "Initial commit"
```

**Check 3: Heroku App Exists**
```powershell
heroku apps:info intelligent-water-api
# If not found:
heroku create intelligent-water-api
```

**Check 4: Environment Variables Set**
```powershell
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Verify:
heroku config
```

### Q: "Application Error H10" on Heroku
**A:** App crashed/not staying alive:

**Check logs:**
```powershell
heroku logs --tail

# Look for: 
# - "TypeError: Cannot find module"
# - PORT not set
# - Database connection failed
```

**Fix:**
1. Ensure `npm start` works locally: `npm run build && npm start`
2. Check PORT is read from env: `const port = process.env.PORT || 5000`
3. Verify all dependencies in package.json
4. Commit changes and push: `git push heroku main`

### Q: "Vercel Deployment Failed"
**A:** Frontend build issue:

**Test locally first:**
```powershell
npm run build

# If successful: ✓ builds in Vercel too
# If fails: Fix locally before pushing
```

**Common failures:**
- TypeScript errors: `npm run build` shows them
- Missing env vars: Add to Vercel dashboard
- Import errors: Check paths match actual files

### Q: HTTPS certificate error after deployment
**A:** Mixed HTTP/HTTPS:

**Fix:**
```env
# In production .env:
NEXT_PUBLIC_API_BASE_URL=https://intelligent-water-api.herokuapp.com
# (Not http://)

# And ensure backend has:
NODE_ENV=production
```

---

## General Tips

### Q: How do I debug issues?
**A:** Use these tools:

```powershell
# 1. Browser DevTools (F12)
# - Console: Shows frontend errors
# - Network: Shows HTTP requests/responses
# - Application: Shows localStorage, cookies

# 2. Server logs
# npm run dev  # Shows every request and error

# 3. MongoDB Shell
mongo
use intelligent-water
db.users.find()

# 4. Postman/Thunder Client
# Test API endpoints independently

# 5. VS Code Debugger
# Set breakpoints and step through code
```

### Q: How do I reset everything and start fresh?
**A:** Complete reset procedure:

```powershell
# 1. Stop all running processes (Ctrl+C in terminals)

# 2. Clear database
mongo
use intelligent-water
db.users.deleteMany({})
db.feedbacks.deleteMany({})
exit

# 3. Clear node_modules and package locks
Remove-Item -Recurse -Force backend/node_modules
Remove-Item -Recurse -Force frontend/node_modules
Remove-Item backend/package-lock.json
Remove-Item frontend/package-lock.json

# 4. Clear frontend cache
Remove-Item -Recurse -Force frontend/.next

# 5. Clear localStorage (browser)
# DevTools → Application → Storage → Clear Site Data

# 6. Reinstall and reseed
cd backend
npm install
npm run seed

cd ../frontend
npm install

# 7. Start fresh
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

### Q: How do I change the JWT expiration time?
**A:** Modify the token creation:

```javascript
// In authController.js:
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }  // ← Change this (default: 7 days)
)

// Other options:
// { expiresIn: '24h' }   // 24 hours
// { expiresIn: '30d' }   // 30 days
// { expiresIn: 3600 }    // 3600 seconds (1 hour)
```

### Q: How do I add a new database field to User?
**A:** Mongoose schema modification:

```javascript
// In src/models/User.js
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  newField: {
    type: String,
    default: null
  },
  // Add timestamps if not present
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Note: Mongoose auto-creates index by default
```

Then:
1. Update validation in controller
2. Update API documentation
3. Restart server
4. Run seed again for clean test data

### Q: How do I check system requirements?
**A:** Verify your setup:

```powershell
# Node.js version
node --version  # Should be v16+ or v18+

# npm version
npm --version   # Should be 8+

# MongoDB (if local)
mongod --version

# Free disk space
Get-Volume C:  # Check free space

# Check available ports
netstat -ano | findstr /C:":3000" /C:":5000" /C:":27017"
```

---

## Still Having Issues?

### Before asking for help, please provide:
1. **Error message** (copy exactly from console/terminal)
2. **What were you doing when it happened?**
3. **Which command did you run?**
4. **Output of these commands:**
   ```powershell
   node --version
   npm --version
   # For MongoDB: mongod --version
   # For local setup, list MongoDB service status:
   Get-Service MongoDB
   ```
5. **Screenshot or paste of:**
   - Browser console errors (F12 → Console)
   - Server terminal output
   - Network tab requests

### Quick Resources
- 📚 [MongoDB Docs](https://docs.mongodb.com)
- 📚 [Express.js Docs](https://expressjs.com)
- 📚 [Next.js Docs](https://nextjs.org/docs)
- 🔗 [JWT.io](https://jwt.io)
- 💬 [MongoDB Community](https://community.mongodb.com)
- 💬 [Stack Overflow](https://stackoverflow.com/tags/mongodb+express+nodejs)

---

**Good luck! You've got this! 🚀**
