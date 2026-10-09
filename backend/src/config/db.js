const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined. Check the backend .env file.');
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    const safeError = error.message.replace(/mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb+srv://***:***@');
    console.error(`MongoDB Connection Error: ${safeError}`);
  }
};

module.exports = connectDB;
