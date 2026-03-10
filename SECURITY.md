# 🔒 Security Best Practices Guide

## Overview

This guide outlines critical security practices for the Intelligent Water Quality Monitoring System. **Credentials must NEVER be committed to version control.**

---

## 1. Environment Variables Management

### Setup Instructions

#### Backend (.env file)

1. **Copy the template:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Edit backend/.env with YOUR credentials:**
   ```env
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/intelligent-water
   JWT_SECRET=generate-a-strong-random-string
   PORT=5000
   NODE_ENV=development
   ```

3. **NEVER commit backend/.env** - It's already in .gitignore

#### Frontend (.env.local file)

1. **Create frontend/.env.local:**
   ```bash
   touch frontend/.env.local
   ```

2. **Add configuration:**
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   NEXT_PUBLIC_THINGSPEAK_BASE_URL=https://api.thingspeak.com
   ```

3. **NEVER commit frontend/.env.local**

---

## 2. Credential Management

### MongoDB Atlas Credentials

**DO THIS:**
- ✅ Store credentials in `.env` file (locally)
- ✅ Use strong passwords (16+ characters with mixed case, numbers, symbols)
- ✅ URL-encode special characters (@→%40, :→%3A, etc.)
- ✅ Use environment-specific credentials (dev, staging, prod)
- ✅ Rotate credentials every 90 days

**DO NOT DO THIS:**
- ❌ Commit `.env` file to Git/GitHub
- ❌ Put credentials in documentation
- ❌ Use default passwords
- ❌ Log credentials to console
- ❌ Share credentials via email/Slack

### JWT Secret

**Generate a secure JWT secret:**
```bash
# Option 1: OpenSSL (Linux/Mac)
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online (NOT recommended for production)
Use a strong password generator at passgen.co
```

---

## 3. MongoDB Atlas Security

### IP Whitelist Setup

1. **Go to MongoDB Atlas Console**
2. **Navigate to: Network Access → IP Whitelist**
3. **For Development:**
   - Add: `0.0.0.0/0` (allows all IPs)
4. **For Production:**
   - Add only your server's IP address
   - Lock down to specific ranges

### Connection String Security

```
✅ CORRECT FORMAT (in .env only):
MONGODB_URI=mongodb+srv://user%40email:pass%40123@cluster.mongodb.net/db

❌ WRONG (in documentation):
mongodb+srv://user@email:pass@123@cluster.mongodb.net/db
```

---

## 4. Git/Version Control Security

### Verify .gitignore is properly configured

**Check what's ignored:**
```bash
cd backend
git status  # Should NOT show .env
git check-ignore -v .env  # Should confirm it's ignored
```

### If credentials were accidentally committed:

1. **Remove from commit history:**
   ```bash
   git rm --cached .env
   git commit -m "Remove .env file" --amend
   ```

2. **Rotate all credentials immediately:**
   - Change MongoDB password
   - Generate new JWT secret
   - Update all .env files

3. **Force push (if only local):**
   ```bash
   git push --force-with-lease
   ```

4. **Use BFG Repo Cleaner (if already pushed):**
   ```bash
   bfg --delete-files .env repo.git
   ```

---

## 5. API Security

### Request/Response Practices

**DO:**
- ✅ Always use HTTPS/TLS in production
- ✅ Validate all inputs (backend validation mandatory)
- ✅ Sanitize outputs before sending to client
- ✅ Implement rate limiting
- ✅ Use CORS properly (whitelist origins)
- ✅ Implement request timeout (30-60 seconds)

**DON'T:**
- ❌ Log sensitive data (passwords, API keys, tokens)
- ❌ Send credentials in query parameters
- ❌ Trust client-side validation
- ❌ Expose internal error details to clients
- ❌ Allow unlimited request sizes

### Example Secure Logging:

```javascript
// ❌ BAD
console.log('User:', { email, password, token });

