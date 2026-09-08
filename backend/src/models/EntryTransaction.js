import mongoose from 'mongoose';

const { Schema } = mongoose;

const entryTransactionSchema = new Schema(
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
    participationId: {
      type: Schema.Types.ObjectId,
      ref: 'GiveawayParticipation',
    },
    currency: {
      type: String,
      enum: ['VEs', 'SVEs', 'Tokens'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'SUCCESS',
      index: true,
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
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

export const EntryTransaction = mongoose.model('EntryTransaction', entryTransactionSchema);
export default EntryTransaction;
