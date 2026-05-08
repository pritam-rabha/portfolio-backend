import mongoose from 'mongoose';

/**
 * Connect to MongoDB with graceful retry on initial failure.
 * Mongoose handles reconnection automatically after the first
 * successful connection, so we only retry here on startup.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  const options = {
    // Recommended settings for Mongoose 8+
    serverSelectionTimeoutMS: 5000, // fail fast during startup
    socketTimeoutMS: 45_000,
  };

  let attempt = 0;
  const MAX_ATTEMPTS = 5;
  const RETRY_DELAY_MS = 3000;

  while (attempt < MAX_ATTEMPTS) {
    try {
      attempt++;
      const conn = await mongoose.connect(uri, options);
      console.log(`✅  MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.error(`❌  MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) {
        console.log(`    Retrying in ${RETRY_DELAY_MS / 1000}s…`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.error('    Max attempts reached. Exiting.');
        process.exit(1);
      }
    }
  }
};

// Surface connection events after initial connect
mongoose.connection.on('disconnected', () =>
  console.warn('⚠️   MongoDB disconnected. Mongoose will attempt to reconnect…'),
);
mongoose.connection.on('reconnected', () =>
  console.log('✅  MongoDB reconnected.'),
);

export default connectDB;
