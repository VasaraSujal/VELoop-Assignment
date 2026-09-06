import mongoose from 'mongoose';

const { Schema } = mongoose;

const giveawayParticipationSchema = new Schema(
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
    entryCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'REFUNDED'],
      default: 'CONFIRMED',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per user per giveaway if single entry rule applies
giveawayParticipationSchema.index({ giveawayId: 1, userId: 1 });

export const GiveawayParticipation = mongoose.model('GiveawayParticipation', giveawayParticipationSchema);
export default GiveawayParticipation;
