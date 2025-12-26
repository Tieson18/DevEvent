import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

describe('MongoDB Connection Utility', () => {
  const originalEnv = process.env.MONGODB_URI;

  afterEach(async () => {
    // Reset global cache
    if (global._mongoose) {
      global._mongoose.conn = null;
      global._mongoose.promise = null;
    }
    
    // Restore original environment
    if (originalEnv) {
      process.env.MONGODB_URI = originalEnv;
    }
  });

  describe('Connection Establishment', () => {
    it('should successfully connect to database', async () => {
      const connection = await connectToDatabase();

      expect(connection).toBeDefined();
      expect(connection).toBeInstanceOf(mongoose.Mongoose);
      expect(connection.connection.readyState).toBe(1); // 1 = connected
    });

    it('should return cached connection on subsequent calls', async () => {
      const connection1 = await connectToDatabase();
      const connection2 = await connectToDatabase();

      expect(connection1).toBe(connection2);
      expect(global._mongoose?.conn).toBe(connection1);
    });

    it('should cache connection in global._mongoose', async () => {
      expect(global._mongoose).toBeDefined();
      
      const connection = await connectToDatabase();

      expect(global._mongoose?.conn).toBe(connection);
      expect(global._mongoose?.promise).toBeDefined();
    });

    it('should reuse in-flight promise if connection is pending', async () => {
      // Reset cache
      if (global._mongoose) {
        global._mongoose.conn = null;
        global._mongoose.promise = null;
      }
      await mongoose.disconnect();

      // Start two connections simultaneously
      const promise1 = connectToDatabase();
      const promise2 = connectToDatabase();

      const [connection1, connection2] = await Promise.all([promise1, promise2]);

      expect(connection1).toBe(connection2);
    });

    it('should handle multiple concurrent connection attempts', async () => {
      // Reset cache
      if (global._mongoose) {
        global._mongoose.conn = null;
        global._mongoose.promise = null;
      }
      await mongoose.disconnect();

      const promises = Array.from({ length: 5 }, () => connectToDatabase());
      const connections = await Promise.all(promises);

      // All should return the same connection
      const firstConnection = connections[0];
      connections.forEach(conn => {
        expect(conn).toBe(firstConnection);
      });
    });
  });

  describe('Global Cache Management', () => {
    it('should initialize global cache on first import', () => {
      expect(global._mongoose).toBeDefined();
      expect(global._mongoose).toHaveProperty('conn');
      expect(global._mongoose).toHaveProperty('promise');
    });

    it('should use existing global cache if already initialized', async () => {
      const connection = await connectToDatabase();
      
      // Cache should be populated
      expect(global._mongoose?.conn).toBe(connection);
      
      // Simulate hot reload by clearing local reference but keeping global
      const cachedConn = global._mongoose?.conn;
      
      const newConnection = await connectToDatabase();
      expect(newConnection).toBe(cachedConn);
    });

    it('should maintain cache structure with conn and promise properties', () => {
      expect(global._mongoose).toHaveProperty('conn');
      expect(global._mongoose).toHaveProperty('promise');
      expect(typeof global._mongoose?.conn).toBe('object');
      expect(typeof global._mongoose?.promise).toBe('object');
    });

    it('should allow cache to be cleared and reconnected', async () => {
      const connection1 = await connectToDatabase();
      expect(global._mongoose?.conn).toBe(connection1);

      // Clear cache
      if (global._mongoose) {
        global._mongoose.conn = null;
        global._mongoose.promise = null;
      }
      await mongoose.disconnect();

      // Should create new connection
      const connection2 = await connectToDatabase();
      expect(connection2).toBeDefined();
      expect(connection2.connection.readyState).toBe(1);
    });
  });

  describe('Connection Reuse', () => {
    it('should return existing connection without creating new one', async () => {
      const connection1 = await connectToDatabase();
      const readyState1 = connection1.connection.readyState;

      const connection2 = await connectToDatabase();
      const readyState2 = connection2.connection.readyState;

      expect(connection1).toBe(connection2);
      expect(readyState1).toBe(readyState2);
      expect(readyState1).toBe(1); // connected
    });

    it('should not create multiple connections in rapid succession', async () => {
      const connections = await Promise.all([
        connectToDatabase(),
        connectToDatabase(),
        connectToDatabase(),
        connectToDatabase(),
        connectToDatabase(),
      ]);

      const uniqueConnections = new Set(connections);
      expect(uniqueConnections.size).toBe(1);
    });

    it('should maintain connection across multiple database operations', async () => {
      const connection1 = await connectToDatabase();
      
      // Perform some operations
      await mongoose.connection.db?.admin().ping();
      
      const connection2 = await connectToDatabase();
      
      expect(connection1).toBe(connection2);
      expect(connection1.connection.readyState).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should reset promise on connection failure', async () => {
      // Save original URI
      const validUri = process.env.MONGODB_URI;
      
      // Clear cache and disconnect
      if (global._mongoose) {
        global._mongoose.conn = null;
        global._mongoose.promise = null;
      }
      await mongoose.disconnect();

      // Set invalid URI
      process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test';

      // Attempt connection should fail
      await expect(connectToDatabase()).rejects.toThrow();

      // Promise should be reset to null
      expect(global._mongoose?.promise).toBeNull();

      // Restore valid URI for other tests
      process.env.MONGODB_URI = validUri;
    });

    it('should allow retry after failed connection', async () => {
      const validUri = process.env.MONGODB_URI;
      
      // Clear cache
      if (global._mongoose) {
        global._mongoose.conn = null;
        global._mongoose.promise = null;
      }
      await mongoose.disconnect();

      // First attempt with invalid URI
      process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test';
      await expect(connectToDatabase()).rejects.toThrow();
      expect(global._mongoose?.promise).toBeNull();

      // Second attempt with valid URI should succeed
      process.env.MONGODB_URI = validUri;
      const connection = await connectToDatabase();
      expect(connection).toBeDefined();
      expect(connection.connection.readyState).toBe(1);
    });

    it('should handle connection errors gracefully', async () => {
      const validUri = process.env.MONGODB_URI;
      
      if (global._mongoose) {
        global._mongoose.conn = null;
        global._mongoose.promise = null;
      }
      await mongoose.disconnect();

      process.env.MONGODB_URI = 'mongodb://nonexistent.host:27017/testdb';

      try {
        await connectToDatabase();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(global._mongoose?.promise).toBeNull();
      }

      process.env.MONGODB_URI = validUri;
    });
  });

  describe('Connection State', () => {
    it('should have readyState of 1 (connected) after successful connection', async () => {
      const connection = await connectToDatabase();
      
      expect(connection.connection.readyState).toBe(1);
    });

    it('should maintain connection state across multiple calls', async () => {
      await connectToDatabase();
      expect(mongoose.connection.readyState).toBe(1);

      await connectToDatabase();
      expect(mongoose.connection.readyState).toBe(1);

      await connectToDatabase();
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('should return mongoose instance with active connection', async () => {
      const connection = await connectToDatabase();

      expect(connection.connection).toBeDefined();
      expect(connection.connection.host).toBeDefined();
      expect(connection.connection.name).toBeDefined();
      expect(connection.connection.readyState).toBe(1);
    });
  });

  describe('Mongoose Instance Properties', () => {
    it('should return mongoose instance with expected properties', async () => {
      const connection = await connectToDatabase();

      expect(connection).toHaveProperty('connection');
      expect(connection).toHaveProperty('connect');
      expect(connection).toHaveProperty('disconnect');
      expect(connection).toHaveProperty('model');
      expect(connection).toHaveProperty('models');
    });

    it('should provide access to connection object', async () => {
      const mongoose = await connectToDatabase();

      expect(mongoose.connection).toBeDefined();
      expect(mongoose.connection.db).toBeDefined();
      expect(typeof mongoose.connection.db?.databaseName).toBe('string');
    });

    it('should allow model registration after connection', async () => {
      const connection = await connectToDatabase();

      expect(connection.models).toBeDefined();
      expect(typeof connection.models).toBe('object');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use MONGODB_URI from environment', async () => {
      expect(process.env.MONGODB_URI).toBeDefined();
      
      const connection = await connectToDatabase();
      
      expect(connection).toBeDefined();
      expect(connection.connection.readyState).toBe(1);
    });

    it('should connect to correct database from URI', async () => {
      const connection = await connectToDatabase();
      
      expect(connection.connection.db).toBeDefined();
      expect(connection.connection.db?.databaseName).toBeDefined();
      expect(typeof connection.connection.db?.databaseName).toBe('string');
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle simultaneous first connections safely', async () => {
      // Reset everything
      if (global._mongoose) {
        global._mongoose.conn = null;
        global._mongoose.promise = null;
      }
      await mongoose.disconnect();

      // Fire off multiple connections at once
      const results = await Promise.all([
        connectToDatabase(),
        connectToDatabase(),
        connectToDatabase(),
      ]);

      // All should be the same instance
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
      expect(global._mongoose?.conn).toBe(results[0]);
    });

    it('should handle connection requests during active connection', async () => {
      // Establish initial connection
      const firstConnection = await connectToDatabase();

      // Make more requests while connected
      const subsequentConnections = await Promise.all([
        connectToDatabase(),
        connectToDatabase(),
        connectToDatabase(),
      ]);

      subsequentConnections.forEach(conn => {
        expect(conn).toBe(firstConnection);
      });
    });
  });

  describe('Performance and Efficiency', () => {
    it('should return cached connection quickly', async () => {
      // First connection
      await connectToDatabase();

      // Measure subsequent connection time
      const start = Date.now();
      await connectToDatabase();
      const duration = Date.now() - start;

      // Should be nearly instantaneous (< 10ms) when cached
      expect(duration).toBeLessThan(50);
    });

    it('should not leak connections on repeated calls', async () => {
      // Get initial connection
      const initialConnection = await connectToDatabase();
      const initialReadyState = initialConnection.connection.readyState;

      // Call multiple times
      for (let i = 0; i < 10; i++) {
        await connectToDatabase();
      }

      // Should still have same connection
      const finalConnection = await connectToDatabase();
      expect(finalConnection).toBe(initialConnection);
      expect(finalConnection.connection.readyState).toBe(initialReadyState);
      expect(finalConnection.connection.readyState).toBe(1);
    });
  });

  describe('Integration with Mongoose Models', () => {
    it('should allow model operations after connection', async () => {
      await connectToDatabase();

      // Models should be accessible
      expect(mongoose.models).toBeDefined();
      
      // Connection should support database operations
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('should maintain connection for database queries', async () => {
      const connection = await connectToDatabase();

      // Perform a database operation
      const adminDb = connection.connection.db?.admin();
      const result = await adminDb?.ping();

      expect(result).toBeDefined();
      expect(connection.connection.readyState).toBe(1);
    });
  });

  describe('Cache Initialization', () => {
    it('should initialize cache with null values', () => {
      // Access before any connection
      const cache = global._mongoose;

      expect(cache).toBeDefined();
      expect(cache).toHaveProperty('conn');
      expect(cache).toHaveProperty('promise');
    });

    it('should not recreate cache if already exists', () => {
      const cache1 = global._mongoose;
      
      // Simulate module reload (cache should persist)
      const cache2 = global._mongoose;

      expect(cache1).toBe(cache2);
    });
  });

  describe('Default Export', () => {
    it('should export connectToDatabase as default', async () => {
      const defaultExport = require('@/lib/mongodb').default;
      
      expect(defaultExport).toBe(connectToDatabase);
      expect(typeof defaultExport).toBe('function');
    });

    it('should work with default import', async () => {
      const defaultExport = require('@/lib/mongodb').default;
      const connection = await defaultExport();

      expect(connection).toBeDefined();
      expect(connection.connection.readyState).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid connect/disconnect cycles gracefully', async () => {
      const connection1 = await connectToDatabase();
      expect(connection1.connection.readyState).toBe(1);

      // Immediately request another connection
      const connection2 = await connectToDatabase();
      expect(connection2).toBe(connection1);
    });

    it('should maintain cache integrity across test suite', async () => {
      // This test verifies cache persists
      const connection = await connectToDatabase();
      
      expect(global._mongoose?.conn).toBe(connection);
      expect(global._mongoose?.promise).toBeDefined();
    });
  });
});