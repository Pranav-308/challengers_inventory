# Email Reminder System

## Automatic Reminders Schedule

### ✅ When Component is Checked Out
- **Immediate confirmation email** with:
  - Component name and due date
  - Reminder schedule information
  - Guidelines for timely return

### ⏰ 1 Day Before Due Date (Due Tomorrow)
**Subject:** `⏰ REMINDER: [Component] Due Tomorrow!`
- Friendly reminder that component is due in 24 hours
- Tips for returning on time
- Option to request extension from admin
- Sent at 9:00 AM and 6:00 PM

### 📅 On Due Date
**Subject:** `⏰ REMINDER: [Component] Due Tomorrow!`
- Same as above but indicates it's the last day
- Encourages return by end of day

### 🚨 After Due Date (Overdue)
**Subject:** `🚨 URGENT: [Component] is X day(s) OVERDUE`
- **URGENT** priority email
- Shows number of days overdue
- Red alert styling
- Sent **DAILY** until component is returned
- Reminds user others may need the component

## Email Sending Schedule

### Automatic Checks:
- **9:00 AM** - Morning reminder check
- **6:00 PM** - Evening reminder check
- **Every Hour** - Retry failed notifications
- **On Startup** - Immediate check when server starts

## Email Features

### Professional Design:
✅ Gradient headers with color coding
✅ Clear component information
✅ Visual emphasis on due dates
✅ Actionable tips and reminders
✅ Mobile-responsive layout

### Color Coding:
- 🟢 **Green** - Return confirmation
- 🔵 **Blue/Purple** - Checkout confirmation
- 🟡 **Yellow/Orange** - Due soon warning
- 🔴 **Red** - Overdue alert

### Information Included:
- Component name and ID
- Due date with full formatting
- Days overdue (if applicable)
- Borrower name
- Quick action tips

## Testing Reminders

### To test manually:
1. Checkout a component with short duration (1 day)
2. Wait for automated checks (9 AM or 6 PM)
3. Or run manual check: `node backend/jobs/scheduler.js`

### Manual trigger from backend:
```javascript
const { checkOverdueComponents } = require('./jobs/scheduler');
checkOverdueComponents();
```

## Configuration

### Email Settings (backend/.env):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=pranavpavan308@gmail.com
EMAIL_PASSWORD=wnnkpvqwbcbgeuzu
EMAIL_FROM=Challengers Team <pranavpavan308@gmail.com>
```

### Notification Preferences:
- Users can enable/disable email notifications in Profile settings
- Default: Email enabled
- Admins receive all component request notifications

## Database Tracking

All email notifications are logged in Firestore:
- **Collection:** `notificationLogs`
- **Fields:** userId, componentId, type, channel, status, sentAt, attempts
- **Retry Logic:** Failed emails retry every hour (max 3 attempts)

## Best Practices

1. **Timely Returns:** Members receive 3 reminders before overdue
2. **Clear Communication:** Emails are clear and actionable
3. **No Spam:** Only relevant emails at appropriate times
4. **Professional:** Well-designed emails reflect team professionalism
5. **Trackable:** All notifications logged for audit trail
