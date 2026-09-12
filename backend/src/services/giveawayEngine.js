import mongoose from 'mongoose';
import crypto from 'node:crypto';
import Giveaway from '../models/Giveaway.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import EntryTransaction from '../models/EntryTransaction.js';
import AuditLog from '../models/AuditLog.js';
import { WalletService } from './walletService.js';
import { FraudService } from './fraudService.js';
import { isTransientTransactionError, getMaxTransactionRetries } from '../utils/transactionUtils.js';

/**
 * Giveaway Engine Service
 * Authoritative lifecycle engine, eligibility evaluator, and atomic join processor.
 */
export class GiveawayEngine {
  /**
   * Generates a collision-resistant transaction reference string
   */
  static generateTransactionRef() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TX-VL-${timestamp}-${random}`;
  }

  /**
   * Resolves a Giveaway by either ObjectId or Slug
   */
  static async resolveGiveaway(identifier) {
    if (!identifier) return null;

    let giveaway = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      giveaway = await Giveaway.findById(identifier).populate('prizeId');
    }
    if (!giveaway) {
      giveaway = await Giveaway.findOne({ slug: identifier.toLowerCase().trim() }).populate('prizeId');
    }
    return giveaway;
  }

  /**
   * Evaluates if a user is eligible to join a giveaway
   */
  static async validateEligibility(user, giveaway) {
    if (!user || !user.userId) {
      const err = new Error('Authentication required.');
      err.code = 'LOGIN_REQUIRED';
      err.statusCode = 401;
      throw err;
    }

    if (!giveaway) {
      const err = new Error('Giveaway not found.');
      err.code = 'GIVEAWAY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 1. Status lifecycle verification
    if (giveaway.status === 'UPCOMING') {
      const err = new Error('This giveaway has not started yet.');
      err.code = 'GIVEAWAY_NOT_ACTIVE';
      err.statusCode = 400;
      throw err;
    }

    if (['ENDED', 'COMPLETED', 'ARCHIVED'].includes(giveaway.status)) {
      const err = new Error('This giveaway has already ended.');
      err.code = 'GIVEAWAY_ENDED';
      err.statusCode = 400;
      throw err;
    }

    if (giveaway.status !== 'ACTIVE') {
      const err = new Error(`Giveaway is not active (status: ${giveaway.status}).`);
      err.code = 'GIVEAWAY_NOT_ACTIVE';
      err.statusCode = 400;
      throw err;
    }

    // 2. Time window verification
    const now = new Date();
    if (giveaway.startsAt && now < new Date(giveaway.startsAt)) {
      const err = new Error('This giveaway has not started yet.');
      err.code = 'GIVEAWAY_NOT_ACTIVE';
      err.statusCode = 400;
      throw err;
    }

    if (giveaway.endsAt && now > new Date(giveaway.endsAt)) {
      const err = new Error('This giveaway has concluded.');
      err.code = 'GIVEAWAY_ENDED';
      err.statusCode = 400;
      throw err;
    }

    // 3. User tier and KYC requirements
    const minTier = giveaway.eligibility?.minTier || 0;
    if ((user.tier || 0) < minTier) {
      const err = new Error(`Requires minimum VIP Tier ${minTier}. Your tier is ${user.tier || 0}.`);
      err.code = 'INSUFFICIENT_TIER';
      err.statusCode = 403;
      throw err;
    }

    if (giveaway.eligibility?.requiresKyc && !user.isKycVerified) {
      const err = new Error('KYC account verification is required to participate in this giveaway.');
      err.code = 'KYC_REQUIRED';
      err.statusCode = 403;
      throw err;
    }

    return true;
  }

  /**
   * Executes the secure, backend-authoritative join flow.
   * Ensures idempotency, balance integrity, and atomic participation creation.
   */
  static async processEntry({ user, giveawayIdentifier, idempotencyKey = null, deviceHash = '', req = {} }) {
    // Step 1: Resolve giveaway & prize
    const giveaway = await this.resolveGiveaway(giveawayIdentifier);
    if (!giveaway) {
      const err = new Error('Giveaway not found.');
      err.code = 'GIVEAWAY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // Step 2: Validate eligibility & lifecycle
    await this.validateEligibility(user, giveaway);

    // Step 3: Fraud & security assessment
    const fraudCheck = await FraudService.evaluateJoinRisk(user.userId, giveaway._id, req);
    if (!fraudCheck.allowed) {
      const err = new Error(fraudCheck.message || 'Participation blocked by security checks.');
      err.code = fraudCheck.code || 'PARTICIPATION_BLOCKED';
      err.statusCode = 403;
      throw err;
    }

    // Step 4: Idempotency pre-check
    if (idempotencyKey) {
      const existingTx = await EntryTransaction.findOne({ idempotencyKey }).lean();
      if (existingTx && existingTx.status === 'SUCCESS') {
        const existingPart = await GiveawayParticipation.findOne({
          userId: user.userId,
          giveawayId: giveaway._id,
        }).lean();

        const currentBalances = await WalletService.getBalances(user.userId);

        return {
          participationId: existingPart?._id || existingTx.participationId,
          giveawayId: giveaway._id,
          giveawaySlug: giveaway.slug,
          giveawayTitle: giveaway.title,
          prizeName: giveaway.prizeId?.name || giveaway.title,
          entryAmount: existingTx.amount,
          entryCurrency: existingTx.currency,
          remainingBalance: currentBalances[existingTx.currency] ?? 0,
          transactionRef: existingTx.transactionRef,
          joinedAt: existingPart?.joinedAt || existingTx.createdAt,
          isIdempotentReplay: true,
        };
      }
    }

    // Step 5: Duplicate participation pre-check
    const existingParticipation = await GiveawayParticipation.findOne({
      userId: user.userId,
      giveawayId: giveaway._id,
    }).lean();

    if (existingParticipation) {
      const err = new Error('You are already participating in this giveaway.');
      err.code = 'ALREADY_PARTICIPATING';
      err.statusCode = 409;
      throw err;
    }

    // Step 6: Determine authoritative currency and amount from DB
    const entryCurrency = giveaway.entryFee.currency;
    const entryAmount = giveaway.entryFee.amount;

    // Step 7: Check authoritative balance
    const balanceCheck = await WalletService.checkBalance(user.userId, entryCurrency, entryAmount);
    if (!balanceCheck.sufficient) {
      const err = new Error(
        `Insufficient ${entryCurrency} balance. Required: ${entryAmount} ${entryCurrency}, Available: ${balanceCheck.currentBalance} ${entryCurrency}.`
      );
      err.code = `INSUFFICIENT_${entryCurrency.toUpperCase()}_BALANCE`;
      err.statusCode = 400;
      throw err;
    }

    // Step 8: Execution with Multi-Document ACID Transaction or Safe Atomic Fallback
    const txRef = this.generateTransactionRef();
    const topologyType = mongoose.connection.client?.topology?.description?.type;
    const isReplicaSet = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';

    const alreadyParticipatingError = () => {
      const err = new Error('You are already participating in this giveaway.');
      err.code = 'ALREADY_PARTICIPATING';
      err.statusCode = 409;
      return err;
    };

    const assertNotAlreadyParticipating = async () => {
      const existing = await GiveawayParticipation.findOne({
        userId: user.userId,
        giveawayId: giveaway._id,
      }).lean();
      if (existing) {
        throw alreadyParticipatingError();
      }
    };

    let session = null;
    if (isReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch {
        if (session) {
          await session.endSession().catch(() => {});
          session = null;
        }
      }
    }

    if (isReplicaSet && session) {
      const MAX_TX_RETRIES = getMaxTransactionRetries();
      for (let attempt = 0; attempt < MAX_TX_RETRIES; attempt += 1) {
        try {
          if (attempt > 0) {
            // Re-assert duplicate/balance guards on retry. All writes from the
            // aborted attempt were rolled back, so the retry can never
            // double-deduct a balance.
            await assertNotAlreadyParticipating();
            const retryBalanceCheck = await WalletService.checkBalance(
              user.userId,
              entryCurrency,
              entryAmount
            );
            if (!retryBalanceCheck.sufficient) {
              const err = new Error(
                `Insufficient ${entryCurrency} balance. Required: ${entryAmount} ${entryCurrency}, Available: ${retryBalanceCheck.currentBalance} ${entryCurrency}.`
              );
              err.code = `INSUFFICIENT_${entryCurrency.toUpperCase()}_BALANCE`;
              err.statusCode = 400;
              throw err;
            }
            // A fresh, clean transaction for retry.
            session = await mongoose.startSession();
            session.startTransaction();
          }

          // 1. Deduct balance in transaction
          const deduction = await WalletService.deductBalance(
            user.userId,
            entryCurrency,
            entryAmount,
            session
          );

          // 2. Create entry transaction
          const [entryTx] = await EntryTransaction.create(
            [
              {
                giveawayId: giveaway._id,
                userId: user.userId,
                currency: entryCurrency,
                amount: entryAmount,
                ...(idempotencyKey ? { idempotencyKey } : {}),
                status: 'SUCCESS',
                transactionRef: txRef,
                metadata: { deviceHash, ipAddress: req.ip || '' },
              },
            ],
            { session }
          );

          // 3. Create participation
          const [participation] = await GiveawayParticipation.create(
            [
              {
                userId: user.userId,
                giveawayId: giveaway._id,
                prizeId: giveaway.prizeId?._id || giveaway.prizeId,
                entryCurrency,
                entryAmount,
                deviceHash,
                status: 'CONFIRMED',
                transactionId: entryTx._id,
              },
            ],
            { session }
          );

          // Update transaction with participationId
          entryTx.participationId = participation._id;
          await entryTx.save({ session });

          // 4. Increment participant count
          await Giveaway.findByIdAndUpdate(
            giveaway._id,
            { $inc: { participantCount: 1 } },
            { session }
          );

          // 5. Create audit log
          await AuditLog.create(
            [
              {
                action: 'GIVEAWAY_ENTRY',
                entityType: 'GiveawayParticipation',
                entityId: participation._id.toString(),
                actorId: user.userId,
                newState: {
                  giveawayId: giveaway._id,
                  entryAmount,
                  entryCurrency,
                  transactionRef: txRef,
                },
                ipAddress: req.ip || '',
              },
            ],
            { session }
          );

          await session.commitTransaction();
          await session.endSession();
          session = null;

          return {
            participationId: participation._id,
            giveawayId: giveaway._id,
            giveawaySlug: giveaway.slug,
            giveawayTitle: giveaway.title,
            prizeName: giveaway.prizeId?.name || giveaway.title,
            entryAmount,
            entryCurrency,
            remainingBalance: deduction.remainingBalance,
            transactionRef: txRef,
            joinedAt: participation.joinedAt,
            isIdempotentReplay: false,
          };
        } catch (error) {
          if (session) {
            await session.abortTransaction().catch(() => {});
            await session.endSession().catch(() => {});
            session = null;
          }

          if (error.code === 11000) {
            throw alreadyParticipatingError();
          }

          if (isTransientTransactionError(error) && attempt < MAX_TX_RETRIES - 1) {
            // Retry: the losing request resolves cleanly on the next attempt.
            continue;
          }

          // Final race sweep: the winning concurrent request may have committed
          // between the last failed attempt and now — surface the definitive outcome.
          const settledRace = await GiveawayParticipation.findOne({
            userId: user.userId,
            giveawayId: giveaway._id,
          }).lean();
          if (settledRace) {
            throw alreadyParticipatingError();
          }

          if (isTransientTransactionError(error)) {
            const conflictErr = new Error(
              'Concurrent write conflict while confirming participation. Please try again.'
            );
            conflictErr.code = 'CONCURRENT_WRITE_CONFLICT';
            conflictErr.statusCode = 409;
            throw conflictErr;
          }
          throw error;
        }
      }
    } else {
      // Safe Standalone MongoDB Atomic Fallback
      // Invariant: Deduct balance conditionally first. If duplicate key error occurs on participation, refund immediately.
      let deduction = null;
      let participation = null;
      let entryTx = null;

      try {
        // 1. Atomic conditional deduction
        deduction = await WalletService.deductBalance(user.userId, entryCurrency, entryAmount);

        // 2. Create participation (Guarded by unique index { userId: 1, giveawayId: 1 })
        participation = await GiveawayParticipation.create({
          userId: user.userId,
          giveawayId: giveaway._id,
          prizeId: giveaway.prizeId?._id || giveaway.prizeId,
          entryCurrency,
          entryAmount,
          deviceHash,
          status: 'CONFIRMED',
        });

        // 3. Create entry transaction
        entryTx = await EntryTransaction.create({
          giveawayId: giveaway._id,
          userId: user.userId,
          participationId: participation._id,
          currency: entryCurrency,
          amount: entryAmount,
          ...(idempotencyKey ? { idempotencyKey } : {}),
          status: 'SUCCESS',
          transactionRef: txRef,
          metadata: { deviceHash, ipAddress: req.ip || '' },
        });

        // Link transaction to participation
        participation.transactionId = entryTx._id;
        await participation.save();

        // 4. Increment participant count
        await Giveaway.findByIdAndUpdate(giveaway._id, { $inc: { participantCount: 1 } });

        // 5. Create audit log
        await AuditLog.create({
          action: 'GIVEAWAY_ENTRY',
          entityType: 'GiveawayParticipation',
          entityId: participation._id.toString(),
          actorId: user.userId,
          newState: {
            giveawayId: giveaway._id,
            entryAmount,
            entryCurrency,
            transactionRef: txRef,
          },
          ipAddress: req.ip || '',
        });

        return {
          participationId: participation._id,
          giveawayId: giveaway._id,
          giveawaySlug: giveaway.slug,
          giveawayTitle: giveaway.title,
          prizeName: giveaway.prizeId?.name || giveaway.title,
          entryAmount,
          entryCurrency,
          remainingBalance: deduction.remainingBalance,
          transactionRef: txRef,
          joinedAt: participation.joinedAt,
          isIdempotentReplay: false,
        };
      } catch (error) {
        // If participation failed due to duplicate key, rollback/refund the deducted balance
        if (deduction && !participation) {
          await WalletService.creditBalance(user.userId, entryCurrency, entryAmount);
        }

        if (error.code === 11000) {
          const err = new Error('You are already participating in this giveaway.');
          err.code = 'ALREADY_PARTICIPATING';
          err.statusCode = 409;
          throw err;
        }
        throw error;
      }
    }
  }

  /**
   * Retrieves a user's participation status for a given giveaway
   */
  static async getParticipationStatus(userId, giveawayIdentifier) {
    const giveaway = await this.resolveGiveaway(giveawayIdentifier);
    if (!giveaway) {
      const err = new Error('Giveaway not found.');
      err.code = 'GIVEAWAY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (!userId) {
      return {
        userState: 'VISITOR',
        isParticipating: false,
        entryCount: 0,
        joinedAt: null,
      };
    }

    const participation = await GiveawayParticipation.findOne({
      userId,
      giveawayId: giveaway._id,
    })
      .populate('transactionId')
      .lean();

    if (!participation) {
      return {
        userState: 'LOGGED_IN_NOT_PARTICIPATING',
        isParticipating: false,
        entryCount: 0,
        joinedAt: null,
      };
    }

    return {
      userState: 'PARTICIPANT',
      isParticipating: true,
      entryCount: 1,
      joinedAt: participation.joinedAt,
      participationId: participation._id,
      transactionRef: participation.transactionId?.transactionRef || null,
      entryCurrency: participation.entryCurrency,
      entryAmount: participation.entryAmount,
    };
  }
}

export default GiveawayEngine;
