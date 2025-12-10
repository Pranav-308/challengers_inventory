# Component Tracker - Challengers Team

## Project Overview
Full-stack component management system for tracking hardware/equipment checkout within the Challengers team. Members can borrow components, track availability, and view complete audit history.

## Architecture

### Tech Stack
- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (flexible document structure for component history)
- **Hosting**: Vercel (unified full-stack deployment)
- **Auth**: Simple session-based authentication
- **Notifications**: Nodemailer (email) + Twilio WhatsApp API (WhatsApp messages)

### Project Structure
```
/frontend          # React app with Tailwind
  /src
    /components    # Reusable UI components
    /pages         # Dashboard, Login, ComponentList, History, Profile
    /services      # API client for backend calls
    /context       # Auth context for user session
/backend           # Express API server
  /models          # Mongoose schemas (User, Component, CheckoutHistory, NotificationLog)
  /routes          # API endpoints
  /controllers     # Business logic handlers
  /middleware      # Auth verification
  /services        # Email & WhatsApp notification services
  /jobs            # Cron jobs for overdue checks
  /config          # DB connection, environment variables
```

## Core Data Models

### Component Schema
```javascript
{
  componentId: String (unique),
  name: String,
  category: String,
  status: 'available' | 'taken' | 'overdue',
  currentBorrower: ObjectId (ref: User) | null,
  checkedOutAt: Date | null,
  dueDate: Date | null,
  checkoutDuration: Number (days, default: 7),
  description: String,
  imageUrl: String (optional)
}
```

### CheckoutHistory Schema
```javascript
{
  componentId: ObjectId (ref: Component),
  userId: ObjectId (ref: User),
  action: 'checkout' | 'return',
  timestamp: Date,
  notes: String (optional)
}
```

### User Schema
```javascript
{
  username: String (unique),
  password: String (hashed),
  name: String,
  email: String (required for notifications),
  phone: String (required for WhatsApp, format: +91XXXXXXXXXX),
  role: 'member' | 'admin',
  notificationPreferences: {
    email: Boolean (default: true),
    whatsapp: Boolean (default: true)
  }
}
```

## Key Features & Implementation Notes

### 1. Component Status Tracking
- Real-time status updates using MongoDB transactions
- Atomic operations when checking out/returning components
- Status badge colors: Green (available), Red (taken), Yellow (maintenance)

### 2. Checkout/Return Flow
**Checkout**: Update component status → Create history record → Update user's borrowed items
**Return**: Verify borrower → Update status to available → Log return timestamp

### 3. History View
- Aggregate pipeline to fetch component history with user details
- Sort by timestamp descending (most recent first)
- Include duration calculation: `returnTimestamp - checkoutTimestamp`

### 4. Member Dashboard
- Show personal borrowed items with overdue warnings
- Quick search/filter components by name, category, status
- Admin view: All active checkouts + statistics

### 5. Authentication
- Login endpoint returns JWT or session cookie
- Middleware validates token on protected routes
- Store user info in React Context for frontend state

### 6. Notification System
**Email Notifications** (via Nodemailer):
- Component checked out → Email to borrower with details
- Component returned → Confirmation email
- Overdue reminders → Daily emails after 7 days
- Admin alerts → When component marked as taken

**WhatsApp Notifications** (via Twilio API):
- Same triggers as email but via WhatsApp message
- Template format: "Hi {name}, you checked out {component} on {date}. Due date: {dueDate}"
- Overdue: "Reminder: {component} is overdue by {days} days"
- Return confirmation: "{component} returned successfully"

**Implementation**:
- Queue system for notifications (avoid blocking requests)
- Store notification logs in `NotificationLog` collection
- Retry failed notifications (max 3 attempts)
- User can toggle email/WhatsApp in profile settings

### 7. Due Date Management
- Default checkout duration: 7 days (configurable per component category)
- Auto-calculate due date on checkout: `checkoutDate + 7 days`
- Daily cron job checks for overdue items
- Grace period: 1 day before marking as overdue
- Send reminder notifications: Day before due, on due date, every day after

## Development Workflow

### Setup Commands
```bash
# Backend setup
cd backend
npm install
cp .env.example .env  # Configure MONGO_URI, PORT, JWT_SECRET
npm run dev           # Starts on port 5000

# Frontend setup
cd frontend
npm install
npm run dev           # Starts on port 3000
```

### Environment Variables
**Backend (.env)**:
```
MONGO_URI=mongodb://localhost:27017/challengers
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=development

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=challengers.team@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Challengers Team <noreply@challengers.com>

# WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints Convention

### Components
- `GET /api/components` - List all components (filter: status, category)
- `GET /api/components/:id` - Component details + current status
- `POST /api/components/:id/checkout` - Checkout component
- `POST /api/components/:id/return` - Return component
- `GET /api/components/:id/history` - Full history for component

### Users
- `POST /api/auth/login` - Login (returns token)
- `GET /api/users/:id/borrowed` - Items currently borrowed by user
- `GET /api/users/:id/history` - Complete borrowing history

### Dashboard
- `GET /api/dashboard/stats` - Overview (total, available, taken, overdue counts)

### Notifications
- `POST /api/notifications/send` - Manual notification trigger (admin)
- `GET /api/notifications/logs/:userId` - User's notification history
- `PATCH /api/users/:id/preferences` - Update notification preferences
- `GET /api/components/overdue` - List overdue components (triggers notifications)

## Code Conventions

### Frontend
- Use React hooks (useState, useEffect, useContext)
- Tailwind utility classes (avoid custom CSS unless necessary)
- Component naming: PascalCase (e.g., `ComponentCard.jsx`)
- API calls in `/services/api.js` using axios/fetch
- Form validation before submission
- Loading states and error handling for all API calls

### Backend
- Route files by resource (components.routes.js, auth.routes.js)
- Controller pattern: routes → controllers → models
- Mongoose models in `/models` with proper validation
- Error handling middleware for consistent error responses
- Use `async/await` with try-catch blocks

### Database Queries
- Use indexes on: `componentId`, `status`, `currentBorrower`
- Populate references for user/component details in history
- Implement pagination for history views (limit: 50 per page)

## Critical Implementation Details

### Preventing Race Conditions
Use MongoDB sessions for checkout transactions:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Update component status
  // Create history record
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

### Timestamp Handling
- Store all timestamps in UTC (MongoDB ISODate)
- Display in user's local timezone on frontend
- Calculate durations server-side for accuracy

### Search & Filter
- Backend: MongoDB text search on component name/description
- Frontend: Debounced search input (300ms delay)
- Filter chips for status, category (multi-select)

## Testing Strategy
- Manual testing focus: Checkout → Return flow
- Test concurrent checkouts (same component, different users)
- Verify history logs accurately on all operations
- Test authentication expiry and protected routes
- Test notification delivery (email and WhatsApp)
- Test overdue detection cron job
- Verify due date calculations for different timezones

## Deployment Notes
- Build frontend: `npm run build` → static files
- Deploy backend and frontend to Vercel as monorepo
- Set environment variables in Vercel dashboard
- Use MongoDB Atlas for production database
- Enable CORS for frontend domain

## Common Gotchas
- Don't forget to validate user owns component before allowing return
- Always update component status AND create history record together
- Clear currentBorrower and dueDate when component is returned (set to null)
- Handle case where user session expires during checkout
- Refresh component list after checkout/return actions
- Ensure phone numbers are in E.164 format (+91XXXXXXXXXX) for WhatsApp
- Don't send notifications synchronously - use background queue
- Test Twilio sandbox mode before production WhatsApp setup
- Gmail requires "App Passwords" for Nodemailer (not regular password)
