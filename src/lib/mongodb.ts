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

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
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