// ✅ GOOD
console.log('User logged in:', { email, userId });
console.log('API Key:', apiKey.substring(0, 4) + '****');
```

---

## 6. Authentication Security

### JWT Token Best Practices

```javascript
// ✅ GOOD: Secure JWT generation
const token = jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  { 
    expiresIn: '24h',           // Short expiration
    algorithm: 'HS256',         // Secure algorithm
    issuer: 'aqua-monitor',
    audience: 'aqua-monitor-app'
  }
);

// Store in HTTP-only cookie (not localStorage)
res.cookie('token', token, {
  httpOnly: true,              // Prevent XSS
  secure: true,                // HTTPS only
  sameSite: 'Strict',          // CSRF protection
  maxAge: 24 * 60 * 60 * 1000  // 24 hours
});
```

### Frontend Token Handling

```javascript
// ✅ GOOD: Use HTTP-only cookies automatically
// Cookies are sent with every request automatically

// ❌ BAD: Never store sensitive tokens in localStorage
localStorage.setItem('token', token);  // Vulnerable to XSS
```

---

## 7. Data Protection

### Sensitive Data Fields

**Never log or expose:**
- Passwords (hash only)
- API keys and tokens
- MongoDB credentials
- Personal identification numbers
- Financial information

### Password Storage

```javascript
// ✅ CORRECT: Never store plain passwords
const passwordHash = bcrypt.hashSync(password, 10);

// ❌ WRONG: Never do this
db.save({ email, password });
```

---

## 8. Production Deployment Checklist

- [ ] All credentials are in environment variables (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] JWT_SECRET is a strong random string (32+ characters)
- [ ] MongoDB uses strong password (16+ characters)
- [ ] MongoDB IP whitelist is restricted to server IPs only
- [ ] HTTPS/TLS is enabled
- [ ] CORS is configured to specific domains
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] Error messages don't expose sensitive details
- [ ] Logging doesn't capture sensitive data
- [ ] Dependencies are up to date (`npm audit`)
- [ ] HTTPS certificates are valid and not self-signed
- [ ] Backups are encrypted and tested
- [ ] Monitoring and alerting are configured

---

## 9. Emergency Procedures

### If credentials are leaked:

1. **Immediately rotate all credentials:**
   ```bash
   # MongoDB Atlas
   - Go to Database Users
   - Delete old user
   - Create new user with new password
   
   # JWT Secret
   - Generate new JWT_SECRET
   - Update .env files
   - Restart all services
   ```

2. **Review access logs:**
   - Check MongoDB Activity
   - Review API request logs
   - Look for unauthorized access

3. **Communicate with team:**
   - Notify all team members
   - Update documentation
   - Ensure new credentials are distributed securely

### Updates for GitHub Secrets

If using GitHub with Actions:

1. **Navigate to:** Settings → Secrets and variables → Actions
2. **Update each secret:**
   - MONGODB_URI
   - JWT_SECRET
   - Other sensitive vars
3. **Re-run workflows** for changes to take effect

---

## 10. Security Monitoring

### Set up alerts for:

- Failed authentication attempts
- Unusual database queries
- API errors or timeouts
- Rate limit violations
- Credential expiration

### Regular security audits:

```bash
# Check Node dependencies for vulnerabilities
npm audit
npm audit fix

# Check outdated packages
npm outdated

# Generate security report
npm audit --audit-level=moderate
```

---

## Quick Reference

| Secret | Location | Who Knows? | Rotation |
|--------|----------|-----------|----------|
| MongoDB URI | .env | Developers, Operations | 90 days |
| JWT Secret | .env | Backend code | 90 days / On incident |
| API Keys | GitHub Secrets | CI/CD System | 180 days |
| Passwords | Password Manager | Team Lead | As needed |

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security-checklist/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [npm audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

**Last Updated:** March 10, 2026  
**Created By:** AI Security Assistant  
**Next Review:** 90 days from now
