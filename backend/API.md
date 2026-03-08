# Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### POST /auth/login
Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "channelID": "123456"
  }
}
```

---

### POST /auth/logout
Logout the current user (invalidates token on client side).

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## User Endpoints

### GET /user/profile
Get the current user's profile information.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
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

---

### PUT /user/profile
Update user profile information.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "name": "John Doe Updated",
  "profileDetails": {
    "phone": "+1-555-999-9999",
    "address": "456 New St, New City, State"
  }
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### GET /user/channel-data/:channelID
Fetch water sensor data from ThingSpeak for a specific channel.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `readAPIKey` (required): ThingSpeak API key for the channel

**Example:**
```
GET /user/channel-data/123456?readAPIKey=ABC123XYZ
```

**Response (200):**
```json
{
  "channel": {
    "id": 123456,
    "name": "Home Water Monitor",
    "description": "Real-time water quality tracking"
  },
  "feeds": [
    {
      "created_at": "2026-03-03T10:30:00Z",
      "entry_id": 1001,
      "field1": "7.2",      // pH
      "field2": "350",       // TDS (ppm)
      "field3": "75"         // Water Level (%)
    }
  ]
}
```

---

## Feedback Endpoints

### POST /feedback
Submit a new feedback or complaint.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json (or multipart/form-data for image upload)
```

**Request:**
```json
{
  "type": "quality-issue",
  "message": "Water TDS is consistently above 500ppm.",
  "image": "base64_encoded_image_or_file"  // Optional
}
```

**Types:**
- `quality-issue`
- `leak`
- `billing`
- `other`

**Response (201):**
```json
{
  "message": "Feedback submitted successfully",
  "feedback": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "type": "quality-issue",
    "message": "Water TDS is consistently above 500ppm.",
    "status": "pending",
    "image": null,
    "adminResponse": null,
    "respondedAt": null,
    "createdAt": "2026-03-03T10:30:00Z"
  }
}
```

---

### GET /feedback
Get all feedback submissions from the current user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "type": "quality-issue",
    "message": "Water TDS is consistently above 500ppm.",
    "status": "pending",
    "createdAt": "2026-03-03T10:30:00Z"
  },
  ...
]
```

---

### PUT /feedback/:id
Update feedback status (user can update their own feedback).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "status": "resolved"
}
```

**Response (200):**
```json
{
  "message": "Feedback updated successfully",
  "feedback": { ... }
}
```

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <JWT_TOKEN>` with admin role.

### GET /admin/users
Get list of all registered users.

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "channelID": "123456",
    "lastLogin": "2026-03-03T10:30:00Z",
    "createdAt": "2026-03-01T..."
  },
  ...
]
```

---

### GET /admin/feedback
Get all feedback submissions from all users.

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "type": "quality-issue",
    "message": "Water TDS is consistently above 500ppm.",
    "status": "pending",
    "createdAt": "2026-03-03T10:30:00Z"
  },
  ...
]
```

---

### GET /admin/user-history/:userId
Get historical water data for a specific user from ThingSpeak.

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "channelID": "123456"
  },
  "data": {
    "channel": { ... },
    "feeds": [
      {
        "created_at": "2026-03-03T10:30:00Z",
        "field1": "7.2",
        "field2": "350",
        "field3": "75"
      },
      ...
    ]
  }
}
```

---

### POST /admin/feedback/:feedbackId/respond
Send a response to user feedback and update its status.

**Request:**
```json
{
  "response": "Technician will visit on Monday to check the water meter."
}
```

**Response (200):**
```json
{
  "message": "Response sent successfully",
  "feedback": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "type": "quality-issue",
    "message": "Water TDS is consistently above 500ppm.",
    "status": "under-review",
    "adminResponse": "Technician will visit on Monday to check the water meter.",
    "respondedAt": "2026-03-03T10:45:00Z",
    "createdAt": "2026-03-03T10:30:00Z"
  }
}
```

---

## Health Check

### GET /health
Check if the server is running.

**Response (200):**
```json
{
  "message": "Server is running"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Route not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Error details (only in development mode)"
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Submit Feedback
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"quality-issue","message":"Water quality issue here"}'
```

---

## Database Seeding

To populate the database with test data:

```bash
npm run seed
```

This creates:
- 2 regular users (john@example.com, jane@example.com)
- 1 admin user (admin@example.com)
- 4 feedback entries with various statuses

Default password for all test accounts: `password123`
