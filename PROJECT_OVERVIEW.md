# Challengers Component Tracker - Project Overview

## 📋 Executive Summary
**Challengers Component Tracker** is a full-stack web application for managing hardware/equipment inventory within the Challengers team. Members can borrow components, track availability, receive notifications, and admins can manage inventory and approve requests.

---

## 🏗️ Architecture Overview

### High-Level Architecture:
```
┌─────────────────────────────────────────────────────────┐
│                    Users (Browser)                       │
│                  http://localhost:3000                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend (React + Tailwind)                 │
│  • Pages: Login, Dashboard, Components, Requests        │
│  • Real-time UI updates                                 │
│                │
└───────────────────────┬─────────────────────────────────┘
                        │ (API Calls)
                        ▼
┌─────────────────────────────────────────────────────────┐
│         Backend API (Node.js + Express)                 │
│         http://localhost:5000                           │
│  • JWT Authentication                                    │
│  • Component checkout/return logic                      │
│  • Email notifications                                  │
│  • Session tracking                                     │
└───────────────────────┬─────────────────────────────────┘
                        │ (Firestore Queries)
                        ▼
┌─────────────────────────────────────────────────────────┐
│    Database: Firebase Firestore (Cloud)                 │
│    Region: asia-south1 (Mumbai, India)                 │
│    Collections:                                          │
│    • users, components, checkoutHistory                │
│    • componentRequests, userSessions, etc.             │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Frontend Technology Stack

### Framework & Libraries:
- **React 18** - UI library with hooks (useState, useEffect, useContext)
- **Vite** - Lightning-fast build tool (HMR - Hot Module Replacement)
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **date-fns** - Date formatting and manipulation
- **Lucide Icons** - SVG icon library

### Key Features:
1. **Component-Based Architecture**
   - Modular, reusable components
   - Layout wrapper with Navigation
   - Page components: Login, Dashboard, ComponentList, etc.

2. **State Management**
   - React Context API (AuthContext) for user authentication
   - useState for local component state
   - Token stored in localStorage/sessionStorage

3. **Authentication Flow**
   ```
   User Login → API Request → JWT Token → Store in Storage → Redirect Dashboard
   ```

4. **API Communication**
   - Axios interceptors for automatic token injection
   - Error handling with 401 redirect to login
   - Base URL: http://localhost:5000/api

5. **Key Pages**
   - **Login**: Username/Email + Password (browser password manager integrated)
   - **Dashboard**: Overview of borrowed items and statistics
   - **ComponentList**: View all components, filter by category/status
   - **ComponentDetail**: View component, checkout/return
   - **MyBorrowedItems**: Items currently borrowed by user
   - **Requests**: Members request components, admins approve/reject
   - **Profile**: View user info, notification preferences
   - **UserManagement**: Admin only - manage users and roles

### Styling:
- Gradient backgrounds (blue to purple)
- Circular logo with animation
- Responsive design (mobile, tablet, desktop)
- Dark/light color scheme
- Animated buttons and transitions

---

## 🖥️ Backend Technology Stack

### Framework & Tools:
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework for routing and middleware
- **Bcryptjs** - Password hashing (secure storage)
- **JSONWebToken (JWT)** - Authentication tokens
- **Nodemailer** - Email service (Gmail SMTP)
- **node-cron** - Scheduled tasks
- **Multer** - File upload handling

### Architecture Pattern:
**MVC (Model-View-Controller)**
```
Routes → Controllers → Models → Firebase
```

### Key Files Structure:
```
backend/
├── server.js                 # Express app initialization
├── routes/                   # API endpoint definitions
│   ├── auth.routes.js       # Login, register, forgot password
│   ├── component.routes.js  # Component CRUD & checkout/return
│   ├── user.routes.js       # User management
│   ├── dashboard.routes.js  # Statistics & analytics
│   └── request.routes.js    # Component requests
├── controllers/              # Business logic
│   ├── authController.js    # Auth logic + session tracking
│   ├── componentController.js
│   ├── userController.js
│   └── requestController.js
├── models/                   # Firestore interactions
│   ├── User.js              # User CRUD + password hashing
│   ├── Component.js         # Component inventory
│   ├── UserSession.js       # Session tracking (Remember Me)
│   ├── CheckoutHistory.js   # Audit log
│   └── ComponentRequest.js  # Pending requests
├── services/                 # External integrations
│   ├── emailService.js      # Email templates & sending
│   ├── notificationService.js
│   └── whatsappService.js   # (Disabled)
├── middleware/               # Auth verification
│   └── auth.js              # JWT validation
├── jobs/                     # Scheduled tasks
│   └── scheduler.js         # Cron jobs (overdue checks)
└── config/                   # Configuration
    ├── firebase.js          # Firebase initialization
    └── db.js                # Database connection
