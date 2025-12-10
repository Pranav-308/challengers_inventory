<<<<<<< HEAD
# Challenegers
hardware componets management in challengers
=======
# Component Tracker - Challengers Team

A full-stack web application for managing component checkouts within the Challengers team. Track who borrowed what, when, and get notified via email and WhatsApp.

## Features

- 🔐 Simple login system for team members
- 📦 Track component availability (Available/Taken/Overdue)
- 📝 Complete checkout/return history for each component
- 👤 View items borrowed by each member
- 📧 Email notifications for checkouts, returns, and overdue items
- 
- ⏰ Automatic overdue detection with daily reminders
- 📊 Minimal dashboard for quick overview

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Expres
- **Database**: Firebase
- **Notifications**: Nodemailer (email) 
- **Hosting**: Vercel

## Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Gmail account (for email notifications)
- Twilio account (for WhatsApp notifications)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev  # Starts on port 5000
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if backend is not on localhost:5000
npm run dev  # Starts on port 3000
```

### Seed Database (Optional)

```bash
cd backend
npm run seed  # Creates sample users and components
```

## Environment Variables

### Backend (.env)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_USER`, `EMAIL_PASSWORD`: Gmail credentials
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`: Twilio credentials

### Frontend (.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)

## Project Structure

```
/backend
  /config       - Database connection
  /models       - Mongoose schemas
  /routes       - API endpoints
  /controllers  - Business logic
  /middleware   - Auth & validation
  /services     - Email & WhatsApp services
  /jobs         - Cron jobs for overdue checks
  
/frontend
  /src
    /components - Reusable UI components
    /pages      - Dashboard, Login, etc.
    /context    - Auth context
    /services   - API client
```

## Default Login Credentials (after seeding)

- **Admin**: username: `admin`, password: `admin123`
- **Member**: username: `member1`, password: `member123`

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/components` - List all components
- `POST /api/components/:id/checkout` - Checkout component
- `POST /api/components/:id/return` - Return component
- `GET /api/components/:id/history` - Component history
- `GET /api/users/:id/borrowed` - User's borrowed items
- `GET /api/dashboard/stats` - Dashboard statistics

## Deployment

Deploy to Vercel with the included `vercel.json` configuration:

```bash
vercel --prod
```

## License

MIT
>>>>>>> e593772 (Initial commit)
