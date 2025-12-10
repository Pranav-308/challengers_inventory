# 🚀 Quick Start Guide - Challengers Component Tracker

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js 18+** (https://nodejs.org/)
- **MongoDB** (https://www.mongodb.com/try/download/community) OR MongoDB Atlas account
- **Git** (https://git-scm.com/)

## Step 1: Clone & Setup

```powershell
# Navigate to project directory
cd d:\Challengers

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..\frontend
npm install
```

## Step 2: Configure Environment Variables

### Backend Configuration

1. Copy the environment template:
```powershell
cd d:\Challengers\backend
copy .env.example .env
```

2. Edit `backend\.env` with your credentials:

```env
# Database (Local MongoDB)
MONGO_URI=mongodb://localhost:27017/challengers

# OR use MongoDB Atlas (recommended for production)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/challengers

# Server
PORT=5000
NODE_ENV=development

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_12345

# Email (Gmail Configuration)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Challengers Team <noreply@challengers.com>

# WhatsApp (Twilio - Get free account at twilio.com)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

1. Copy the environment template:
```powershell
cd d:\Challengers\frontend
copy .env.example .env
```

2. Edit `frontend\.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

## Step 3: Set Up Email Notifications (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
   - Use this as `EMAIL_PASSWORD` in `.env`

## Step 4: Set Up WhatsApp Notifications (Twilio)

1. **Create Twilio Account**: https://www.twilio.com/try-twilio (Free trial)
2. **Get WhatsApp Sandbox**:
   - Go to Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join the sandbox
3. **Copy Credentials**:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
   - WhatsApp number → `TWILIO_WHATSAPP_NUMBER`

## Step 5: Start MongoDB

### Option A: Local MongoDB
```powershell
# Start MongoDB service (Windows)
net start MongoDB

# Or use MongoDB Compass GUI
```

### Option B: MongoDB Atlas (Cloud)
- Create free cluster at https://www.mongodb.com/atlas
- Get connection string and update `MONGO_URI` in `.env`

## Step 6: Seed Database with Sample Data

```powershell
cd d:\Challengers\backend
npm run seed
```

This creates:
- 3 users (1 admin, 2 members)
- 10 sample components

## Step 7: Start the Application

### Terminal 1 - Start Backend:
```powershell
cd d:\Challengers\backend
npm run dev
```
✅ Backend runs on http://localhost:5000

### Terminal 2 - Start Frontend:
```powershell
cd d:\Challengers\frontend
npm run dev
```
✅ Frontend runs on http://localhost:3000

## Step 8: Login & Test

Open http://localhost:3000 in your browser.

**Demo Credentials:**
- **Admin**: `admin` / `admin123`
- **Member**: `member1` / `member123`

## 🎉 You're All Set!

### What to Try:
1. ✅ Browse components
2. ✅ Checkout a component (you'll receive email + WhatsApp)
3. ✅ View your borrowed items
4. ✅ Return a component
5. ✅ Check component history
6. ✅ Update notification preferences in Profile

## Troubleshooting

### MongoDB Connection Error
```
❌ Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix**: Start MongoDB service or use MongoDB Atlas

### Email Sending Failed
```
❌ Invalid login: 535-5.7.8 Username and Password not accepted
```
**Fix**: Use Gmail App Password (not regular password)

### WhatsApp Not Sending
```
❌ Twilio error 21608
```
**Fix**: Join Twilio WhatsApp sandbox first

### Port Already in Use
```
❌ Error: listen EADDRINUSE: address already in use :::5000
```
**Fix**: 
```powershell
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Production Deployment (Vercel)

1. **Install Vercel CLI**:
```powershell
npm install -g vercel
```

2. **Deploy**:
```powershell
cd d:\Challengers
vercel --prod
```

3. **Set Environment Variables** in Vercel dashboard

## Support

Need help? Check:
- README.md for detailed documentation
- .github/copilot-instructions.md for development guidelines
- Backend logs in terminal for errors

Happy coding! 🚀
