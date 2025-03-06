import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

// console.log("Current Working Directory:", process.cwd());
// console.log("MONGODB_URI:", process.env.MONGODB_URI);


const MONGODB_URI = process.env.MONGODB_URI;
// console.log(MONGODB_URI);


let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
    console.log("Connected....")
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