```

### API Endpoints:

#### Authentication
- `POST /api/auth/login` - Login (username/email + password)
  - Request: `{ username, password, rememberMe }`
  - Response: `{ user, token, sessionId }`
- `POST /api/auth/register` - Register with invite code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset with code
- `GET /api/auth/me` - Get current user

#### Components
- `GET /api/components` - List all components (filterable)
- `GET /api/components/:id` - Component details
- `POST /api/components/:id/checkout` - Checkout component
- `POST /api/components/:id/return` - Return component
- `GET /api/components/:id/history` - Checkout history
- `POST /api/components` - Create component (admin only)
- `POST /api/components/:id/upload-image` - Upload image (multipart/form-data)

#### Requests
- `POST /api/requests` - Request component
- `GET /api/requests` - List requests (admin: all, member: own)
- `PATCH /api/requests/:id/approve` - Approve request (admin)
- `PATCH /api/requests/:id/reject` - Reject request (admin)

#### Users
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id/borrowed` - Items borrowed by user
- `PATCH /api/users/:id/preferences` - Update notification preferences

#### Dashboard
- `GET /api/dashboard/stats` - Statistics overview

### Key Features:

1. **Authentication & Sessions**
   - JWT tokens (30-day expiry)
   - Password hashing with bcrypt (10 salt rounds)
   - Session tracking in Firebase (Remember Me)
   - Login tracking (IP, browser, platform, timestamp)

2. **Component Management**
   - Quantity system (totalQuantity, availableQuantity)
   - Status tracking (available, taken, overdue)
   - Checkout duration (default 7 days)
   - Image upload (stored in /uploads/components/)

3. **Checkout/Return Flow**
   - Atomic operations (prevent race conditions)
   - Update component status
   - Create history record
   - Update user's borrowed items
   - Trigger notifications

4. **Notifications**
   - Email notifications via Nodemailer (Gmail SMTP)
   - HTML templates with gradients
   - Triggers:
     - Component checked out
     - Due soon (1 day before due date)
     - Overdue (past due date)
     - Request approved/rejected
   - User can toggle email preferences

5. **Scheduled Jobs** (node-cron)
   - **Twice daily (9 AM & 6 PM)**: Check for overdue components
   - **Hourly**: Retry failed email notifications
   - Automatic notification sending

6. **Security**
   - JWT middleware on protected routes
   - Password hashing (never store plain text)
   - CORS enabled for frontend
   - Input validation
   - SQL injection prevention (Firestore is document-based)

---

## 🗄️ Database: Firebase Firestore

### Why Firestore?
- ✅ **NoSQL** - Flexible document structure
- ✅ **Real-time** - Live updates possible
- ✅ **Scalable** - Handles growth automatically
- ✅ **Secure** - Built-in security rules
- ✅ **Cloud-hosted** - No server maintenance
- ✅ **India location** - asia-south1 (Mumbai) for low latency

### Collections & Document Structure:

#### 1. **users** Collection
- **Document ID**: username (e.g., "pranav", "member1")
- **Fields**:
  - username: String
  - name: Full name
  - email: Email address
  - phone: Phone number
  - password: Bcrypt hashed
  - role: "admin" or "member"
  - createdAt: Timestamp
  - lastLogin: Timestamp
  - lastLoginIp: IP address
  - notificationPreferences: { email: true/false }

#### 2. **components** Collection
- **Document ID**: componentId (e.g., "ARD-001", "SENS-001")
- **Fields**:
  - componentId: Unique identifier
  - name: Component name
  - category: Category (Arduino, Sensor, Motor, etc.)
  - description: Details
  - status: "available" | "taken" | "overdue"
  - totalQuantity: Number (1-10)
  - availableQuantity: Number
  - imageUrl: Link to uploaded image
  - currentBorrower: User ID (if taken)
  - checkedOutAt: Timestamp
  - dueDate: Calculated (checkout date + 7 days)
  - checkoutDuration: Days (default 7)
  - createdAt: Timestamp

#### 3. **checkoutHistory** Collection
- **Document ID**: HIST-date-componentId-action-number
- **Fields**:
  - componentId: Reference to component
  - userId: User who checked out
  - action: "checkout" or "return"
  - timestamp: When action occurred
  - notes: Optional notes
  - returnTimestamp: When returned (if applicable)

#### 4. **componentRequests** Collection
- **Document ID**: REQ-date-username-componentId
- **Fields**:
  - componentId: Requested component
  - requestedBy: Username
  - requestedAt: Timestamp
  - status: "pending" | "approved" | "rejected"
  - approvedBy: Admin username (if approved)
  - approvalDate: Timestamp (if approved)
  - rejectionReason: Text (if rejected)

