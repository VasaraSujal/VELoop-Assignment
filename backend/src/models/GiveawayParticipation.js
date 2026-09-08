import mongoose from 'mongoose';

const { Schema } = mongoose;

const giveawayParticipationSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    giveawayId: {
      type: Schema.Types.ObjectId,
      ref: 'Giveaway',
      required: true,
      index: true,
    },
    prizeId: {
      type: Schema.Types.ObjectId,
      ref: 'Prize',
      required: true,
    },
    entryCurrency: {
      type: String,
      enum: ['VEs', 'SVEs', 'Tokens'],
      required: true,
    },
    entryAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deviceHash: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'REFUNDED'],
      default: 'CONFIRMED',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'EntryTransaction',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single entry rule strictly at the database level
giveawayParticipationSchema.index({ userId: 1, giveawayId: 1 }, { unique: true });

export const GiveawayParticipation = mongoose.model(
  'GiveawayParticipation',
  giveawayParticipationSchema
);
export default GiveawayParticipation;
