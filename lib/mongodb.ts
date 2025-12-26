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
const cached: MongooseCache = globalThis._mongoose ?? {
  conn: null,
  promise: null,
};

if (!globalThis._mongoose) {
  globalThis._mongoose = cached;
}

/**
 * Singleton connection helper
 */
export async function connectToDatabase(): Promise<Mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI environment variable is not defined.");
  }

  // ✅ Already connected
  if (cached.conn) {
    console.log("✅ MongoDB already connected");
    return cached.conn;
  }

  // ⏳ Connecting for the first time
  if (!cached.promise) {
    console.log("⏳ Connecting to MongoDB...");

    const opts: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("🚀 MongoDB connected successfully");
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed:", err);
        throw err;
      });
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
