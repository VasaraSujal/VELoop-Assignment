import mongoose from 'mongoose';

const { Schema } = mongoose;

const fraudEventSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    giveawayId: {
      type: Schema.Types.ObjectId,
      ref: 'Giveaway',
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    actionTaken: {
      type: String,
      enum: ['FLAGGED', 'BLOCKED', 'IGNORED', 'REVIEW_REQUIRED'],
      default: 'FLAGGED',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const FraudEvent = mongoose.model('FraudEvent', fraudEventSchema);
export default FraudEvent;
