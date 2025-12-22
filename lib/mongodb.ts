import mongoose, { Mongoose } from "mongoose";

/**
 * Cached mongoose connection type
 */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Extend globalThis safely (TS + Next.js friendly)
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

/**
 * Use globalThis instead of global (safer + modern)
 */
const cached: MongooseCache =
  globalThis._mongoose ?? { conn: null, promise: null };

if (!globalThis._mongoose) {
  globalThis._mongoose = cached;
}

/**
 * MongoDB connection string
 * Fail fast at module load if missing
 */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

// Assign to a new const so TS knows it's a string (no squiggles)
const uri: string = MONGODB_URI;

/**
 * Singleton connection helper
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // Return cached connection if exists
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is already in progress, wait for it
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(uri, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next call
    throw err;
  }

  return cached.conn;
}

export default connectToDatabase;
