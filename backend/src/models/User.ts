import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: false,
    unique: true,
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
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
});

export default mongoose.model("User", UserSchema);
