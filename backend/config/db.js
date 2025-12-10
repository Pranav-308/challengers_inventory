const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    // Check if we should use in-memory MongoDB (for development without local MongoDB)
    if (process.env.USE_MEMORY_DB === 'true') {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`✅ MongoDB In-Memory Server Connected: ${conn.connection.host}`);
      return;
    }

    // Otherwise use the configured MongoDB URI with a short timeout
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Error: ${error.message}`);
    
    // Fallback to in-memory if connection fails
    console.log('⚠️  Falling back to in-memory MongoDB...');
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`✅ MongoDB In-Memory Server Connected: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`❌ Fallback failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
