# Authentication Documentation

## Overview

The Eldorado application now includes JWT-based authentication with login and password functionality. This provides secure access control for creating, updating, and deleting archaeological sites.

## Features

- User registration with username, email, and password
- User login with JWT token generation
- Password hashing using bcrypt
- Protected API routes requiring authentication
- Role-based access control (admin, researcher, viewer)
- Prepared for future token-based authentication extensions

## Setup

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
cp .env.local.example .env.local
```

Update the following variables in `.env.local`:

```env
# Generate a secure JWT secret (recommended: openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d  # Token expiration (e.g., 7d, 24h, 60m)
```

### 2. Database

The authentication system uses MongoDB with a `users` collection. The collection will be created automatically when the first user registers.

## API Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- Username: 3-30 characters, alphanumeric and underscores only
- Email: Valid email format
- Password: Minimum 8 characters with at least one uppercase, one lowercase, and one number

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "researcher"
  }
}
```

### POST /api/auth/login

Login with existing credentials.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "researcher"
  }
}
```

## Protected Routes

The following routes now require authentication via JWT token:

### POST /api/sites
Create a new archaeological site (requires authentication)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

### PUT /api/sites/[id]
Update an existing site (requires authentication)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

### DELETE /api/sites/[id]
Delete a site (requires authentication)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

### Public Routes

These routes remain accessible without authentication:

- **GET /api/sites** - View all sites
- **GET /api/sites/[id]** - View a specific site

## Using Authentication in Your Client

### 1. Register a User

```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123',
  }),
});

const data = await response.json();
const token = data.token; // Store this token
```

### 2. Login

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'john_doe',
    password: 'SecurePass123',
  }),
});

const data = await response.json();
const token = data.token; // Store this token
```

### 3. Make Authenticated Requests

```javascript
// Create a new site
const response = await fetch('/api/sites', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    id: crypto.randomUUID(),
    name: 'Ancient Settlement',
    coordinates: [45.9432, 24.9668],
    radius: 50,
    type: 'archaeological_area',
    // ... other site data
  }),
});
```

## User Roles

The system supports three user roles:

- **admin**: Full access to all resources (future implementation)
- **researcher**: Can create, update, and delete sites (default role)
- **viewer**: Can only view sites (future implementation)

Currently, all registered users are assigned the `researcher` role by default.

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Input Validation**: Username, email, and password validation on registration
- **Protected Routes**: Middleware automatically validates tokens for protected routes

## Error Handling

### Common Error Responses

**400 Bad Request** - Invalid input
```json
{
  "success": false,
  "message": "Username must be at least 3 characters long"
}
```

**401 Unauthorized** - Invalid credentials or missing/invalid token
```json
{
  "error": "Unauthorized. Please log in."
}
```

**409 Conflict** - Username or email already exists
```json
{
  "success": false,
  "message": "Username already exists"
}
```

**500 Internal Server Error** - Server error
```json
{
  "success": false,
  "message": "An error occurred during registration"
}
```

## Future Enhancements

The authentication system is designed to support future extensions:

- **OAuth/Token-based authentication** (Google, GitHub, etc.)
- **Refresh tokens** for extended sessions
- **Role-based permissions** (admin-only operations)
- **Password reset** functionality
- **Email verification** for new accounts
- **Two-factor authentication** (2FA)

## Testing

### Manual Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPass123"}'
```

**Create Site (with token):**
```bash
curl -X POST http://localhost:3000/api/sites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "id":"test-site-1",
    "name":"Test Site",
    "coordinates":[45.9432,24.9668],
    "radius":50,
    "type":"info_pointer"
  }'
```

## Troubleshooting

### "Unauthorized. Please log in."

- Ensure you're including the `Authorization` header with the format: `Bearer <token>`
- Check that your token hasn't expired
- Verify your JWT_SECRET is set correctly in `.env.local`

### "Invalid username or password"

- Check that the username and password match exactly (case-sensitive)
- Ensure the user has been registered successfully

### Database Connection Issues

- Verify your `MONGODB_URI` is correct in `.env.local`
- Ensure your MongoDB instance is running and accessible
- Check that your IP address is whitelisted in MongoDB Atlas (if using cloud)
