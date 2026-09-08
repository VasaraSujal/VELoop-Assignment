import mongoose from 'mongoose';

const { Schema } = mongoose;

const winnerSchema = new Schema(
  {
    giveawayId: {
      type: Schema.Types.ObjectId,
      ref: 'Giveaway',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userHandle: {
      type: String,
      default: '',
      trim: true,
    },
    maskedUserId: {
      type: String,
      default: '',
      trim: true,
    },
    maskedPhone: {
      type: String,
      default: '',
      trim: true,
    },
    prizeId: {
      type: Schema.Types.ObjectId,
      ref: 'Prize',
      required: true,
    },
    prizeName: {
      type: String,
      default: '',
      trim: true,
    },
    rank: {
      type: Number,
      default: 1,
      min: 1,
    },
    drawnAt: {
      type: Date,
      default: Date.now,
    },
    claimStatus: {
      type: String,
      enum: ['UNCLAIMED', 'CLAIMED', 'FULFILLED', 'EXPIRED'],
      default: 'UNCLAIMED',
      index: true,
    },
    statusLabel: {
      type: String,
      default: 'Delivered & Verified',
      trim: true,
    },
    entryFeePaid: {
      type: String,
      default: '',
      trim: true,
    },
    txHash: {
      type: String,
      default: '',
      trim: true,
    },
    isRecent: {
      type: Boolean,
      default: true,
      index: true,
    },
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Winner = mongoose.model('Winner', winnerSchema);
export default Winner;
