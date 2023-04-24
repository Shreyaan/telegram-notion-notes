/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose, { type Document, type Model, type Schema } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

interface User extends Document {
  telegramId: string;
  token?: string;
  isPremium: boolean;
  numberOfUses: number;
  name?: string;
  created_at: Date;
  updated_at?: Date;
}

const UserSchema: Schema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: false,
    unique: false,
  },
  isPremium: {
    type: Boolean,
    required: true,
    default: false,
  },
  numberOfUses: {
    type: Number,
    required: true,
    default: 0,
  },
  name: {
    type: String,
    required: false,
    unique: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
});

const UserModel: Model<User> = mongoose.models.User || mongoose.model<User>('User', UserSchema);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
    };

    if(MONGODB_URI)
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { access_token, name, telegramId } = req.body;

  try {
    const user: User | null = await UserModel.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.token = access_token as string;
    user.name = name as string;
    user.updated_at = new Date();

    await user.save();

    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}