#### 5. **userSessions** Collection
- **Document ID**: SESSION-date-time-username
- **Fields**:
  - userId: Username
  - username: Username
  - loginTime: When logged in
  - rememberMe: Boolean (30 days vs 1 day expiry)
  - expiresAt: Expiration timestamp
  - isActive: Boolean
  - ipAddress: User's IP
  - userAgent: Full browser string
  - deviceInfo: { browser: "Chrome", platform: "Windows" }
  - lastActivity: Last activity timestamp

#### 6. **notificationLogs** Collection
- **Document ID**: LOG-date-time-username-type
- **Fields**:
  - userId: Username
  - type: "checkout" | "due_soon" | "overdue" | "request"
  - medium: "email" (WhatsApp disabled)
  - sentAt: Timestamp
  - recipient: Email address
  - subject: Email subject
  - status: "sent" | "failed" | "pending"
  - retryCount: Number of retry attempts

#### 7. **invites** Collection
- **Document ID**: Invite code (6 digits)
- **Fields**:
  - code: 6-digit code
  - email: Invited email
  - name: Invitee name
  - role: "admin" or "member"
  - createdAt: Timestamp
  - expiresAt: 24 hours from creation
  - used: Boolean

#### 8. **passwordResets** Collection
- **Document ID**: PWRESET-date-time-email-username
- **Fields**:
  - email: User's email
  - code: 6-digit reset code
  - createdAt: Timestamp
  - expiresAt: 30 minutes from creation
  - used: Boolean

### Data Model Features:
- ✅ **Readable Document IDs** - Easy to identify in console
- ✅ **No garbage characters** - All cleaned up
- ✅ **Timestamps** - ISO format, UTC stored
- ✅ **References** - User IDs and component IDs
- ✅ **Audit trail** - Complete history of all actions
- ✅ **Data integrity** - No orphaned records

---

## 🔐 Authentication & Security

### Login Flow:
```
1. User enters username/email + password
2. Frontend sends POST /api/auth/login
3. Backend validates credentials
4. Password compared with bcrypt hash
5. If valid:
   - JWT token generated (30-day expiry)
   - Session created in Firebase
   - User data returned
6. Frontend stores token + user in localStorage (if Remember Me)
7. User redirected to Dashboard
8. Browser prompts: "Save password?"
```

### Sessions & Remember Me:
- **With "Remember Me"**: 
  - Stored in localStorage
  - Persists after browser close
  - Session expires in 30 days
  
- **Without "Remember Me"**:
  - Stored in sessionStorage
  - Cleared when browser closes
  - Session expires in 1 day

### Browser Password Manager:
- Form has proper HTML5 attributes:
  - `<form autoComplete="on">`
  - `<input name="username" autoComplete="username">`
  - `<input name="password" autoComplete="current-password">`
- After successful login, browser offers to save
- On return visit, browser auto-fills credentials

### Protected Routes:
- All API routes except login/register require JWT
- Token verified in middleware
- 401 error redirects to login
- User info stored in `req.user`

---

## 📧 Email Notification System

### Email Service (Nodemailer):
- **Provider**: Gmail SMTP
- **Configuration**:
  - Host: smtp.gmail.com
  - Port: 587
  - Auth: Gmail App Password (not regular password)

### Email Templates:
1. **Checkout Notification**
   - Blue/purple gradient
   - Component name, quantity, due date
   - Action: None (informational)

2. **Due Soon Alert**
   - Yellow/orange gradient
   - Reminder: Due in 1 day
   - Action: Return ASAP

3. **Overdue Alert**
   - Red gradient
   - Days overdue counter
   - Urgent: Return immediately

4. **Request Approval**
   - Green gradient
   - Approved by admin
   - Pickup instructions

5. **Request Rejection**
   - Red gradient
   - Reason for rejection
   - Can request again

### Notification Triggers:
- **Checkout**: Sent immediately when component checked out
- **Due Soon**: 1 day before due date
- **Overdue**: Every day after due date until returned
- **Request**: When admin approves/rejects request

### Retry Logic:
- Failed emails retried hourly
- Maximum 3 retry attempts
- Logged in notificationLogs collection

---

## 🎯 User Roles & Permissions

### Admin Role 👑
**Capabilities**:
- View all users and their details
- Create/edit/delete components
- Upload component images
- Approve/reject component requests
- View all checkout history
- Cannot checkout/return components (inventory management only)
- Send notifications

**Dashboard**: Full analytics, all activity visible

