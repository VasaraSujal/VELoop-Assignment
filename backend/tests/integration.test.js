import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import app from '../src/app.js';
import UserAccount from '../src/models/UserAccount.js';
import Giveaway from '../src/models/Giveaway.js';
import Prize from '../src/models/Prize.js';
import GiveawayParticipation from '../src/models/GiveawayParticipation.js';
import EntryTransaction from '../src/models/EntryTransaction.js';
import AuditLog from '../src/models/AuditLog.js';
import { AuthService } from '../src/services/authService.js';
import { WalletService } from '../src/services/walletService.js';
import { GiveawayEngine } from '../src/services/giveawayEngine.js';

describe('VELOOP Rewards - Backend Integration & Security Tests', () => {
  let activeGiveaway = null;
  let upcomingGiveaway = null;
  let endedGiveaway = null;
  let alexUser = null;
  let priyaUser = null;
  let rahulUser = null;
  let server = null;
  let baseUrl = '';

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    // Start ephemeral HTTP server for route-level integration and security tests
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api`;

    // Ensure test state is fresh
    await GiveawayParticipation.deleteMany({});
    await EntryTransaction.deleteMany({});
    await AuditLog.deleteMany({});
    await UserAccount.deleteMany({ userId: { $in: ['user_broke_vip', 'user_ratelimit_test'] } });

    // Reset user balances
    await UserAccount.updateOne(
      { userId: 'user_alex' },
      { $set: { balances: { VEs: 1500, SVEs: 1000, Tokens: 5000 }, tier: 2, isKycVerified: true } }
    );
    await UserAccount.updateOne(
      { userId: 'user_priya' },
      { $set: { balances: { VEs: 5000, SVEs: 1000, Tokens: 2500 }, tier: 1, isKycVerified: true } }
    );
    await UserAccount.updateOne(
      { userId: 'user_rahul' },
      { $set: { balances: { VEs: 50, SVEs: 0, Tokens: 200 }, tier: 0, isKycVerified: false } }
    );

    alexUser = await UserAccount.findOne({ userId: 'user_alex' }).lean();
    priyaUser = await UserAccount.findOne({ userId: 'user_priya' }).lean();
    rahulUser = await UserAccount.findOne({ userId: 'user_rahul' }).lean();

    activeGiveaway = await Giveaway.findOne({ slug: 'iphone-15-pro' }).populate('prizeId');
    upcomingGiveaway = await Giveaway.findOne({ slug: 'macbook-pro-m3' }).populate('prizeId');
    endedGiveaway = await Giveaway.findOne({ slug: 'iphone-15-pro-august' }).populate('prizeId');
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  describe('1. Authoritative Balances & Wallet Operations', () => {
    test('Retrieves authoritative balances from UserAccount model', async () => {
      const balances = await WalletService.getBalances(alexUser.userId);
      assert.equal(balances.VEs, 1500);
      assert.equal(balances.SVEs, 1000);
      assert.equal(balances.Tokens, 5000);
    });

    test('Identifies sufficient and insufficient balances accurately', async () => {
      const sufficient = await WalletService.checkBalance(alexUser.userId, 'VEs', 250);
      assert.equal(sufficient.sufficient, true);

      const insufficient = await WalletService.checkBalance(rahulUser.userId, 'VEs', 250);
      assert.equal(insufficient.sufficient, false);
      assert.equal(insufficient.missingAmount, 200);
    });
  });

  describe('2. Normal Join Flow & Financial Deductions', () => {
    test('Authenticated user with sufficient balance joins successfully', async () => {
      const initialBalances = await WalletService.getBalances(alexUser.userId);
      const initialParticipantCount = activeGiveaway.participantCount;

      const result = await GiveawayEngine.processEntry({
        user: alexUser,
        giveawayIdentifier: activeGiveaway.slug,
        req: { ip: '127.0.0.1' },
      });

      assert.ok(result.participationId);
      assert.ok(result.transactionRef.startsWith('TX-VL-'));
      assert.equal(result.entryAmount, activeGiveaway.entryFee.amount);
      assert.equal(result.entryCurrency, activeGiveaway.entryFee.currency);
      assert.equal(result.remainingBalance, initialBalances.VEs - activeGiveaway.entryFee.amount);

      // Verify DB records
      const participation = await GiveawayParticipation.findById(result.participationId);
      assert.ok(participation);
      assert.equal(participation.userId, alexUser.userId);
      assert.equal(participation.status, 'CONFIRMED');

      const transaction = await EntryTransaction.findOne({ transactionRef: result.transactionRef });
      assert.ok(transaction);
      assert.equal(transaction.amount, 250);
      assert.equal(transaction.status, 'SUCCESS');

      const audit = await AuditLog.findOne({ entityId: result.participationId.toString() });
      assert.ok(audit);
      assert.equal(audit.action, 'GIVEAWAY_ENTRY');

      // Verify participant count increment
      const updatedGw = await Giveaway.findById(activeGiveaway._id);
      assert.equal(updatedGw.participantCount, initialParticipantCount + 1);
    });
  });

  describe('3. Duplicate & Concurrency Protections', () => {
    test('Same user attempting to join twice throws ALREADY_PARTICIPATING', async () => {
      await assert.rejects(
        async () => {
          await GiveawayEngine.processEntry({
            user: alexUser,
            giveawayIdentifier: activeGiveaway.slug,
            req: { ip: '127.0.0.1' },
          });
        },
        (err) => {
          assert.equal(err.code, 'ALREADY_PARTICIPATING');
          return true;
        }
      );
    });

    test('Concurrent join requests allow only 1 deduction and 1 participation', async () => {
      const watchGiveaway = await Giveaway.findOne({ slug: 'apple-watch-series-9' }).populate('prizeId');
      // Clean participation for watchGiveaway if any
      await GiveawayParticipation.deleteMany({ userId: priyaUser.userId, giveawayId: watchGiveaway._id });
      await UserAccount.updateOne({ userId: priyaUser.userId }, { $set: { 'balances.VEs': 5000 } });
      const initialBalances = await WalletService.getBalances(priyaUser.userId);

      // Attempt 5 simultaneous join requests
      const promises = [1, 2, 3, 4, 5].map(() =>
        GiveawayEngine.processEntry({
          user: priyaUser,
          giveawayIdentifier: watchGiveaway.slug,
          req: { ip: '127.0.0.1' },
        })
          .then((res) => ({ success: true, res }))
          .catch((err) => ({ success: false, code: err.code, message: err.message }))
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => r.success);
      const duplicates = results.filter((r) => r.code === 'ALREADY_PARTICIPATING');

      assert.equal(successes.length, 1, 'Exactly one concurrent request must succeed');
      assert.equal(duplicates.length, 4, 'Remaining 4 concurrent requests must fail with ALREADY_PARTICIPATING');

      // Check that balance was deducted exactly once (200 VEs)
      const finalBalances = await WalletService.getBalances(priyaUser.userId);
      assert.equal(
        finalBalances.VEs,
        initialBalances.VEs - watchGiveaway.entryFee.amount,
        'Balance must be deducted exactly once'
      );

      // Check that exactly one participation record exists in DB
      const participations = await GiveawayParticipation.find({
        userId: priyaUser.userId,
        giveawayId: watchGiveaway._id,
      });
      assert.equal(participations.length, 1);
    });

    test('Idempotent retry with same idempotencyKey returns existing successful entry', async () => {
      const idempotencyKey = 'idem-test-key-12345';
      const tokenGiveaway = await Giveaway.findOne({ slug: 'amazon-voucher-20' }).populate('prizeId');

      const firstAttempt = await GiveawayEngine.processEntry({
        user: alexUser,
        giveawayIdentifier: tokenGiveaway.slug,
        idempotencyKey,
        req: { ip: '127.0.0.1' },
      });

      assert.equal(firstAttempt.isIdempotentReplay, false);

      const secondAttempt = await GiveawayEngine.processEntry({
        user: alexUser,
        giveawayIdentifier: tokenGiveaway.slug,
        idempotencyKey,
        req: { ip: '127.0.0.1' },
      });

      assert.equal(secondAttempt.isIdempotentReplay, true);
      assert.equal(secondAttempt.transactionRef, firstAttempt.transactionRef);
      assert.equal(secondAttempt.participationId.toString(), firstAttempt.participationId.toString());
    });
  });

  describe('4. Insufficient Balances & Different Currencies', () => {
    test('User with insufficient VEs is rejected with INSUFFICIENT_VES_BALANCE', async () => {
      await assert.rejects(
        async () => {
          await GiveawayEngine.processEntry({
            user: rahulUser,
            giveawayIdentifier: 'amazon-voucher-500', // Requires 300 VEs, Rahul has 50 VEs (Tier 0 eligible)
            req: { ip: '127.0.0.1' },
          });
        },
        (err) => {
          assert.equal(err.code, 'INSUFFICIENT_VES_BALANCE');
          return true;
        }
      );
    });

    test('User with insufficient SVEs is rejected with INSUFFICIENT_SVES_BALANCE', async () => {
      await UserAccount.deleteOne({ userId: 'user_broke_vip' });
      const brokeVipDoc = await UserAccount.create({
        userId: 'user_broke_vip',
        email: 'broke_vip@veloop.io',
        handle: 'broke_vip',
        name: 'Broke VIP',
        tier: 2,
        isKycVerified: true,
        balances: { VEs: 100, SVEs: 0, Tokens: 100 },
        status: 'ACTIVE',
      });

      const brokeVipUser = brokeVipDoc.toObject();

      await assert.rejects(
        async () => {
          await GiveawayEngine.processEntry({
            user: brokeVipUser,
            giveawayIdentifier: 'airpods-pro', // Requires 500 SVEs, Broke VIP has 0 SVEs
            req: { ip: '127.0.0.1' },
          });
        },
        (err) => {
          assert.equal(err.code, 'INSUFFICIENT_SVES_BALANCE');
          return true;
        }
      );
    });

    test('User with insufficient Tokens is rejected with INSUFFICIENT_TOKENS_BALANCE', async () => {
      const tokenGiveaway = await Giveaway.findOne({ slug: 'amazon-voucher-20' }).populate('prizeId');
      assert.ok(tokenGiveaway, 'Token giveaway amazon-voucher-20 must exist');

      // Ensure fresh state for Rahul
      await GiveawayParticipation.deleteMany({ userId: rahulUser.userId, giveawayId: tokenGiveaway._id });
      await EntryTransaction.deleteMany({ userId: rahulUser.userId, giveawayId: tokenGiveaway._id });
      await UserAccount.updateOne({ userId: rahulUser.userId }, { $set: { 'balances.Tokens': 200 } });

      const initialBalances = await WalletService.getBalances(rahulUser.userId);
      assert.ok(
        initialBalances.Tokens < tokenGiveaway.entryFee.amount,
        `Rahul Tokens (${initialBalances.Tokens}) must be less than required fee (${tokenGiveaway.entryFee.amount})`
      );

      await assert.rejects(
        async () => {
          await GiveawayEngine.processEntry({
            user: rahulUser,
            giveawayIdentifier: tokenGiveaway.slug,
            req: { ip: '127.0.0.1' },
          });
        },
        (err) => {
          assert.equal(err.code, 'INSUFFICIENT_TOKENS_BALANCE');
          return true;
        }
      );

      // Assert Tokens balance is unchanged
      const finalBalances = await WalletService.getBalances(rahulUser.userId);
      assert.equal(finalBalances.Tokens, initialBalances.Tokens, 'Tokens balance must remain unchanged');

      // Assert no participation or entry transaction is created
      const participations = await GiveawayParticipation.find({
        userId: rahulUser.userId,
        giveawayId: tokenGiveaway._id,
      });
      assert.equal(participations.length, 0, 'No participation record must be created');

      const transactions = await EntryTransaction.find({
        userId: rahulUser.userId,
        giveawayId: tokenGiveaway._id,
      });
      assert.equal(transactions.length, 0, 'No entry transaction must be created');
    });
  });

  describe('5. Giveaway Lifecycle State Enforcement', () => {
    test('Cannot join an UPCOMING giveaway', async () => {
      await assert.rejects(
        async () => {
          await GiveawayEngine.processEntry({
            user: alexUser,
            giveawayIdentifier: upcomingGiveaway.slug,
            req: { ip: '127.0.0.1' },
          });
        },
        (err) => {
          assert.equal(err.code, 'GIVEAWAY_NOT_ACTIVE');
          return true;
        }
      );
    });

    test('Cannot join an ENDED/COMPLETED giveaway', async () => {
      await assert.rejects(
        async () => {
          await GiveawayEngine.processEntry({
            user: alexUser,
            giveawayIdentifier: endedGiveaway.slug,
            req: { ip: '127.0.0.1' },
          });
        },
        (err) => {
          assert.equal(err.code, 'GIVEAWAY_ENDED');
          return true;
        }
      );
    });
  });

  describe('6. Security & Parameter Tampering Protection', () => {
    test('Unauthenticated user cannot enter', async () => {
      await assert.rejects(
        async () => {
          await GiveawayEngine.processEntry({
            user: null,
            giveawayIdentifier: activeGiveaway.slug,
            req: { ip: '127.0.0.1' },
          });
        },
        (err) => {
          assert.equal(err.code, 'LOGIN_REQUIRED');
          return true;
        }
      );
    });

    test('AuthService signs and verifies JWT tokens securely', async () => {
      const token = AuthService.generateToken(alexUser);
      assert.ok(typeof token === 'string');

      const user = await AuthService.getUserById(alexUser.userId);
      assert.ok(user);
      assert.equal(user.userId, alexUser.userId);
    });
  });

  describe('7. HTTP API Route & Parameter Tampering Security', () => {
    test('HTTP Route: User ID tampering is blocked and uses authenticated JWT identity', async () => {
      const voucherGiveaway = await Giveaway.findOne({ slug: 'amazon-voucher-500' }).populate('prizeId');
      assert.ok(voucherGiveaway);

      // Ensure clean state for this giveaway
      await GiveawayParticipation.deleteMany({
        giveawayId: voucherGiveaway._id,
        userId: { $in: ['user_alex', 'user_priya'] },
      });
      await EntryTransaction.deleteMany({
        giveawayId: voucherGiveaway._id,
        userId: { $in: ['user_alex', 'user_priya'] },
      });
      await UserAccount.updateOne({ userId: 'user_alex' }, { $set: { 'balances.VEs': 1500 } });
      await UserAccount.updateOne({ userId: 'user_priya' }, { $set: { 'balances.VEs': 5000 } });

      const alexInitial = (await WalletService.getBalances('user_alex')).VEs;
      const priyaInitial = (await WalletService.getBalances('user_priya')).VEs;
      const alexToken = AuthService.generateToken(alexUser);

      // Authenticate as User A (Alex), send forged userId for User B (Priya) in body
      const res = await fetch(`${baseUrl}/giveaways/${voucherGiveaway.slug}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          userId: 'user_priya', // Forged User ID attempt
          giveawayId: voucherGiveaway.slug,
        }),
      });

      const json = await res.json();
      assert.equal(res.status, 200);
      assert.equal(json.success, true);

      // 1. Assert the participation is associated with User A from JWT identity
      const participation = await GiveawayParticipation.findById(json.data.participationId);
      assert.ok(participation);
      assert.equal(participation.userId, 'user_alex', 'Participation must be recorded for authenticated user (Alex)');

      const priyaParticipation = await GiveawayParticipation.findOne({
        giveawayId: voucherGiveaway._id,
        userId: 'user_priya',
      });
      assert.equal(priyaParticipation, null, 'No participation must be recorded for User B (Priya)');

      // 2. Assert User B (Priya) is not charged
      const priyaFinal = (await WalletService.getBalances('user_priya')).VEs;
      assert.equal(priyaFinal, priyaInitial, 'User B (Priya) balance must be completely unchanged');

      // 3. Assert User A (Alex) is charged the authoritative entry fee
      const alexFinal = (await WalletService.getBalances('user_alex')).VEs;
      assert.equal(alexFinal, alexInitial - voucherGiveaway.entryFee.amount, 'User A (Alex) must be charged');
    });

    test('HTTP Route: Amount tampering is discarded in favor of database fee', async () => {
      const watchGiveaway = await Giveaway.findOne({ slug: 'apple-watch-series-9' }).populate('prizeId');
      assert.ok(watchGiveaway);

      // Ensure clean state for Priya on watch giveaway
      await GiveawayParticipation.deleteMany({
        giveawayId: watchGiveaway._id,
        userId: 'user_priya',
      });
      await EntryTransaction.deleteMany({
        giveawayId: watchGiveaway._id,
        userId: 'user_priya',
      });
      await UserAccount.updateOne({ userId: 'user_priya' }, { $set: { 'balances.VEs': 5000 } });

      const priyaInitial = (await WalletService.getBalances('user_priya')).VEs;
      const priyaToken = AuthService.generateToken(priyaUser);
      const forgedAmount = 1; // Attempt to pay 1 VE instead of 200 VEs

      const res = await fetch(`${baseUrl}/giveaways/${watchGiveaway.slug}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${priyaToken}`,
        },
        body: JSON.stringify({
          amount: forgedAmount,
        }),
      });

      const json = await res.json();
      assert.equal(res.status, 200);
      assert.equal(json.success, true);

      // Assert the backend uses the authoritative Giveaway.entryFee.amount
      assert.equal(
        json.data.entryAmount,
        watchGiveaway.entryFee.amount,
        `Backend must use authoritative DB fee (${watchGiveaway.entryFee.amount})`
      );
      assert.notEqual(json.data.entryAmount, forgedAmount, 'Backend must discard forged amount');

      // Assert the actual deduction/transaction amount equals the database value
      const priyaFinal = (await WalletService.getBalances('user_priya')).VEs;
      assert.equal(
        priyaFinal,
        priyaInitial - watchGiveaway.entryFee.amount,
        'Deduction must equal authoritative DB fee amount (200 VEs)'
      );

      const tx = await EntryTransaction.findOne({ transactionRef: json.data.transactionRef });
      assert.ok(tx);
      assert.equal(tx.amount, watchGiveaway.entryFee.amount, 'Transaction amount must match DB fee (200)');
    });

    test('HTTP Route: Currency tampering is discarded in favor of database currency', async () => {
      const airpodsGiveaway = await Giveaway.findOne({ slug: 'airpods-pro' }).populate('prizeId');
      assert.ok(airpodsGiveaway);
      assert.equal(airpodsGiveaway.entryFee.currency, 'SVEs');

      // Clean state for Alex (Tier 2 user eligible for airpods-pro)
      await GiveawayParticipation.deleteMany({
        giveawayId: airpodsGiveaway._id,
        userId: 'user_alex',
      });
      await EntryTransaction.deleteMany({
        giveawayId: airpodsGiveaway._id,
        userId: 'user_alex',
      });
      await UserAccount.updateOne(
        { userId: 'user_alex' },
        { $set: { 'balances.VEs': 1500, 'balances.SVEs': 1000, tier: 2, isKycVerified: true } }
      );

      const alexInitial = await WalletService.getBalances('user_alex');
      const alexToken = AuthService.generateToken(alexUser);

      // Attempt to forge currency as 'VEs' instead of 'SVEs'
      const res = await fetch(`${baseUrl}/giveaways/${airpodsGiveaway.slug}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          currency: 'VEs',
        }),
      });

      const json = await res.json();
      assert.equal(res.status, 200);
      assert.equal(json.success, true);

      // Assert backend uses Giveaway.entryFee.currency
      assert.equal(
        json.data.entryCurrency,
        airpodsGiveaway.entryFee.currency,
        'Backend must use authoritative DB currency (SVEs)'
      );
      assert.notEqual(json.data.entryCurrency, 'VEs', 'Backend must discard forged currency');

      // Assert correct authoritative balance is deducted (SVEs deducted, VEs untouched)
      const alexFinal = await WalletService.getBalances('user_alex');
      assert.equal(
        alexFinal.SVEs,
        alexInitial.SVEs - airpodsGiveaway.entryFee.amount,
        'Authoritative SVEs balance must be deducted by 500'
      );
      assert.equal(
        alexFinal.VEs,
        alexInitial.VEs,
        'VEs balance must remain completely unaffected by currency tampering'
      );

      const tx = await EntryTransaction.findOne({ transactionRef: json.data.transactionRef });
      assert.ok(tx);
      assert.equal(tx.currency, 'SVEs');
    });

    test('HTTP Route: Prize ID tampering is discarded in favor of authoritative prize relation', async () => {
      const watchGiveaway = await Giveaway.findOne({ slug: 'apple-watch-series-9' }).populate('prizeId');
      assert.ok(watchGiveaway);

      // Clean state for Alex
      await GiveawayParticipation.deleteMany({
        giveawayId: watchGiveaway._id,
        userId: 'user_alex',
      });
      await EntryTransaction.deleteMany({
        giveawayId: watchGiveaway._id,
        userId: 'user_alex',
      });
      await UserAccount.updateOne({ userId: 'user_alex' }, { $set: { 'balances.VEs': 1500 } });

      const alexToken = AuthService.generateToken(alexUser);
      const forgedPrizeId = new mongoose.Types.ObjectId().toString();

      const res = await fetch(`${baseUrl}/giveaways/${watchGiveaway.slug}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          prizeId: forgedPrizeId,
        }),
      });

      const json = await res.json();
      assert.equal(res.status, 200);
      assert.equal(json.success, true);

      // Assert backend uses the giveaway's authoritative prizeId
      const participation = await GiveawayParticipation.findById(json.data.participationId);
      assert.ok(participation);
      assert.equal(
        participation.prizeId.toString(),
        watchGiveaway.prizeId._id.toString(),
        'Participation must reference authoritative prize ID from giveaway'
      );
      assert.notEqual(
        participation.prizeId.toString(),
        forgedPrizeId,
        'Participation must not reference forged prizeId'
      );

      assert.equal(json.data.prizeName, watchGiveaway.prizeId.name);
    });

    test('HTTP Route: Rate-limit exhaustion rejects excessive join attempts with HTTP 429', async () => {
      const rateLimitUserDoc = await UserAccount.findOneAndUpdate(
        { userId: 'user_ratelimit_test' },
        {
          userId: 'user_ratelimit_test',
          email: 'ratelimit@veloop.io',
          handle: 'ratelimit_tester',
          name: 'Rate Limit Tester',
          tier: 2,
          isKycVerified: true,
          balances: { VEs: 50000, SVEs: 10000, Tokens: 50000 },
          status: 'ACTIVE',
        },
        { upsert: true, new: true }
      );
      const rateLimitUser = rateLimitUserDoc.toObject();
      const rateLimitToken = AuthService.generateToken(rateLimitUser);

      // Fire 12 sequential HTTP POST requests to the actual join route (configured limit: max 10/min)
      const responses = [];
      for (let i = 0; i < 12; i++) {
        const res = await fetch(`${baseUrl}/giveaways/iphone-15-pro/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${rateLimitToken}`,
          },
          body: JSON.stringify({ deviceHash: `test-device-${i}` }),
        });
        const data = await res.json();
        responses.push({ status: res.status, data });
      }

      // Assert the 11th and 12th requests exceed the rate limit and return HTTP 429 RATE_LIMITED
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      assert.ok(
        rateLimitedResponses.length >= 2,
        `Expected at least 2 rate-limited responses, got ${rateLimitedResponses.length}`
      );

      assert.equal(responses[10].status, 429, '11th request must be HTTP 429');
      assert.equal(responses[10].data.code, 'RATE_LIMITED', '11th response code must be RATE_LIMITED');
      assert.equal(responses[10].data.success, false);

      assert.equal(responses[11].status, 429, '12th request must be HTTP 429');
      assert.equal(responses[11].data.code, 'RATE_LIMITED', '12th response code must be RATE_LIMITED');
      assert.equal(responses[11].data.success, false);
    });
  });
});

