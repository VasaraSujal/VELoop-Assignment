import mongoose from 'mongoose';
import { config } from '../config/env.js';
import Prize from '../models/Prize.js';
import Giveaway from '../models/Giveaway.js';
import Winner from '../models/Winner.js';
import UserAccount from '../models/UserAccount.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import EntryTransaction from '../models/EntryTransaction.js';
import AuditLog from '../models/AuditLog.js';
import FraudEvent from '../models/FraudEvent.js';

export const seedDatabase = async () => {
  console.log(`[Seed] Connecting to MongoDB: ${config.mongoUri}...`);
  await mongoose.connect(config.mongoUri);
  console.log('[Seed] Connected successfully.');

  // Clear existing collections
  console.log('[Seed] Clearing existing giveaway collections...');
  await Promise.all([
    Prize.deleteMany({}),
    Giveaway.deleteMany({}),
    Winner.deleteMany({}),
    UserAccount.deleteMany({}),
    GiveawayParticipation.deleteMany({}),
    EntryTransaction.deleteMany({}),
    AuditLog.deleteMany({}),
    FraudEvent.deleteMany({}),
  ]);

  // 1. Seed Demo User Accounts
  console.log('[Seed] Seeding demo user accounts...');
  const demoUsers = [
    {
      userId: 'user_alex',
      email: 'alex@veloop.io',
      handle: 'alex_vip',
      name: 'Alex Rivera (VIP Tier 2)',
      tier: 2,
      isKycVerified: true,
      balances: {
        VEs: 1500,
        SVEs: 1000,
        Tokens: 5000,
      },
      status: 'ACTIVE',
    },
    {
      userId: 'user_priya',
      email: 'priya@veloop.io',
      handle: 'priya_m',
      name: 'Priya Sharma (Tier 1)',
      tier: 1,
      isKycVerified: true,
      balances: {
        VEs: 350,
        SVEs: 100,
        Tokens: 2500,
      },
      status: 'ACTIVE',
    },
    {
      userId: 'user_rahul',
      email: 'rahul@veloop.io',
      handle: 'rahul_k',
      name: 'Rahul Verma (Tier 0 - Low Balance)',
      tier: 0,
      isKycVerified: false,
      balances: {
        VEs: 50,
        SVEs: 0,
        Tokens: 200,
      },
      status: 'ACTIVE',
    },
  ];
  await UserAccount.insertMany(demoUsers);

  // 2. Seed Official Prizes
  console.log('[Seed] Seeding official prize documents...');
  const prizes = await Prize.insertMany([
    {
      name: 'iPhone 15 Pro - Natural Titanium (128GB)',
      type: 'PHYSICAL',
      retailValueInr: 134900,
      description:
        'Win the revolutionary iPhone 15 Pro featuring an aerospace-grade titanium design, A17 Pro gaming chip, and 48MP Pro camera system.',
      imageUrl: '/assets/prizes/iphone-15-pro.png',
      specifications: {
        Display: '6.1-inch Super Retina XDR with ProMotion',
        Chip: 'A17 Pro chip with 6-core GPU',
        Camera: '48MP Main | Ultra Wide | Telephoto',
        Finish: 'Natural Titanium',
        Storage: '128GB',
        Fulfillment: 'Insured Doorstep Delivery across India',
      },
    },
    {
      name: 'Apple Watch Series 9 (45mm, Midnight Aluminum)',
      type: 'PHYSICAL',
      retailValueInr: 44900,
      description:
        'Smarter, brighter, and mightier. Features Double Tap gesture, S9 SiP chip, and advanced health & workout tracking.',
      imageUrl: '/assets/prizes/apple-watch-s9.png',
      specifications: {
        CaseSize: '45mm Midnight Aluminum',
        Display: 'Always-On Retina up to 2000 nits',
        Sensors: 'Blood Oxygen, ECG, Temperature sensing',
        WaterResistance: '50m swimproof',
        Fulfillment: 'Insured Courier Delivery',
      },
    },
    {
      name: 'AirPods Pro 2nd Gen with MagSafe Case (USB-C)',
      type: 'PHYSICAL',
      retailValueInr: 24900,
      description:
        'Up to 2x more Active Noise Cancellation, Adaptive Audio, and USB-C MagSafe Charging Case with precision finding.',
      imageUrl: '/assets/prizes/airpods-pro.png',
      specifications: {
        Audio: 'H2 Apple Silicon with Adaptive Audio',
        Charging: 'USB-C MagSafe Case with Speaker & Lanyard loop',
        BatteryLife: 'Up to 6 hours listening with ANC enabled',
        Fulfillment: 'Insured Courier Delivery',
      },
    },
    {
      name: '₹2,000 Amazon Pay E-Gift Card',
      type: 'GIFT_CARD',
      retailValueInr: 2000,
      description:
        'Instant shopping freedom. Redeemable for millions of products, bill payments, and subscriptions on Amazon.in.',
      imageUrl: '/assets/prizes/amazon-gift-card-2000.png',
      specifications: {
        Denomination: '₹2,000 INR',
        Validity: '1 Year from date of issuance',
        Delivery: 'Instant digital voucher code in app & email',
      },
    },
    {
      name: '₹500 Amazon Pay E-Gift Card',
      type: 'GIFT_CARD',
      retailValueInr: 500,
      description:
        'Quick shopping voucher for your favorite everyday essentials, books, or streaming subscriptions.',
      imageUrl: '/assets/prizes/amazon-gift-card-500.png',
      specifications: {
        Denomination: '₹500 INR',
        Validity: '1 Year from date of issuance',
        Delivery: 'Instant digital voucher code in app & email',
      },
    },
    {
      name: '₹200 Amazon Pay Voucher',
      type: 'GIFT_CARD',
      retailValueInr: 200,
      description:
        'High-probability reward pool! Spend your daily activity tokens to win instant Amazon vouchers.',
      imageUrl: '/assets/prizes/amazon-gift-card-200.png',
      specifications: {
        Denomination: '₹200 INR',
        Validity: '1 Year from date of issuance',
        Delivery: 'Instant digital voucher code in app & email',
      },
    },
  ]);

  // 3. Seed Giveaways
  console.log('[Seed] Seeding active & historical giveaways...');
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twentyDaysLater = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
  const tenDaysLater = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const pastDateStart = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
  const pastDateEnd = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const upcomingStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEnd = new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000);

  const seededGiveaways = await Giveaway.insertMany([
    {
      slug: 'iphone-15-pro',
      title: 'Apple iPhone 15 Pro (128GB)',
      description:
        'Win the revolutionary iPhone 15 Pro featuring an aerospace-grade titanium design, A17 Pro gaming chip, and 48MP Pro camera system.',
      prizeId: prizes[0]._id,
      entryFee: {
        currency: 'VEs',
        amount: 250,
      },
      status: 'ACTIVE',
      startsAt: pastDateStart,
      endsAt: thirtyDaysLater,
      winnerCount: 1,
      participantCount: 1420,
      isFeatured: true,
      eligibility: {
        minTier: 1,
        requiresKyc: true,
        description: 'Verified VELOOP Tier 1+ accounts',
      },
      terms:
        'Winner selected via provably fair random draw. KYC verification and valid Indian shipping address required for fulfillment.',
      claimType: 'PHYSICAL_DELIVERY',
    },
    {
      slug: 'apple-watch-series-9',
      title: 'Apple Watch Series 9 GPS (45mm)',
      description:
        'Smarter, brighter, and mightier. Features Double Tap gesture, S9 SiP chip, and advanced health & workout tracking.',
      prizeId: prizes[1]._id,
      entryFee: {
        currency: 'VEs',
        amount: 200,
      },
      status: 'ACTIVE',
      startsAt: pastDateStart,
      endsAt: twentyDaysLater,
      winnerCount: 3,
      participantCount: 980,
      isFeatured: false,
      eligibility: {
        minTier: 0,
        requiresKyc: false,
        description: 'All active VELOOP members',
      },
      terms:
        'Total 3 winners will receive one Apple Watch Series 9 each. Standard doorstep delivery applicable across India.',
      claimType: 'PHYSICAL_DELIVERY',
    },
    {
      slug: 'airpods-pro',
      title: 'Apple AirPods Pro (2nd Gen, USB-C)',
      description:
        'Up to 2x more Active Noise Cancellation, Adaptive Audio, and USB-C MagSafe Charging Case with precision finding.',
      prizeId: prizes[2]._id,
      entryFee: {
        currency: 'SVEs',
        amount: 500,
      },
      status: 'ACTIVE',
      startsAt: pastDateStart,
      endsAt: twentyDaysLater,
      winnerCount: 5,
      participantCount: 2150,
      isFeatured: false,
      eligibility: {
        minTier: 2,
        requiresKyc: false,
        description: 'Super-VE (SVE) token holders',
      },
      terms:
        '5 separate winners drawn randomly. Entries deducted in SVEs at time of joining.',
      claimType: 'PHYSICAL_DELIVERY',
    },
    {
      slug: 'amazon-voucher-2000',
      title: '₹2,000 Amazon Pay Gift Card',
      description:
        'Instant shopping freedom. Redeemable for millions of products, bill payments, and subscriptions on Amazon.in.',
      prizeId: prizes[3]._id,
      entryFee: {
        currency: 'VEs',
        amount: 500,
      },
      status: 'ACTIVE',
      startsAt: pastDateStart,
      endsAt: tenDaysLater,
      winnerCount: 1,
      participantCount: 840,
      isFeatured: false,
      eligibility: {
        minTier: 0,
        requiresKyc: false,
        description: 'All active VELOOP members',
      },
      terms:
        'E-voucher code delivered instantly to the registered email address upon verification.',
      claimType: 'GIFT_CARD_CODE',
    },
    {
      slug: 'amazon-voucher-500',
      title: '₹500 Amazon Pay Gift Card',
      description:
        'Quick shopping voucher for your favorite everyday essentials, books, or streaming subscriptions.',
      prizeId: prizes[4]._id,
      entryFee: {
        currency: 'VEs',
        amount: 300,
      },
      status: 'ACTIVE',
      startsAt: pastDateStart,
      endsAt: tenDaysLater,
      winnerCount: 1,
      participantCount: 620,
      isFeatured: false,
      eligibility: {
        minTier: 0,
        requiresKyc: false,
        description: 'All active VELOOP members',
      },
      terms: 'Valid for 1 year from the date of issuance on Amazon.in.',
      claimType: 'GIFT_CARD_CODE',
    },
    {
      slug: 'amazon-voucher-20',
      title: '₹200 Amazon Pay Gift Voucher',
      description:
        'High-probability reward pool! Spend your daily activity tokens to win instant Amazon vouchers.',
      prizeId: prizes[5]._id,
      entryFee: {
        currency: 'Tokens',
        amount: 2000,
      },
      status: 'ACTIVE',
      startsAt: pastDateStart,
      endsAt: tenDaysLater,
      winnerCount: 10,
      participantCount: 4500,
      isFeatured: false,
      eligibility: {
        minTier: 0,
        requiresKyc: false,
        description: 'Open to all token-earning participants',
      },
      terms:
        '10 lucky winners will each receive a ₹200 voucher code directly inside the app.',
      claimType: 'GIFT_CARD_CODE',
    },
    {
      slug: 'macbook-pro-m3',
      title: 'Apple MacBook Pro 14" (M3 Max, 36GB)',
      description:
        'Upcoming high-tier reward pool. Experience extreme performance with Apple M3 Max silicon.',
      prizeId: prizes[0]._id,
      entryFee: {
        currency: 'VEs',
        amount: 1000,
      },
      status: 'UPCOMING',
      startsAt: upcomingStart,
      endsAt: upcomingEnd,
      winnerCount: 1,
      participantCount: 0,
      isFeatured: false,
      eligibility: {
        minTier: 2,
        requiresKyc: true,
        description: 'VELOOP VIP Platinum Tier members',
      },
      terms: 'Pool opens soon. Stay tuned!',
      claimType: 'PHYSICAL_DELIVERY',
    },
    {
      slug: 'iphone-15-pro-august',
      title: 'Apple iPhone 15 Pro (August Pool)',
      description: 'Completed August flagship draw.',
      prizeId: prizes[0]._id,
      entryFee: {
        currency: 'VEs',
        amount: 250,
      },
      status: 'COMPLETED',
      startsAt: pastDateStart,
      endsAt: pastDateEnd,
      winnerCount: 1,
      participantCount: 1250,
      isFeatured: false,
      eligibility: {
        minTier: 1,
        requiresKyc: true,
        description: 'Completed draw',
      },
      terms: 'Draw concluded and verified.',
      claimType: 'PHYSICAL_DELIVERY',
    },
  ]);

  // 4. Seed Winners
  console.log('[Seed] Seeding verified winner records...');
  await Winner.insertMany([
    {
      giveawayId: seededGiveaways[7]._id,
      userId: 'user_sujal',
      userHandle: 'sujal_v',
      maskedUserId: 'su***@gmail.com',
      maskedPhone: '98****4321',
      prizeId: prizes[0]._id,
      prizeName: 'iPhone 15 Pro - Natural Titanium (128GB)',
      rank: 1,
      drawnAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      claimStatus: 'FULFILLED',
      statusLabel: 'Delivered & Verified',
      entryFeePaid: '250 VEs',
      txHash: '0x8f2a...9c14',
      isRecent: true,
    },
    {
      giveawayId: seededGiveaways[1]._id,
      userId: 'user_rohit',
      userHandle: 'rohit_k',
      maskedUserId: 'ro***@yahoo.com',
      maskedPhone: '97****8890',
      prizeId: prizes[1]._id,
      prizeName: 'Apple Watch Series 9 (45mm Midnight)',
      rank: 1,
      drawnAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      claimStatus: 'FULFILLED',
      statusLabel: 'Delivered & Verified',
      entryFeePaid: '200 VEs',
      txHash: '0x4e7b...11a2',
      isRecent: true,
    },
    {
      giveawayId: seededGiveaways[3]._id,
      userId: 'user_ananya',
      userHandle: 'ananya_m',
      maskedUserId: 'an***@outlook.com',
      maskedPhone: '91****5520',
      prizeId: prizes[3]._id,
      prizeName: '₹2,000 Amazon Pay E-Voucher',
      rank: 1,
      drawnAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      claimStatus: 'FULFILLED',
      statusLabel: 'Claimed (E-Code)',
      entryFeePaid: '500 VEs',
      txHash: '0x99c1...33d8',
      isRecent: true,
    },
    {
      giveawayId: seededGiveaways[2]._id,
      userId: 'user_pranav',
      userHandle: 'pranav_t',
      maskedUserId: 'pr***@gmail.com',
      maskedPhone: '99****1204',
      prizeId: prizes[2]._id,
      prizeName: 'AirPods Pro 2nd Gen with MagSafe',
      rank: 1,
      drawnAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      claimStatus: 'FULFILLED',
      statusLabel: 'Delivered & Verified',
      entryFeePaid: '500 SVEs',
      txHash: '0x17fa...cc90',
      isRecent: false,
    },
    {
      giveawayId: seededGiveaways[4]._id,
      userId: 'user_kavita',
      userHandle: 'kavita_s',
      maskedUserId: 'ka***@gmail.com',
      maskedPhone: '88****9912',
      prizeId: prizes[4]._id,
      prizeName: '₹500 Amazon Pay E-Gift Card',
      rank: 1,
      drawnAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      claimStatus: 'FULFILLED',
      statusLabel: 'Claimed (E-Code)',
      entryFeePaid: '300 VEs',
      txHash: '0x33b8...77e1',
      isRecent: false,
    },
  ]);

  console.log('[Seed] Database seeding completed successfully.');
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Done. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}

export default seedDatabase;
