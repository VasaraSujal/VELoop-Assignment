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
    },
    prizeId: {
      type: Schema.Types.ObjectId,
      ref: 'Prize',
      required: true,
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
