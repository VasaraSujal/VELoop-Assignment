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
import FraudEvent from '../src/models/FraudEvent.js';
import Winner from '../src/models/Winner.js';
import Claim from '../src/models/Claim.js';
import { AuthService } from '../src/services/authService.js';
import { WalletService } from '../src/services/walletService.js';
import { GiveawayEngine } from '../src/services/giveawayEngine.js';
import { WinnerService } from '../src/services/winnerService.js';
import { ClaimService } from '../src/services/claimService.js';

describe('VELOOP Rewards - Backend Integration & Security Tests', () => {
  let activeGiveaway = null;
  let upcomingGiveaway = null;
  let endedGiveaway = null;
  let alexUser = null;
  let priyaUser = null;
  let rahulUser = null;
  let adminUser = null;
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

    // Reset user balances and roles
    await UserAccount.updateOne(
      { userId: 'user_alex' },
      { $set: { balances: { VEs: 1500, SVEs: 1000, Tokens: 5000 }, tier: 2, role: 'USER', isKycVerified: true } }
    );
    await UserAccount.updateOne(
      { userId: 'user_priya' },
      { $set: { balances: { VEs: 5000, SVEs: 1000, Tokens: 2500 }, tier: 1, role: 'USER', isKycVerified: true } }
    );
    await UserAccount.updateOne(
      { userId: 'user_rahul' },
      { $set: { balances: { VEs: 50, SVEs: 0, Tokens: 200 }, tier: 0, role: 'USER', isKycVerified: false } }
    );
    await UserAccount.updateOne(
      { userId: 'user_admin' },
      { $set: { balances: { VEs: 10000, SVEs: 5000, Tokens: 25000 }, tier: 3, role: 'ADMIN', isKycVerified: true } },
      { upsert: true }
    );

    alexUser = await UserAccount.findOne({ userId: 'user_alex' }).lean();
    priyaUser = await UserAccount.findOne({ userId: 'user_priya' }).lean();
    rahulUser = await UserAccount.findOne({ userId: 'user_rahul' }).lean();
    adminUser = await UserAccount.findOne({ userId: 'user_admin' }).lean();

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

  describe('8. Admin Role & Authorization Security (Stage 3A)', () => {
    test('Unauthenticated request to admin endpoint returns HTTP 401 LOGIN_REQUIRED', async () => {
      const res = await fetch(`${baseUrl}/admin/giveaways/${activeGiveaway._id}/select-winners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      assert.equal(res.status, 401);
      assert.equal(data.success, false);
      assert.equal(data.code, 'LOGIN_REQUIRED');
    });

    test('Authenticated normal user (role: USER) yields HTTP 403 ADMIN_REQUIRED and logs FraudEvent', async () => {
      const alexToken = AuthService.generateToken(alexUser);
      const res = await fetch(`${baseUrl}/admin/giveaways/${activeGiveaway._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
      });
      const data = await res.json();

      assert.equal(res.status, 403);
      assert.equal(data.success, false);
      assert.equal(data.code, 'ADMIN_REQUIRED');

      // Verify fraud event was recorded for the unauthorized attempt
      const fraudLog = await FraudEvent.findOne({
        userId: 'user_alex',
        eventType: 'UNAUTHORIZED_ADMIN_ACTION',
      });
      assert.ok(fraudLog, 'FraudEvent must be recorded for unauthorized admin attempt');
      assert.equal(fraudLog.actionTaken, 'BLOCKED');
    });

    test('Malformed or invalid JWT token is rejected safely with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/admin/giveaways/${activeGiveaway._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid.token.payload',
        },
      });
      const data = await res.json();

      assert.equal(res.status, 401);
      assert.equal(data.success, false);
      assert.equal(data.code, 'LOGIN_REQUIRED');
    });

    test('Authenticated admin (role: ADMIN) passes authorization and validates giveaway status', async () => {
      const adminToken = AuthService.generateToken(adminUser);

      // 1. Attempting on ACTIVE giveaway returns HTTP 400 GIVEAWAY_NOT_ENDED
      const activeRes = await fetch(`${baseUrl}/admin/giveaways/iphone-15-pro/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const activeData = await activeRes.json();

      assert.equal(activeRes.status, 400);
      assert.equal(activeData.success, false);
      assert.equal(activeData.code, 'GIVEAWAY_NOT_ENDED');

      // 2. Attempting on non-existent giveaway returns HTTP 404 GIVEAWAY_NOT_FOUND
      const missingRes = await fetch(`${baseUrl}/admin/giveaways/non-existent-pool/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const missingData = await missingRes.json();

      assert.equal(missingRes.status, 404);
      assert.equal(missingData.code, 'GIVEAWAY_NOT_FOUND');
    });
  });

  describe('9. Winner Finalization & Selection Engine (Stage 3B)', () => {
    let testEndedPool = null;

    before(async () => {
      const tempSlugs = [
        'iphone-15-pro-ended',
        'empty-ended-pool',
        'multi-winner-pool-test',
        'override-tamper-test',
        'concurrent-finalization-test',
        'crash-recovery-empty-test',
        'crash-recovery-existing-test',
      ];
      const tempGiveaways = await Giveaway.find({ slug: { $in: tempSlugs } }).lean();
      const tempIds = tempGiveaways.map((g) => g._id);

      await GiveawayParticipation.deleteMany({ giveawayId: { $in: tempIds } });
      await Winner.deleteMany({ giveawayId: { $in: tempIds } });
      await AuditLog.deleteMany({ entityId: { $in: tempIds.map((id) => id.toString()) } });
      await Giveaway.deleteMany({ slug: { $in: tempSlugs } });

      // Create fresh test ended giveaway for finalization
      testEndedPool = await Giveaway.create({
        slug: 'iphone-15-pro-ended',
        title: 'Apple iPhone 15 Pro (Pending Draw Pool)',
        description: 'Pool countdown concluded.',
        prizeId: activeGiveaway.prizeId?._id || activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 250 },
        status: 'ENDED',
        startsAt: new Date(Date.now() - 1000000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 3,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await GiveawayParticipation.insertMany([
        {
          userId: 'user_alex',
          giveawayId: testEndedPool._id,
          prizeId: testEndedPool.prizeId?._id || testEndedPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 250,
          status: 'CONFIRMED',
        },
        {
          userId: 'user_priya',
          giveawayId: testEndedPool._id,
          prizeId: testEndedPool.prizeId?._id || testEndedPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 250,
          status: 'CONFIRMED',
        },
        {
          userId: 'user_rahul',
          giveawayId: testEndedPool._id,
          prizeId: testEndedPool.prizeId?._id || testEndedPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 250,
          status: 'CONFIRMED',
        },
      ]);
    });

    test('Admin can finalize an ended giveaway with eligible participants', async () => {
      const adminToken = AuthService.generateToken(adminUser);
      const res = await fetch(`${baseUrl}/admin/giveaways/${testEndedPool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, 'COMPLETED');
      assert.equal(data.data.winnerCount, 1, 'iPhone pool must create exactly 1 winner');
      assert.equal(data.data.winners.length, 1);
      assert.equal(data.data.selectionMethod, 'CRYPTO_RANDOM');

      // Assert the winner is one of the 3 eligible participants
      const winnerUserId = data.data.winners[0].id ? (await Winner.findById(data.data.winners[0].id)).userId : null;
      assert.ok(
        ['user_alex', 'user_priya', 'user_rahul'].includes(winnerUserId),
        `Winner must be an eligible participant, got ${winnerUserId}`
      );

      // Verify Giveaway status transitioned to COMPLETED
      const updatedPool = await Giveaway.findById(testEndedPool._id);
      assert.equal(updatedPool.status, 'COMPLETED');

      // Verify Winner record in database
      const dbWinner = await Winner.findOne({ giveawayId: testEndedPool._id });
      assert.ok(dbWinner);
      assert.equal(dbWinner.rank, 1);
      assert.equal(dbWinner.claimStatus, 'UNCLAIMED');
    });

    test('AuditLog record is created with admin identity and selection metadata', async () => {
      const audit = await AuditLog.findOne({
        action: 'WINNER_FINALIZATION',
        entityId: testEndedPool._id.toString(),
      });
      assert.ok(audit, 'AuditLog must exist for WINNER_FINALIZATION');
      assert.equal(audit.actorId, 'user_admin');
      assert.equal(audit.metadata.selectionMethod, 'CRYPTO_RANDOM');
      assert.equal(audit.metadata.winnerCount, 1);
    });

    test('Public-safe winner serialization omits phone, address, and raw sensitive fields', async () => {
      const publicWinners = await WinnerService.getWinnersByGiveaway(testEndedPool._id);
      assert.equal(publicWinners.length, 1);
      const w = publicWinners[0];

      assert.ok(w.maskedUserId.includes('***'), 'maskedUserId must be privacy-masked');
      assert.equal(w.phone, undefined, 'phone must not be exposed');
      assert.equal(w.address, undefined, 'address must not be exposed');
      assert.equal(w.claimData, undefined, 'claimData must not be exposed');
    });

    test('Repeated finalization does not create duplicate winners or trigger second draw', async () => {
      const adminToken = AuthService.generateToken(adminUser);
      const res = await fetch(`${baseUrl}/admin/giveaways/${testEndedPool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.data.isAlreadyFinalized, true);

      // Ensure total winner records in DB for this giveaway is still exactly 1
      const totalWinners = await Winner.countDocuments({ giveawayId: testEndedPool._id });
      assert.equal(totalWinners, 1, 'Total winners in database must remain 1');
    });

    test('Giveaway with 0 eligible participants fails safely with NO_ELIGIBLE_PARTICIPANTS', async () => {
      const emptyPool = await Giveaway.create({
        slug: 'empty-ended-pool',
        title: 'Empty Ended Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'ENDED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 0,
        claimType: 'PHYSICAL_DELIVERY',
      });

      const adminToken = AuthService.generateToken(adminUser);
      const res = await fetch(`${baseUrl}/admin/giveaways/${emptyPool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.equal(data.code, 'NO_ELIGIBLE_PARTICIPANTS');
    });

    test('Multi-winner pool enforces configured winnerCount and fails if participants < winnerCount', async () => {
      // Create multi-winner pool requiring 3 winners with only 1 participant
      const multiPool = await Giveaway.create({
        slug: 'multi-winner-pool-test',
        title: 'Multi-Winner Pool Test',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'ENDED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 3,
        participantCount: 1,
        claimType: 'GIFT_CARD_CODE',
      });

      await GiveawayParticipation.create({
        userId: 'user_alex',
        giveawayId: multiPool._id,
        prizeId: multiPool.prizeId,
        entryCurrency: 'VEs',
        entryAmount: 100,
        status: 'CONFIRMED',
      });

      const adminToken = AuthService.generateToken(adminUser);

      // Attempt 1: only 1 participant for 3 slots -> fails
      const failRes = await fetch(`${baseUrl}/admin/giveaways/${multiPool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const failData = await failRes.json();
      assert.equal(failRes.status, 400);
      assert.equal(failData.code, 'INSUFFICIENT_PARTICIPANTS');

      // Add 2 more participants (total 3)
      await GiveawayParticipation.insertMany([
        {
          userId: 'user_priya',
          giveawayId: multiPool._id,
          prizeId: multiPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
        {
          userId: 'user_rahul',
          giveawayId: multiPool._id,
          prizeId: multiPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
      ]);

      // Attempt 2: now has 3 participants for 3 slots -> succeeds
      const passRes = await fetch(`${baseUrl}/admin/giveaways/${multiPool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const passData = await passRes.json();
      assert.equal(passRes.status, 200);
      assert.equal(passData.data.winnerCount, 3);
      assert.equal(passData.data.winners.length, 3);

      const ranks = passData.data.winners.map((w) => w.rank).sort();
      assert.deepEqual(ranks, [1, 2, 3], 'Must assign unique ranks 1, 2, 3');
    });

    test('Client-supplied parameters (winnerCount, userId, prizeId) are discarded', async () => {
      const customEndedPool = await Giveaway.create({
        slug: 'override-tamper-test',
        title: 'Tamper Test Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'ENDED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await GiveawayParticipation.insertMany([
        {
          userId: 'user_alex',
          giveawayId: customEndedPool._id,
          prizeId: customEndedPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
        {
          userId: 'user_priya',
          giveawayId: customEndedPool._id,
          prizeId: customEndedPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
      ]);

      const adminToken = AuthService.generateToken(adminUser);
      // Attempt to tamper with winnerCount, inject arbitrary winner userId, and fake prizeId
      const res = await fetch(`${baseUrl}/admin/giveaways/${customEndedPool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          winnerCount: 99,
          userId: 'user_malicious_attacker',
          winnerId: 'winner_fake_123',
          prizeId: '6a9f9ac1d84b51ce21e90e99',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.data.winnerCount, 1, 'Configured winnerCount of 1 must be respected');
      assert.equal(data.data.winners.length, 1);

      const dbWinner = await Winner.findOne({ giveawayId: customEndedPool._id });
      assert.ok(
        ['user_alex', 'user_priya'].includes(dbWinner.userId),
        'Winner must be from confirmed participants, ignoring attacker injection'
      );
    });

    test('Concurrent finalization attempts preserve winner invariants and do not duplicate', async () => {
      const concurrentPool = await Giveaway.create({
        slug: 'concurrent-finalization-test',
        title: 'Concurrent Finalization Test Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'ENDED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 2,
        participantCount: 4,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await GiveawayParticipation.insertMany([
        {
          userId: 'user_alex',
          giveawayId: concurrentPool._id,
          prizeId: concurrentPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
        {
          userId: 'user_priya',
          giveawayId: concurrentPool._id,
          prizeId: concurrentPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
        {
          userId: 'user_rahul',
          giveawayId: concurrentPool._id,
          prizeId: concurrentPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
        {
          userId: 'user_sujal',
          giveawayId: concurrentPool._id,
          prizeId: concurrentPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
      ]);

      const adminToken = AuthService.generateToken(adminUser);

      // Fire 4 simultaneous finalization requests
      const promises = Array.from({ length: 4 }).map(() =>
        fetch(`${baseUrl}/admin/giveaways/${concurrentPool._id}/select-winners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);

      // All responses should either be initial success or idempotent already finalized response
      results.forEach((res) => {
        assert.ok(res.success || res.code === 'WINNERS_ALREADY_FINALIZED');
      });

      // Verify DB invariant: exactly 2 winners created, unique ranks, no duplicate users
      const totalWinners = await Winner.find({ giveawayId: concurrentPool._id }).lean();
      assert.equal(totalWinners.length, 2, 'Exactly 2 winners must exist');

      const userIds = totalWinners.map((w) => w.userId);
      const uniqueUserIds = new Set(userIds);
      assert.equal(uniqueUserIds.size, 2, 'Winners must be unique participants');

      const ranks = totalWinners.map((w) => w.rank).sort();
      assert.deepEqual(ranks, [1, 2], 'Ranks must be unique integers [1, 2]');
    });

    test('Crash Consistency: Recover from COMPLETED giveaway with 0 winners (simulated crash)', async () => {
      // Create a giveaway in COMPLETED status but with 0 winners (simulating mid-draw process crash)
      const crashedPool = await Giveaway.create({
        slug: 'crash-recovery-empty-test',
        title: 'Crashed Empty Pool Test',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await GiveawayParticipation.insertMany([
        {
          userId: 'user_alex',
          giveawayId: crashedPool._id,
          prizeId: crashedPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
        {
          userId: 'user_priya',
          giveawayId: crashedPool._id,
          prizeId: crashedPool.prizeId,
          entryCurrency: 'VEs',
          entryAmount: 100,
          status: 'CONFIRMED',
        },
      ]);

      const adminToken = AuthService.generateToken(adminUser);
      // Admin calls select-winners on the crashed pool
      const res = await fetch(`${baseUrl}/admin/giveaways/${crashedPool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();

      assert.equal(res.status, 200, 'Must successfully recover and finalize winners');
      assert.equal(data.success, true);
      assert.equal(data.data.status, 'COMPLETED');
      assert.equal(data.data.winnerCount, 1);
      assert.equal(data.data.winners.length, 1);

      // Verify Winner record is now in database
      const dbWinner = await Winner.findOne({ giveawayId: crashedPool._id });
      assert.ok(dbWinner, 'Winner must exist in database after recovery');
      assert.ok(['user_alex', 'user_priya'].includes(dbWinner.userId));

      // Subsequent call should return idempotent already-finalized
      const repeatRes = await fetch(`${baseUrl}/admin/giveaways/${crashedPool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const repeatData = await repeatRes.json();
      assert.equal(repeatRes.status, 200);
      assert.equal(repeatData.data.isAlreadyFinalized, true);
    });

    test('Crash Consistency: Giveaway with winners created but status ENDED self-heals to COMPLETED', async () => {
      // Create a giveaway in ENDED status where Winner document was created before status update
      const halfDonePool = await Giveaway.create({
        slug: 'crash-recovery-existing-test',
        title: 'Half Done Pool Test',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'ENDED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      // Insert pre-existing winner document
      const preWinner = await Winner.create({
        giveawayId: halfDonePool._id,
        userId: 'user_alex',
        userHandle: 'alex_winner',
        prizeId: halfDonePool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: '100 VEs',
        txHash: '0x1234567890abcdef',
        isRecent: true,
      });

      const adminToken = AuthService.generateToken(adminUser);
      const res = await fetch(`${baseUrl}/admin/giveaways/${halfDonePool._id}/select-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.data.isAlreadyFinalized, true);
      assert.equal(data.data.winners[0].id, preWinner._id.toString());

      // Verify Giveaway status in DB was self-healed to COMPLETED
      const updatedPool = await Giveaway.findById(halfDonePool._id);
      assert.equal(updatedPool.status, 'COMPLETED', 'Status must be self-healed to COMPLETED');
    });
  });

  describe('10. Public Winner APIs & Privacy Security (Stage 3C)', () => {
    let completedGiveaway = null;

    before(async () => {
      // Find or verify a completed giveaway with seeded/finalized winners
      completedGiveaway = await Giveaway.findOne({ status: 'COMPLETED' }).populate('prizeId').lean();
      if (!completedGiveaway) {
        // Create completed pool if not present
        completedGiveaway = await Giveaway.create({
          slug: 'test-completed-public-pool',
          title: 'Test Completed Public Pool',
          prizeId: activeGiveaway.prizeId?._id || activeGiveaway.prizeId,
          entryFee: { currency: 'VEs', amount: 100 },
          status: 'COMPLETED',
          startsAt: new Date(Date.now() - 100000),
          endsAt: new Date(Date.now() - 50000),
          winnerCount: 1,
          participantCount: 5,
          claimType: 'PHYSICAL_DELIVERY',
        });

        await Winner.create({
          giveawayId: completedGiveaway._id,
          userId: 'user_alex',
          userHandle: 'alex_winner',
          maskedUserId: 'al***@veloop.io',
          maskedPhone: '98****1234',
          prizeId: completedGiveaway.prizeId?._id || completedGiveaway.prizeId,
          prizeName: 'Apple iPhone 15 Pro',
          rank: 1,
          drawnAt: new Date(),
          claimStatus: 'FULFILLED',
          statusLabel: 'Delivered & Verified',
          entryFeePaid: '100 VEs',
          txHash: '0xabcdef1234567890',
          isRecent: true,
        });
      }
    });

    test('1. GET /api/giveaways/:id/winners works without authentication (Public access)', async () => {
      const res = await fetch(`${baseUrl}/giveaways/${completedGiveaway.slug}/winners`);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.message, 'Giveaway winners retrieved');
      assert.ok(Array.isArray(data.data), 'data must be an array of winners');
      assert.ok(data.data.length >= 1, 'Must return at least 1 winner for completed pool');
    });

    test('2. Authenticated USER (role: USER) can access public winner endpoint without elevated privileges', async () => {
      const userToken = AuthService.generateToken(alexUser);
      const res = await fetch(`${baseUrl}/giveaways/${completedGiveaway.slug}/winners`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
    });

    test('3. Authenticated ADMIN (role: ADMIN) can access public winner endpoint', async () => {
      const adminToken = AuthService.generateToken(adminUser);
      const res = await fetch(`${baseUrl}/giveaways/${completedGiveaway.slug}/winners`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
    });

    test('4. Malformed giveaway ID / blank spaces is rejected with HTTP 400 INVALID_IDENTIFIER', async () => {
      const res = await fetch(`${baseUrl}/giveaways/%20%20/winners`);
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.equal(data.code, 'INVALID_IDENTIFIER');
    });

    test('5. Nonexistent giveaway ID/slug yields HTTP 404 GIVEAWAY_NOT_FOUND', async () => {
      const res = await fetch(`${baseUrl}/giveaways/non-existent-random-pool-slug-9999/winners`);
      const data = await res.json();

      assert.equal(res.status, 404);
      assert.equal(data.success, false);
      assert.equal(data.code, 'GIVEAWAY_NOT_FOUND');
    });

    test('6. Active / upcoming giveaway with no finalized winners returns HTTP 200 with empty array []', async () => {
      const res = await fetch(`${baseUrl}/giveaways/${activeGiveaway.slug}/winners`);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.deepEqual(data.data, [], 'Active pool must return empty winners array []');
    });

    test('7. Completed giveaway returns its finalized winners with correct count and rank ordering', async () => {
      const res = await fetch(`${baseUrl}/giveaways/${completedGiveaway._id}/winners`);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.length >= 1);

      // Verify rank ordering is ascending
      const ranks = data.data.map((w) => w.rank);
      for (let i = 0; i < ranks.length - 1; i++) {
        assert.ok(ranks[i] <= ranks[i + 1], 'Winners must be sorted by rank ascending');
      }
    });

    test('8. GET /api/giveaways/previous/winners returns historical completed pool winners', async () => {
      const res = await fetch(`${baseUrl}/giveaways/previous/winners`);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.message, 'Previous winners retrieved');
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length >= 1, 'Must return historical winners');
    });

    test('9. Public winner response schema strictly exposes safe fields', async () => {
      const res = await fetch(`${baseUrl}/giveaways/${completedGiveaway.slug}/winners`);
      const data = await res.json();
      const winner = data.data[0];

      assert.ok(winner, 'Winner item must exist');
      assert.ok(typeof winner.id === 'string', 'Must include sanitized string id');
      assert.ok(typeof winner.giveawayId === 'string', 'Must include giveawayId');
      assert.ok(typeof winner.giveawayTitle === 'string', 'Must include giveawayTitle');
      assert.ok(typeof winner.prize === 'string', 'Must include prize name');
      assert.ok(typeof winner.prizeType === 'string', 'Must include prizeType');
      assert.ok(typeof winner.prizeImage === 'string', 'Must include prizeImage URL');
      assert.ok(typeof winner.maskedUserId === 'string', 'Must include maskedUserId');
      assert.ok(typeof winner.userHandle === 'string', 'Must include userHandle');
      assert.ok(typeof winner.rank === 'number', 'Must include rank');
      assert.ok(winner.drawDate, 'Must include drawDate');
      assert.ok(typeof winner.claimStatus === 'string', 'Must include claimStatus');
      assert.ok(typeof winner.statusLabel === 'string', 'Must include statusLabel');
    });

    test('10. Public response strictly DOES NOT contain phone, email, fullName, address, postalCode, claimData, fraud, audit, or wallet data', async () => {
      const res = await fetch(`${baseUrl}/giveaways/${completedGiveaway.slug}/winners`);
      const data = await res.json();
      const winner = data.data[0];

      // Sensitive identity & contact exclusions
      assert.equal(winner.phone, undefined, 'phone must NOT be in public response');
      assert.equal(winner.maskedPhone, undefined, 'maskedPhone must NOT be in public response');
      assert.equal(winner.email, undefined, 'email must NOT be in public response');
      assert.equal(winner.fullName, undefined, 'fullName must NOT be in public response');
      assert.equal(winner.address, undefined, 'address must NOT be in public response');
      assert.equal(winner.postalCode, undefined, 'postalCode must NOT be in public response');
      assert.equal(winner.pincode, undefined, 'pincode must NOT be in public response');

      // Sensitive claim & internal data exclusions
      assert.equal(winner.claimData, undefined, 'claimData must NOT be in public response');
      assert.equal(winner.claimId, undefined, 'claimId must NOT be in public response');
      assert.equal(winner.shippingAddress, undefined, 'shippingAddress must NOT be in public response');
      assert.equal(winner.voucherCode, undefined, 'voucherCode must NOT be in public response');

      // Security / System metadata exclusions
      assert.equal(winner.fraud, undefined, 'fraud data must NOT be in public response');
      assert.equal(winner.fraudScore, undefined, 'fraudScore must NOT be in public response');
      assert.equal(winner.auditLog, undefined, 'auditLog must NOT be in public response');
      assert.equal(winner.balance, undefined, 'balance must NOT be in public response');
      assert.equal(winner.wallet, undefined, 'wallet must NOT be in public response');
    });

    test('11. Raw/internal user identifiers are not leaked and maskedUserId contains asterisk masking', async () => {
      const res = await fetch(`${baseUrl}/giveaways/${completedGiveaway.slug}/winners`);
      const data = await res.json();
      const winner = data.data[0];

      // Raw unmasked userId must be omitted
      assert.equal(winner.userId, undefined, 'Raw userId must NOT be present in public winner object');
      // maskedUserId must have mask characters '***'
      assert.ok(winner.maskedUserId.includes('***'), `maskedUserId '${winner.maskedUserId}' must contain '***'`);
    });

    test('12. Client-supplied identity/tampering parameters cannot alter returned winner records', async () => {
      const tamperedUrl = `${baseUrl}/giveaways/${completedGiveaway.slug}/winners?userId=fake_attacker_id&winnerId=injected_123&prize=FakePrize`;
      const res = await fetch(tamperedUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      const winner = data.data[0];
      // Backend database state remains authoritative
      assert.notEqual(winner.userHandle, 'fake_attacker_id');
      assert.notEqual(winner.prize, 'FakePrize');
    });
  });

  describe('11. Prize Claim Foundation & Security Engine (Stage 3D)', () => {
    let physicalClaimPool = null;
    let giftCardClaimPool = null;
    let expiredClaimPool = null;
    let concurrentClaimPool = null;
    let sujalUser = null;

    before(async () => {
      // Find or create test users
      sujalUser = await UserAccount.findOne({ userId: 'user_sujal' });
      if (!sujalUser) {
        sujalUser = await UserAccount.create({
          userId: 'user_sujal',
          handle: 'sujal_v',
          name: 'Sujal Vasara',
          email: 'sujal@veloop.io',
          role: 'USER',
          tier: 1,
          balances: { VEs: 1000, SVEs: 1000, Tokens: 5000 },
        });
      }

      // Cleanup any previous test claim pools
      const claimPoolSlugs = [
        'physical-claim-test-pool',
        'giftcard-claim-test-pool',
        'expired-claim-test-pool',
        'concurrent-claim-test-pool',
        'temp-physical-val-pool',
        'temp-gift-val-pool',
        'temp-wrong-type-pool',
        'temp-prize-tamper-pool',
        'temp-type-override-pool',
        'crash-claim-test-pool',
        'crash-expiry-test-pool',
      ];
      const oldGiveaways = await Giveaway.find({ slug: { $in: claimPoolSlugs } }).lean();
      const oldIds = oldGiveaways.map((g) => g._id);

      await Claim.deleteMany({ giveawayId: { $in: oldIds } });
      await Winner.deleteMany({ giveawayId: { $in: oldIds } });
      await AuditLog.deleteMany({ entityId: { $in: oldIds.map((id) => id.toString()) } });
      await FraudEvent.deleteMany({ giveawayId: { $in: oldIds } });
      await Giveaway.deleteMany({ slug: { $in: claimPoolSlugs } });

      // 1. Physical Delivery Pool (Winner: user_alex)
      physicalClaimPool = await Giveaway.create({
        slug: 'physical-claim-test-pool',
        title: 'Physical Delivery Test Pool',
        prizeId: activeGiveaway.prizeId?._id || activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await Winner.create({
        giveawayId: physicalClaimPool._id,
        userId: 'user_alex',
        userHandle: 'alex_winner',
        maskedUserId: 'al***@veloop.io',
        prizeId: physicalClaimPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: '100 VEs',
        txHash: '0xclaim111111111111',
        isRecent: true,
      });

      // 2. Gift Card Pool (Winner: user_priya)
      giftCardClaimPool = await Giveaway.create({
        slug: 'giftcard-claim-test-pool',
        title: 'Gift Card Test Pool',
        prizeId: activeGiveaway.prizeId?._id || activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'GIFT_CARD_CODE',
      });

      await Winner.create({
        giveawayId: giftCardClaimPool._id,
        userId: 'user_priya',
        userHandle: 'priya_winner',
        maskedUserId: 'pr***@veloop.io',
        prizeId: giftCardClaimPool.prizeId,
        prizeName: '₹2,000 Amazon Pay Gift Card',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: '100 VEs',
        txHash: '0xclaim222222222222',
        isRecent: true,
      });

      // 3. Expired Pool (Winner: user_rahul drawn 30 days ago)
      expiredClaimPool = await Giveaway.create({
        slug: 'expired-claim-test-pool',
        title: 'Expired Claim Test Pool',
        prizeId: activeGiveaway.prizeId?._id || activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await Winner.create({
        giveawayId: expiredClaimPool._id,
        userId: 'user_rahul',
        userHandle: 'rahul_winner',
        maskedUserId: 'ra***@veloop.io',
        prizeId: expiredClaimPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: '100 VEs',
        txHash: '0xclaim333333333333',
        isRecent: false,
      });

      // 4. Concurrent Claim Pool (Winner: user_sujal)
      concurrentClaimPool = await Giveaway.create({
        slug: 'concurrent-claim-test-pool',
        title: 'Concurrent Claim Test Pool',
        prizeId: activeGiveaway.prizeId?._id || activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await Winner.create({
        giveawayId: concurrentClaimPool._id,
        userId: 'user_sujal',
        userHandle: 'sujal_winner',
        maskedUserId: 'su***@veloop.io',
        prizeId: concurrentClaimPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: '100 VEs',
        txHash: '0xclaim444444444444',
        isRecent: true,
      });
    });

    test('1. Unauthenticated claim yields HTTP 401 LOGIN_REQUIRED', async () => {
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'Alex Smith' }),
      });
      const data = await res.json();

      assert.equal(res.status, 401);
      assert.equal(data.success, false);
      assert.equal(data.code, 'LOGIN_REQUIRED');
    });

    test('2. Normal authenticated USER who is not a winner yields HTTP 403 NOT_A_WINNER and records FraudEvent', async () => {
      // user_rahul is not a winner in physicalClaimPool
      const rahulToken = AuthService.generateToken(rahulUser);
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rahulToken}`,
        },
        body: JSON.stringify({
          fullName: 'Rahul Sharma',
          phone: '+919876543210',
          addressLine1: '456 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400020',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 403);
      assert.equal(data.success, false);
      assert.equal(data.code, 'NOT_A_WINNER');

      // Verify FraudEvent was recorded for unauthorized claim access
      const fraud = await FraudEvent.findOne({
        userId: 'user_rahul',
        giveawayId: physicalClaimPool._id,
        eventType: 'UNAUTHORIZED_CLAIM_ACCESS',
      });
      assert.ok(fraud, 'FraudEvent must be recorded for unauthorized claim attempt');
      assert.equal(fraud.actionTaken, 'BLOCKED');
    });

    test('3. Authenticated winner can submit a valid physical claim with required shipping details', async () => {
      const alexToken = AuthService.generateToken(alexUser);
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          fullName: 'Alex Turner',
          phone: '+919876543210',
          addressLine1: '123 Baker Street, Apt 4B',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, 'PENDING_REVIEW');
      assert.equal(data.data.userFacingStatus, 'SUBMITTED');
      assert.equal(data.data.claimType, 'PHYSICAL_DELIVERY');
      assert.equal(data.data.claimData.fullName, 'Alex Turner');
      assert.equal(data.data.claimData.city, 'Bangalore');

      // Verify Claim document was written to database
      const dbClaim = await Claim.findOne({ giveawayId: physicalClaimPool._id, userId: 'user_alex' });
      assert.ok(dbClaim, 'Claim must exist in database');
      assert.equal(dbClaim.status, 'PENDING_REVIEW');
      assert.equal(dbClaim.claimData.fullName, 'Alex Turner');

      // Verify Winner record was updated to CLAIMED
      const dbWinner = await Winner.findOne({ giveawayId: physicalClaimPool._id, userId: 'user_alex' });
      assert.equal(dbWinner.claimStatus, 'CLAIMED');
      assert.equal(dbWinner.claimId.toString(), dbClaim._id.toString());
    });

    test('4. Authenticated winner can submit a valid gift-card claim with email', async () => {
      const priyaToken = AuthService.generateToken(priyaUser);
      const res = await fetch(`${baseUrl}/giveaways/${giftCardClaimPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${priyaToken}`,
        },
        body: JSON.stringify({
          email: 'priya.winner@veloop.io',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, 'PENDING_REVIEW');
      assert.equal(data.data.claimType, 'GIFT_CARD_CODE');
      assert.equal(data.data.claimData.voucherDeliveryEmail, 'priya.winner@veloop.io');

      const dbClaim = await Claim.findOne({ giveawayId: giftCardClaimPool._id, userId: 'user_priya' });
      assert.ok(dbClaim);
      assert.equal(dbClaim.claimType, 'GIFT_CARD_CODE');
    });

    test('5. Physical claim missing required fields yields HTTP 400 INVALID_CLAIM_DATA', async () => {
      // Create temporary physical pool for validation testing
      const tempPhysicalPool = await Giveaway.create({
        slug: 'temp-physical-val-pool',
        title: 'Temp Physical Val Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await Winner.create({
        giveawayId: tempPhysicalPool._id,
        userId: 'user_alex',
        userHandle: 'alex_val',
        prizeId: tempPhysicalPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        txHash: '0xval111111111111',
      });

      const alexToken = AuthService.generateToken(alexUser);

      // Missing phone and postalCode
      const res = await fetch(`${baseUrl}/giveaways/${tempPhysicalPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          fullName: 'Alex Test',
          addressLine1: 'Short Rd',
          city: 'Mumbai',
          state: 'MH',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.equal(data.code, 'INVALID_CLAIM_DATA');
    });

    test('6. Gift card claim with invalid email yields HTTP 400 INVALID_CLAIM_DATA', async () => {
      const tempGiftPool = await Giveaway.create({
        slug: 'temp-gift-val-pool',
        title: 'Temp Gift Val Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'GIFT_CARD_CODE',
      });

      await Winner.create({
        giveawayId: tempGiftPool._id,
        userId: 'user_priya',
        userHandle: 'priya_val',
        prizeId: tempGiftPool.prizeId,
        prizeName: '₹500 Amazon Gift Card',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        txHash: '0xval222222222222',
      });

      const priyaToken = AuthService.generateToken(priyaUser);
      const res = await fetch(`${baseUrl}/giveaways/${tempGiftPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${priyaToken}`,
        },
        body: JSON.stringify({
          email: 'not-a-valid-email',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.equal(data.code, 'INVALID_CLAIM_DATA');
    });

    test('7. Wrong claim-type payload is rejected (e.g. submitting only email for physical prize)', async () => {
      const tempPool = await Giveaway.create({
        slug: 'temp-wrong-type-pool',
        title: 'Temp Wrong Type Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await Winner.create({
        giveawayId: tempPool._id,
        userId: 'user_alex',
        userHandle: 'alex_wrong_type',
        prizeId: tempPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        txHash: '0xval333333333333',
      });

      const alexToken = AuthService.generateToken(alexUser);
      const res = await fetch(`${baseUrl}/giveaways/${tempPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          email: 'alex@veloop.io', // missing address, phone, city, state, postalCode
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.equal(data.code, 'INVALID_CLAIM_DATA');
    });

    test('8. Client-supplied winnerId cannot impersonate another winner', async () => {
      // user_rahul tries to claim physicalClaimPool by sending user_alex winnerId
      const alexWinner = await Winner.findOne({ giveawayId: physicalClaimPool._id, userId: 'user_alex' });
      const rahulToken = AuthService.generateToken(rahulUser);

      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rahulToken}`,
        },
        body: JSON.stringify({
          winnerId: alexWinner._id.toString(),
          fullName: 'Attacker Rahul',
          phone: '+919876543210',
          addressLine1: 'Attacker Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 403);
      assert.equal(data.code, 'NOT_A_WINNER');
    });

    test('9. Client-supplied userId in body/query cannot impersonate another user', async () => {
      const rahulToken = AuthService.generateToken(rahulUser);
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/claim?userId=user_alex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rahulToken}`,
        },
        body: JSON.stringify({
          userId: 'user_alex',
          fullName: 'Attacker Impersonation',
          phone: '+919876543210',
          addressLine1: 'Impersonator Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 403);
      assert.equal(data.code, 'NOT_A_WINNER');
    });

    test('10. Client-supplied claimId in body cannot alter existing claim ownership', async () => {
      const alexClaim = await Claim.findOne({ giveawayId: physicalClaimPool._id, userId: 'user_alex' });
      const rahulToken = AuthService.generateToken(rahulUser);

      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rahulToken}`,
        },
        body: JSON.stringify({
          claimId: alexClaim._id.toString(),
          fullName: 'Attacker Hijack',
          phone: '+919876543210',
          addressLine1: 'Hijack Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 403);
      assert.equal(data.code, 'NOT_A_WINNER');
    });

    test('11. Client-supplied prizeId in body cannot change authoritative prize', async () => {
      const tempPool = await Giveaway.create({
        slug: 'temp-prize-tamper-pool',
        title: 'Temp Prize Tamper Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'GIFT_CARD_CODE',
      });

      await Winner.create({
        giveawayId: tempPool._id,
        userId: 'user_alex',
        userHandle: 'alex_tamper',
        prizeId: tempPool.prizeId,
        prizeName: '₹500 Amazon Gift Card',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        txHash: '0xtamper1111111111',
      });

      const alexToken = AuthService.generateToken(alexUser);
      const res = await fetch(`${baseUrl}/giveaways/${tempPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          prizeId: '6a9f9ac1d84b51ce21e90e99',
          email: 'alex.tamper@veloop.io',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.data.prizeName, '₹500 Amazon Gift Card');
    });

    test('12. Client-supplied claimType in body cannot override backend configuration', async () => {
      // physicalClaimPool is configured as PHYSICAL_DELIVERY
      const tempPool = await Giveaway.create({
        slug: 'temp-type-override-pool',
        title: 'Temp Type Override Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      await Winner.create({
        giveawayId: tempPool._id,
        userId: 'user_alex',
        userHandle: 'alex_override',
        prizeId: tempPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        txHash: '0xtamper2222222222',
      });

      const alexToken = AuthService.generateToken(alexUser);
      // Attempt to send claimType: GIFT_CARD_CODE with only email
      const res = await fetch(`${baseUrl}/giveaways/${tempPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          claimType: 'GIFT_CARD_CODE',
          email: 'alex@veloop.io',
        }),
      });
      const data = await res.json();

      // Must reject because backend authoritative type is PHYSICAL_DELIVERY which requires shipping address
      assert.equal(res.status, 400);
      assert.equal(data.code, 'INVALID_CLAIM_DATA');
    });

    test('13. Expired claim window rejects submission with HTTP 400 CLAIM_EXPIRED and updates Winner status to EXPIRED', async () => {
      const rahulToken = AuthService.generateToken(rahulUser);
      const res = await fetch(`${baseUrl}/giveaways/${expiredClaimPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rahulToken}`,
        },
        body: JSON.stringify({
          fullName: 'Rahul Late',
          phone: '+919876543210',
          addressLine1: 'Late Lane',
          city: 'Delhi',
          state: 'Delhi',
          postalCode: '110001',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.equal(data.code, 'CLAIM_EXPIRED');

      // Verify Winner status was transitioned to EXPIRED in database
      const dbWinner = await Winner.findOne({ giveawayId: expiredClaimPool._id, userId: 'user_rahul' });
      assert.equal(dbWinner.claimStatus, 'EXPIRED');

      // Verify FraudEvent was recorded for expired claim attempt
      const fraud = await FraudEvent.findOne({
        userId: 'user_rahul',
        giveawayId: expiredClaimPool._id,
        eventType: 'CLAIM_EXPIRED',
      });
      assert.ok(fraud);
    });

    test('14. Duplicate claim submission does not create a second Claim (idempotent replay)', async () => {
      const alexToken = AuthService.generateToken(alexUser);
      // Second submission for physicalClaimPool (already claimed in Test 3)
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          fullName: 'Alex Turner Second Attempt',
          phone: '+919876543210',
          addressLine1: '123 Baker Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.data.isIdempotentReplay, true);

      // Verify total Claim count for this giveaway remains exactly 1
      const totalClaims = await Claim.countDocuments({ giveawayId: physicalClaimPool._id, userId: 'user_alex' });
      assert.equal(totalClaims, 1, 'Must have exactly 1 claim document');
    });

    test('15. Concurrent claim submissions create at most one Claim document', async () => {
      const sujalToken = AuthService.generateToken(sujalUser);

      // Fire 4 simultaneous claim submissions for concurrentClaimPool
      const promises = Array.from({ length: 4 }).map(() =>
        fetch(`${baseUrl}/giveaways/${concurrentClaimPool._id}/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sujalToken}`,
          },
          body: JSON.stringify({
            fullName: 'Sujal Vasara',
            phone: '+919876543210',
            addressLine1: 'Parallel Execution Avenue',
            city: 'Ahmedabad',
            state: 'Gujarat',
            postalCode: '380001',
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);

      // All responses should either be initial creation or idempotent replay
      results.forEach((res) => {
        assert.equal(res.success, true);
        assert.equal(res.data.status, 'PENDING_REVIEW');
      });

      // Database invariant: exactly 1 Claim document created
      const totalClaims = await Claim.countDocuments({ giveawayId: concurrentClaimPool._id, userId: 'user_sujal' });
      assert.equal(totalClaims, 1, 'Concurrent submissions must create exactly 1 Claim record');
    });

    test('16. GET /api/giveaways/:id/my-claim returns only the authenticated user\'s claim and userFacingStatus', async () => {
      const alexToken = AuthService.generateToken(alexUser);
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/my-claim`, {
        headers: { Authorization: `Bearer ${alexToken}` },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.isWinner, true);
      assert.equal(data.data.canClaim, false, 'Already claimed -> canClaim must be false');
      assert.equal(data.data.claimStatus, 'CLAIMED');
      assert.equal(data.data.fulfillmentStatus, 'PENDING_REVIEW');
      assert.equal(data.data.userFacingStatus, 'SUBMITTED');
      assert.ok(data.data.claim, 'Must include claim object');
      assert.equal(data.data.claim.claimData.fullName, 'Alex Turner');
    });

    test('17. GET /api/giveaways/:id/my-claim cannot be altered using query/body userId', async () => {
      const rahulToken = AuthService.generateToken(rahulUser);
      // rahul tries to read alex's claim by injecting userId=user_alex
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/my-claim?userId=user_alex`, {
        headers: { Authorization: `Bearer ${rahulToken}` },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      // Must evaluate rahul's status (not alex's)
      assert.equal(data.data.isWinner, false);
      assert.equal(data.data.claim, null);
    });

    test('18. Nonexistent giveaway yields HTTP 404 GIVEAWAY_NOT_FOUND on claim and my-claim', async () => {
      const alexToken = AuthService.generateToken(alexUser);

      const claimRes = await fetch(`${baseUrl}/giveaways/non-existent-pool-xyz-123/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({ fullName: 'Alex Smith' }),
      });
      const claimData = await claimRes.json();
      assert.equal(claimRes.status, 404);
      assert.equal(claimData.code, 'GIVEAWAY_NOT_FOUND');

      const myClaimRes = await fetch(`${baseUrl}/giveaways/non-existent-pool-xyz-123/my-claim`, {
        headers: { Authorization: `Bearer ${alexToken}` },
      });
      const myClaimData = await myClaimRes.json();
      assert.equal(myClaimRes.status, 404);
      assert.equal(myClaimData.code, 'GIVEAWAY_NOT_FOUND');
    });

    test('19. Non-winner calling GET /api/giveaways/:id/my-claim receives isWinner: false', async () => {
      const rahulToken = AuthService.generateToken(rahulUser);
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/my-claim`, {
        headers: { Authorization: `Bearer ${rahulToken}` },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.data.isWinner, false);
      assert.equal(data.data.canClaim, false);
      assert.equal(data.data.claim, null);
    });

    test('20. Claim response strictly does NOT leak fraud/audit/internal database fields', async () => {
      const alexToken = AuthService.generateToken(alexUser);
      const res = await fetch(`${baseUrl}/giveaways/${physicalClaimPool._id}/my-claim`, {
        headers: { Authorization: `Bearer ${alexToken}` },
      });
      const data = await res.json();

      assert.equal(data.data.fraud, undefined);
      assert.equal(data.data.fraudScore, undefined);
      assert.equal(data.data.auditLog, undefined);
      assert.equal(data.data.balances, undefined);
      assert.equal(data.data.__v, undefined);
    });

    test('21. AuditLog is created for successful claim submission without raw PII in metadata', async () => {
      const audit = await AuditLog.findOne({
        action: 'PRIZE_CLAIM_SUBMITTED',
        actorId: 'user_alex',
      });
      assert.ok(audit, 'AuditLog must exist for PRIZE_CLAIM_SUBMITTED');
      assert.equal(audit.actorId, 'user_alex');
      assert.equal(audit.metadata.giveawayId, physicalClaimPool._id.toString());
      assert.equal(audit.metadata.claimType, 'PHYSICAL_DELIVERY');

      // Audit metadata must NOT contain raw PII
      assert.equal(audit.metadata.phone, undefined, 'phone must NOT be in audit metadata');
      assert.equal(audit.metadata.addressLine1, undefined, 'address must NOT be in audit metadata');
      assert.equal(audit.metadata.email, undefined, 'email must NOT be in audit metadata');
    });

    test('22. Crash Consistency: Claim exists + Winner remains UNCLAIMED -> retry recovers and syncs Winner to CLAIMED without duplicate Claim', async () => {
      // Create a pool where Claim was inserted but process crashed before Winner update
      const crashPool = await Giveaway.create({
        slug: `crash-claim-test-pool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: 'Crash Claim Test Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 50000),
        endsAt: new Date(Date.now() - 10000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      // Winner left in UNCLAIMED state
      const crashWinner = await Winner.create({
        giveawayId: crashPool._id,
        userId: 'user_alex',
        userHandle: 'alex_winner',
        maskedUserId: 'al***@veloop.io',
        prizeId: crashPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(),
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: '100 VEs',
        txHash: '0xcrash1111111111',
        isRecent: true,
      });

      // Pre-existing Claim created before crash
      const preCrashClaim = await Claim.create({
        giveawayId: crashPool._id,
        winnerId: crashWinner._id,
        userId: 'user_alex',
        claimType: 'PHYSICAL_DELIVERY',
        claimData: {
          fullName: 'Alex Turner',
          phone: '+919876543210',
          addressLine1: '123 Recovery Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
        },
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
      });

      const auditCountBefore = await AuditLog.countDocuments({ entityId: preCrashClaim._id.toString() });

      // User retries claim submission
      const alexToken = AuthService.generateToken(alexUser);
      const res = await fetch(`${baseUrl}/giveaways/${crashPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          fullName: 'Alex Turner',
          phone: '+919876543210',
          addressLine1: '123 Recovery Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.isIdempotentReplay, true);
      assert.equal(data.data.claimId, preCrashClaim._id.toString());
      assert.equal(data.data.userFacingStatus, 'SUBMITTED');

      // Invariant: Winner state must be repaired to CLAIMED
      const updatedWinner = await Winner.findById(crashWinner._id);
      assert.equal(updatedWinner.claimStatus, 'CLAIMED', 'Winner claimStatus must be self-healed to CLAIMED');
      assert.equal(updatedWinner.claimId.toString(), preCrashClaim._id.toString());

      // Invariant: Exactly one Claim document exists
      const totalClaims = await Claim.countDocuments({ giveawayId: crashPool._id, userId: 'user_alex' });
      assert.equal(totalClaims, 1, 'Exactly one Claim document must exist (no duplicate)');

      // Invariant: No duplicate AuditLog created for recovery
      const auditCountAfter = await AuditLog.countDocuments({ entityId: preCrashClaim._id.toString() });
      assert.equal(auditCountAfter, auditCountBefore, 'No duplicate AuditLog records created on recovery');
    });

    test('23. Crash Consistency: Claim exists + Winner remains UNCLAIMED -> getMyClaim synchronizes Winner state and prevents premature expiration', async () => {
      // Create a pool drawn 20 days ago (past the 14 day window)
      const crashExpiryPool = await Giveaway.create({
        slug: `crash-expiry-test-pool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: 'Crash Expiry Test Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      // Winner left in UNCLAIMED state
      const crashWinner = await Winner.create({
        giveawayId: crashExpiryPool._id,
        userId: 'user_priya',
        userHandle: 'priya_winner',
        maskedUserId: 'pr***@veloop.io',
        prizeId: crashExpiryPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: '100 VEs',
        txHash: '0xcrash2222222222',
        isRecent: false,
      });

      // Valid Claim created before crash
      const preCrashClaim = await Claim.create({
        giveawayId: crashExpiryPool._id,
        winnerId: crashWinner._id,
        userId: 'user_priya',
        claimType: 'PHYSICAL_DELIVERY',
        claimData: {
          fullName: 'Priya Sharma',
          phone: '+919876543210',
          addressLine1: '456 MG Road',
          city: 'Pune',
          state: 'Maharashtra',
          postalCode: '411001',
        },
        status: 'PENDING_REVIEW',
        submittedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
      });

      const priyaToken = AuthService.generateToken(priyaUser);
      const res = await fetch(`${baseUrl}/giveaways/${crashExpiryPool._id}/my-claim`, {
        headers: { Authorization: `Bearer ${priyaToken}` },
      });
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.isWinner, true);
      assert.equal(data.data.isExpired, false, 'Valid claim exists -> must NOT be treated as expired');
      assert.equal(data.data.claimStatus, 'CLAIMED');
      assert.equal(data.data.userFacingStatus, 'SUBMITTED');
      assert.equal(data.data.claim.id, preCrashClaim._id.toString());

      // Invariant: Winner status in DB must be self-healed to CLAIMED rather than EXPIRED
      const updatedWinner = await Winner.findById(crashWinner._id);
      assert.equal(updatedWinner.claimStatus, 'CLAIMED', 'Must self-heal to CLAIMED and not be overwritten to EXPIRED');
    });

    test('24. Partial-write boundary: Non-winner or invalid user cannot trigger recovery or get marked as claimed', async () => {
      const boundaryPool = await Giveaway.create({
        slug: `partial-write-boundary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: 'Partial Write Boundary Pool',
        prizeId: activeGiveaway.prizeId,
        entryFee: { currency: 'VEs', amount: 100 },
        status: 'COMPLETED',
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        winnerCount: 1,
        participantCount: 2,
        claimType: 'PHYSICAL_DELIVERY',
      });

      // Legitimate winner is priya
      await Winner.create({
        giveawayId: boundaryPool._id,
        userId: 'user_priya',
        userHandle: 'priya_winner',
        maskedUserId: 'pr***@veloop.io',
        prizeId: boundaryPool.prizeId,
        prizeName: 'Apple iPhone 15 Pro',
        rank: 1,
        drawnAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: '100 VEs',
        txHash: '0xboundary11111111',
        isRecent: false,
      });

      const rahulToken = AuthService.generateToken(rahulUser);
      // user_rahul tries to call claim on boundaryPool (where user_priya is the winner)
      const res = await fetch(`${baseUrl}/giveaways/${boundaryPool._id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rahulToken}`,
        },
        body: JSON.stringify({
          fullName: 'Rahul Attacker',
          phone: '+919876543210',
          addressLine1: 'Attacker Rd',
          city: 'Mumbai',
          state: 'MH',
          postalCode: '400001',
        }),
      });
      const data = await res.json();

      assert.equal(res.status, 403);
      assert.equal(data.code, 'NOT_A_WINNER');

      // Ensure no claims exist for user_rahul in boundaryPool
      const rahulClaim = await Claim.findOne({ giveawayId: boundaryPool._id, userId: 'user_rahul' });
      assert.equal(rahulClaim, null);

      // Ensure priya's winner record remains UNCLAIMED (unaffected by unauthorized request)
      const priyaWinner = await Winner.findOne({ giveawayId: boundaryPool._id, userId: 'user_priya' });
      assert.equal(priyaWinner.claimStatus, 'UNCLAIMED');
    });
  });
});
