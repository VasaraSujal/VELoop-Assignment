import mongoose from 'mongoose';

const { Schema } = mongoose;

const giveawaySchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    prizeId: {
      type: Schema.Types.ObjectId,
      ref: 'Prize',
      required: true,
    },
    entryFee: {
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
    },
    status: {
      type: String,
      enum: ['DRAFT', 'UPCOMING', 'ACTIVE', 'ENDED', 'COMPLETED', 'ARCHIVED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    winnerCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    eligibility: {
      minTier: { type: Number, default: 0 },
      requiresKyc: { type: Boolean, default: false },
      description: { type: String, default: '' },
    },
    terms: {
      type: String,
      default: '',
    },
    claimType: {
      type: String,
      enum: ['PHYSICAL_DELIVERY', 'GIFT_CARD_CODE', 'DIGITAL_CREDIT'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Giveaway = mongoose.model('Giveaway', giveawaySchema);
export default Giveaway;
