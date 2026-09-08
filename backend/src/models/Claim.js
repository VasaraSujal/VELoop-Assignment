import mongoose from 'mongoose';

const { Schema } = mongoose;

const claimSchema = new Schema(
  {
    giveawayId: {
      type: Schema.Types.ObjectId,
      ref: 'Giveaway',
      required: true,
      index: true,
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref: 'Winner',
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    claimType: {
      type: String,
      enum: ['PHYSICAL_DELIVERY', 'GIFT_CARD_CODE', 'DIGITAL_CREDIT'],
      required: true,
    },
    claimData: {
      fullName: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      addressLine1: { type: String, trim: true },
      addressLine2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      voucherDeliveryEmail: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'REJECTED'],
      default: 'PENDING_REVIEW',
      index: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
      default: '',
    },
    courier: {
      type: String,
      trim: true,
      default: '',
    },
    giftCardCode: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique claim per user per giveaway and unique winner claim assignment
claimSchema.index({ giveawayId: 1, userId: 1 }, { unique: true });
claimSchema.index({ winnerId: 1 }, { unique: true });

export const Claim = mongoose.model('Claim', claimSchema);
export default Claim;
