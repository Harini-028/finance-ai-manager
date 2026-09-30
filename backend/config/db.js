import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_manager';

  try {
    // First try the configured URI
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Could not connect to ${uri}: ${error.message}`);
    console.log('Starting in-memory MongoDB server...');
    try {
      mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`MongoDB In-Memory Connected: ${conn.connection.host}`);
      console.log('⚠️  Data will not persist after server restart.');
    } catch (memError) {
      console.error(`In-Memory MongoDB Error: ${memError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
