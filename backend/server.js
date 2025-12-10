require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./config/firebase');
const { startCronJobs } = require('./jobs/scheduler');

// Initialize express
const app = express();

// Firebase is already initialized in config/firebase.js
console.log('🔥 Using Firebase Firestore');

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/components', require('./routes/component.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/requests', require('./routes/request.routes'));

// Seed endpoint (for development only)
app.post('/api/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Seeding not allowed in production' });
  }
  
  try {
    const User = require('./models/User');
    const Component = require('./models/Component');
    
    // Clear existing data
    await User.deleteMany({});
    await Component.deleteMany({});
    
    // Create users
    await User.create([
      { username: 'admin', password: 'admin123', name: 'Admin User', email: 'admin@challengers.com', phone: '+919876543210', role: 'admin' },
      { username: 'member1', password: 'member123', name: 'John Doe', email: 'john@challengers.com', phone: '+919876543211', role: 'member' },
      { username: 'member2', password: 'member123', name: 'Jane Smith', email: 'jane@challengers.com', phone: '+919876543212', role: 'member' },
    ]);
    
    // Create components
    await Component.create([
      { componentId: 'ARD-UNO-001', name: 'Arduino Uno', category: 'Arduino', status: 'available', description: 'Main microcontroller board' },
      { componentId: 'SENS-DHT-001', name: 'DHT11 Temperature Sensor', category: 'Sensor', status: 'available', description: 'Digital humidity and temperature sensor' },
      { componentId: 'MOT-SERVO-001', name: 'SG90 Servo Motor', category: 'Motor', status: 'available', description: '9g micro servo motor' },
      { componentId: 'DISP-LCD-001', name: '16x2 LCD Display', category: 'Display', status: 'available', description: 'Alphanumeric LCD with I2C module' },
      { componentId: 'SENS-ULTRA-001', name: 'HC-SR04 Ultrasonic', category: 'Sensor', status: 'available', description: 'Distance measuring sensor' },
      { componentId: 'TOOL-MULTI-001', name: 'Digital Multimeter', category: 'Tool', status: 'available', description: 'For testing circuits' },
      { componentId: 'ARD-NANO-001', name: 'Arduino Nano', category: 'Arduino', status: 'available', description: 'Compact microcontroller board' },
      { componentId: 'SENS-IR-001', name: 'IR Sensor Module', category: 'Sensor', status: 'available', description: 'Infrared obstacle detection' },
      { componentId: 'CABLE-USB-001', name: 'USB Cable Type-B', category: 'Cable', status: 'available', description: 'For Arduino Uno programming' },
      { componentId: 'MOT-DC-001', name: 'DC Gear Motor', category: 'Motor', status: 'available', description: '12V DC motor with gearbox' },
    ]);
    
    res.json({ message: 'Database seeded successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Seed failed', error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Challengers Component Tracker API' });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start cron jobs
if (process.env.NODE_ENV !== 'test') {
  startCronJobs();
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Listening on all network interfaces (0.0.0.0)`);
});

module.exports = app;
