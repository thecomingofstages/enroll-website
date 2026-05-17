// app/database/init.js
const mongoose = require('mongoose');

async function connectDatabase() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('❌ CRITICAL: MONGO_URI is not defined in your .env file!');
    process.exit(1);
  }

  try {
    // Attempt connection
    await mongoose.connect(mongoURI);
    console.log('✅ Successfully connected to MongoDB Cluster.');

    // Optional: Setup event listeners for ongoing connection health
    mongoose.connection.on('error', (err) => {
      console.error(`⚠️ MongoDB connection error post-boot: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB during bootstrap:', error.message);
    // Exit the process because your API routes won't work without a DB connection
    process.exit(1); 
  }
}

module.exports = { connectDatabase };