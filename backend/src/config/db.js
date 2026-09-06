import mongoose from 'mongoose';
import { config } from './env.js';

let isDbConfigured = Boolean(config.mongoUri);

/**
 * Maps Mongoose readyState integer to human-readable status string
 */
export const getDbStatus = () => {
  if (!isDbConfigured) {
    return 'not_connected';
  }
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'not_connected';
  }
};

/**
 * Initializes Mongoose connection asynchronously.
 * Does not block application bootstrap or throw if MongoDB is unavailable in Phase 0.
 */
export const connectDB = () => {
  if (!config.mongoUri) {
    console.info('[Database] No MONGO_URI provided. Running in offline/disconnected database mode.');
    return;
  }

  // Setup connection event listeners
  mongoose.connection.on('connected', () => {
    console.log('[Database] MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    console.warn(`[Database] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected.');
  });

  // Connect with a reasonable serverSelectionTimeoutMS so offline fallback is clean
  mongoose
    .connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
    })
    .catch((error) => {
      console.warn(`[Database] MongoDB offline or unreachable (${error.message}). Continuing in offline mode.`);
    });
};
