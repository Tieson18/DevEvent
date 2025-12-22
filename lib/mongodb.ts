import mongoose, { Mongoose } from 'mongoose';

/**
 * Shape of the cached connection object stored on the global scope.
 * This avoids creating multiple connections in development when Next.js
 * hot-reloads or re-imports modules.
 */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Augment the NodeJS global type to include our cached mongoose connection.
 * We use `var` on `global` so that TypeScript understands this property
 * can exist on `globalThis` at runtime.
 */
declare global {
  // `var` is required here to correctly merge with the global scope.
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

// Initialize the global cache if it doesn't exist yet.
const cached: MongooseCache = global._mongoose ?? {
  conn: null,
  promise: null,
};

if (!global._mongoose) {
  global._mongoose = cached;
}

/**
 * Get the MongoDB connection string from environment variables.
 *
 * This should be defined in your environment (e.g. `.env.local`) as:
 *   MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"
 */
const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Fail fast in production if the connection string is missing.
  throw new Error('MONGODB_URI environment variable is not defined');
}

/**
 * Establishes (or reuses) a singleton Mongoose connection.
 *
 * In development, Next.js reloads modules frequently. Without caching,
 * each reload would create a new database connection, quickly exhausting
 * connection limits. By caching the connection and the in-flight promise
 * on `globalThis`, we ensure only one connection is created per server
 * instance.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // If we already have an active connection, reuse it.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection promise is already in progress, await it.
  if (!cached.promise) {
    // Configure Mongoose options here if needed (e.g. timeouts, debug, etc.).
    const opts: Parameters<typeof mongoose.connect>[1] = {
      // Example options (uncomment / adjust as needed):
      // autoIndex: false,
      // maxPoolSize: 10,
    };

    // Start a new connection and store the pending promise in the cache.
    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // If connection fails, reset the promise so future calls can retry.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