### Member Role 👤
**Capabilities**:
- Browse available components
- Request components (sent to admin)
- Checkout approved components
- Return checked-out components
- View only their own history
- Manage notification preferences
- View their borrowed items

**Dashboard**: Personal items, requests, activity

---

## 🚀 Deployment & Hosting

### Frontend Hosting:
- **Platform**: Vercel (Next.js/React optimized)
- **Build**: `npm run build` → Static files
- **URL**: Will be provided post-deployment

### Backend Hosting:
- **Platform**: Vercel or Heroku
- **Build**: Node.js server
- **Environment Variables**: (managed in dashboard)

### Database:
- **Firebase Firestore**: Already in cloud
- **Region**: asia-south1 (Mumbai)
- **Backup**: Automatic Firebase backups

---

## 📊 Key Metrics & Features

### Component Management:
- ✅ 10 components in system (sample data)
- ✅ Quantity system (1-10 units per component)
- ✅ Image upload & storage
- ✅ Category filtering
- ✅ Status tracking

### User Management:
- ✅ 3 users (1 admin, 2 members)
- ✅ Role-based access control
- ✅ Email notifications enabled
- ✅ Session tracking enabled

### Audit & Compliance:
- ✅ Complete checkout history
- ✅ User activity logs
- ✅ Session tracking
- ✅ Email delivery logs
- ✅ Readable document IDs for transparency

---

## 🛠️ Development Workflow

### Setup:
```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Environment variables
# Backend: .env file with MONGO_URI, JWT_SECRET, EMAIL credentials
# Frontend: .env with VITE_API_URL

# Start development
cd backend && npm run dev     # Port 5000
cd frontend && npm run dev    # Port 3000
```

### Testing:
- Manual testing: Login → Checkout → Return → View History
- Browser DevTools: Check Network tab for API calls
- Firebase Console: Verify data in Firestore
- Email: Check test email in Gmail

### Code Quality:
- Input validation on backend
- Error handling (try-catch)
- Proper HTTP status codes
- Clear error messages

---

## 💡 Unique Features

1. **Session Tracking**
   - Records every login
   - Tracks IP, browser, platform
   - Remember Me functionality
   - Can implement "logout from all devices"

2. **Readable Document IDs**
   - No random garbage characters
   - IDs follow: TYPE-date-details
   - Easy to identify in Firebase console

3. **Beautiful Email Templates**
   - Gradient backgrounds
   - Color-coded by status
   - Clear call-to-action
   - Mobile-responsive

4. **Browser Password Manager**
   - Native integration (no plugin needed)
   - Works with Chrome, Firefox, Safari, Edge
   - Auto-fills on return visit
   - Secure (browser manages encryption)

5. **Complete Audit Trail**
   - Who checked out what
   - When they checked out
   - When they returned
   - Who approved/rejected requests

---

## 📈 Future Enhancements

- [ ] WhatsApp notifications (Twilio - ready to enable)
- [ ] SMS alerts
- [ ] Component damage/loss tracking
- [ ] Reservation system (book in advance)
- [ ] Component deprecation tracking
- [ ] User activity dashboard
- [ ] Bulk import/export
- [ ] QR codes for components
- [ ] Mobile app (React Native)

---

## ✅ Project Completion Status

### Completed ✅
- Full-stack application working
- Email notifications sent
- Browser password manager integrated
- Session tracking enabled
- Readable Firebase document IDs
- Component quantity system
- Image upload feature
- Complete audit history
- Role-based access control
- Invite-based registration
- Password reset functionality

### Quality Assurance ✅
- All APIs tested
- Error handling implemented
- Security implemented (JWT, bcrypt)
- Database optimized
- No test data (cleaned up)

---

## 🎓 Technologies Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, Vite, Tailwind CSS, Axios |
| **Backend** | Node.js, Express, Bcryptjs, JWT |
| **Database** | Firebase Firestore |
| **Email** | Nodemailer (Gmail SMTP) |
| **Authentication** | JWT + Session tracking |
| **File Storage** | Express static + Multer |
| **Hosting** | Vercel (frontend), Cloud (backend), Firebase (DB) |
| **Region** | asia-south1 (Mumbai, India) |

---

## 🎯 Quick Demo Script (for Presentation)

1. **Login** - Show email/username login works
2. **Dashboard** - Show overview stats
3. **Components** - Browse available components
4. **Checkout** - Checkout a component
5. **History** - Show audit log
6. **Profile** - Show user info
7. **Firebase Console** - Show readable document IDs
8. **Email** - Show email notification sent

---

**Project Name**: Challengers Component Tracker
**Status**: ✅ Production Ready
**Last Updated**: December 11, 2025
**Region**: asia-south1 (Mumbai, India)
