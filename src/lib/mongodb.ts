import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    let uri = MONGODB_URI;

    // メモリデータベースを使用する場合（テスト環境のみ）
    if (USE_MEMORY_DB && process.env.NODE_ENV === 'test') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      console.log('Using in-memory MongoDB for testing...');
      const mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      console.log('Memory MongoDB started at:', uri);
    }

    if (!uri) {
      throw new Error('MongoDB URI is not defined. Please set MONGODB_URI in your .env.local file');
    }

    // Phase 3: MongoDB Connection Pool Optimization
    const opts = {
      bufferCommands: false,
      maxPoolSize: 20, // 増加: より多くの同時接続をサポート
      minPoolSize: 2,  // 最小接続数を維持
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000, // アイドル接続の最大時間
      // Performance optimizations
      retryWrites: true,
      retryReads: true,
      readPreference: 'secondaryPreferred' as const, // 読み取り性能向上
      // Compression for better network performance
      compressors: ['snappy', 'zlib'] as ('none' | 'snappy' | 'zlib' | 'zstd')[],
    };

    console.log('Attempting to connect to MongoDB...');
    console.log('URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[password]@')); // パスワードを隠す

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose.connection;
      })
      .catch((error) => {
        console.error(
          'MongoDB connection error:',
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('MongoDB connection failed:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

// connectDB という名前でもエクスポート（互換性のため）
export { dbConnect as connectDB };
