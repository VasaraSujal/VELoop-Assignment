import mongoose from 'mongoose';

const { Schema } = mongoose;

const userAccountSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    handle: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: Number,
      default: 0,
      min: 0,
    },
    isKycVerified: {
      type: Boolean,
      default: false,
    },
    balances: {
      VEs: {
        type: Number,
        default: 0,
        min: 0,
      },
      SVEs: {
        type: Number,
        default: 0,
        min: 0,
      },
      Tokens: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const UserAccount = mongoose.model('UserAccount', userAccountSchema);
export default UserAccount;
