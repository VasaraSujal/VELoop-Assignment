import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Giveaway from '../models/Giveaway.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import UserAccount from '../models/UserAccount.js';
import Winner from '../models/Winner.js';
import AuditLog from '../models/AuditLog.js';
import { isTransientTransactionError, getMaxTransactionRetries } from '../utils/transactionUtils.js';

/**
 * Mask an identifier (email, username, or userId) for privacy-preserving public display.
 * Examples:
 *   "alex@veloop.io" -> "al***@veloop.io"
 *   "user_alex"      -> "us***ex"
 *   "user12345"      -> "us***45"
 */
export const maskUserId = (raw) => {
  if (!raw || typeof raw !== 'string') return 'an***us';
  const trimmed = raw.trim();

  if (trimmed.includes('@')) {
    const [local, domain] = trimmed.split('@');
    if (local.length <= 2) {
      return `${local[0] || '*'}***@${domain}`;
    }
    const visiblePrefix = local.slice(0, 2);
    return `${visiblePrefix}***@${domain}`;
  }

  if (trimmed.length <= 4) {
    return `${trimmed[0]}***`;
  }
  const prefix = trimmed.slice(0, 2);
  const suffix = trimmed.slice(-2);
  return `${prefix}***${suffix}`;
};

/**
 * Mask a phone number for privacy.
 * Example: "+919876543210" -> "+9198****3210" or "9876543210" -> "98****3210"
 */
export const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.length < 8) return '****';
  const prefix = cleaned.slice(0, cleaned.startsWith('+') ? 5 : 2);
  const suffix = cleaned.slice(-4);
  return `${prefix}****${suffix}`;
};

/**
 * Generates an immutable transaction/verification hash for winner draw verification
 */
export const generateDrawTxHash = () => {
  return `0x${crypto.randomBytes(16).toString('hex')}`;
};

/**
 * Cryptographically secure random sample of `k` unique items from an array without replacement
 * Uses Fisher-Yates shuffle driven strictly by Node.js crypto.randomInt (CSPRNG).
 *
 * Selection Method: CRYPTO_RANDOM
 */
export const cryptoSample = (items, count) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const k = Math.min(count, items.length);
  const pool = [...items];

  for (let i = pool.length - 1; i > 0; i--) {
    // Generate cryptographically uniform random index in [0, i]
    const j = crypto.randomInt(0, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, k);
};

/**
 * Formats a winner document for presentation-safe public responses.
 * Strictly omits sensitive contact, identity, and claim information.
 */
export const formatPublicWinner = (w) => {
  const prize = w.prizeId && typeof w.prizeId === 'object' ? w.prizeId : {};
  return {
    id: w._id ? w._id.toString() : '',
    giveawayId: w.giveawayId ? (w.giveawayId._id || w.giveawayId).toString() : '',
    giveawayTitle: w.giveawayId?.title || w.prizeName || 'VELOOP Giveaway Pool',
    prize: w.prizeName || prize.name || 'Prize',
    prizeType: prize.type || 'PHYSICAL',
    prizeImage: prize.imageUrl || '/assets/prizes/iphone-15-pro.png',
    maskedUserId: w.maskedUserId || maskUserId(w.userId),
    userHandle: w.userHandle || 'Participant',
    rank: w.rank || 1,
    drawDate: w.drawnAt || w.createdAt,
    claimStatus: w.claimStatus || 'UNCLAIMED',
    statusLabel: w.statusLabel || 'Pending Claim',
    entryFeePaid: w.entryFeePaid || '',
    txHash: w.txHash || '',
    isRecent: Boolean(w.isRecent),
  };
};

/**
 * Winner Finalization Service
 * Handles backend-authoritative winner drawing, validation, and lifecycle transition.
 */
export class WinnerService {
  /**
   * Authoritative winner finalization entrypoint.
   * Only accessible by authorized administrators.
   */
  static async finalizeWinners({ giveawayIdentifier, adminUser, req = {} }) {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      const err = new Error('Administrative authorization required to finalize winners.');
      err.code = 'ADMIN_REQUIRED';
      err.statusCode = 403;
      throw err;
    }

    const cleanId = giveawayIdentifier
      ? typeof giveawayIdentifier === 'string'
        ? giveawayIdentifier.trim()
        : giveawayIdentifier.toString()
      : '';

    if (!cleanId) {
      const err = new Error('A valid giveaway identifier is required.');
      err.code = 'INVALID_REQUEST';
      err.statusCode = 400;
      throw err;
    }

    // 1. Resolve Giveaway by ID or Slug
    let giveaway = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      giveaway = await Giveaway.findById(cleanId).populate('prizeId');
    }
    if (!giveaway) {
      giveaway = await Giveaway.findOne({ slug: cleanId.toLowerCase() }).populate('prizeId');
    }

    if (!giveaway) {
      const err = new Error(`Giveaway '${cleanId}' not found.`);
      err.code = 'GIVEAWAY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 2. Validate Giveaway Lifecycle State & Existing Winners
    const existingWinners = await Winner.find({ giveawayId: giveaway._id })
      .populate('prizeId')
      .sort({ rank: 1 })
      .lean();

    if (existingWinners.length > 0) {
      // Self-heal giveaway status if winners were already recorded
      if (giveaway.status !== 'COMPLETED') {
        await Giveaway.findByIdAndUpdate(giveaway._id, { $set: { status: 'COMPLETED' } });
      }
      return {
        isAlreadyFinalized: true,
        giveawayId: giveaway._id.toString(),
        slug: giveaway.slug,
        title: giveaway.title,
        status: 'COMPLETED',
        winnerCount: existingWinners.length,
        winners: existingWinners.map(formatPublicWinner),
        message: 'Winners for this giveaway have already been finalized.',
      };
    }

    if (giveaway.status === 'ACTIVE' || giveaway.status === 'UPCOMING' || giveaway.status === 'DRAFT') {
      const err = new Error(
        `Cannot finalize winners for giveaway with status '${giveaway.status}'. The giveaway must be ENDED.`
      );
      err.code = 'GIVEAWAY_NOT_ENDED';
      err.statusCode = 400;
      throw err;
    }

    if (giveaway.status === 'CANCELLED' || giveaway.status === 'ARCHIVED') {
      const err = new Error(
        `Cannot finalize winners for giveaway with status '${giveaway.status}'.`
      );
      err.code = 'GIVEAWAY_NOT_ELIGIBLE';
      err.statusCode = 400;
      throw err;
    }

    // Note: If giveaway.status === 'COMPLETED' but existingWinners.length === 0,
    // this represents a recovered state from an uncommitted/crashed previous attempt.
    // We allow finalization to proceed and complete winner generation safely.

    // 3. Determine Authoritative Winner Count
    // Decision: Giveaway.winnerCount is the single authoritative source of truth configured for the pool.
    const targetWinnerCount = typeof giveaway.winnerCount === 'number' && giveaway.winnerCount >= 1
      ? giveaway.winnerCount
      : 1;

    // 4. Load Eligible Confirmed Participants
    const participants = await GiveawayParticipation.find({
      giveawayId: giveaway._id,
      status: 'CONFIRMED',
    }).lean();

    if (participants.length === 0) {
      const err = new Error('No eligible participants found in this giveaway pool to select winners from.');
      err.code = 'NO_ELIGIBLE_PARTICIPANTS';
      err.statusCode = 400;
      throw err;
    }

    if (participants.length < targetWinnerCount) {
      const err = new Error(
        `Insufficient participants (${participants.length}) to fulfill configured winner count (${targetWinnerCount}).`
      );
      err.code = 'INSUFFICIENT_PARTICIPANTS';
      err.statusCode = 400;
      throw err;
    }

    // 5. Execute Cryptographically Secure Random Winner Selection
    // Uses Fisher-Yates with crypto.randomInt (CSPRNG)
    const selectedParticipants = cryptoSample(participants, targetWinnerCount);
    const selectedUserIds = selectedParticipants.map((p) => p.userId);

    // Fetch corresponding user accounts for safe masking and display handles
    const userAccounts = await UserAccount.find({ userId: { $in: selectedUserIds } }).lean();
    const userMap = new Map(userAccounts.map((u) => [u.userId, u]));

    const drawDate = new Date();
    const entryFeeText = `${giveaway.entryFee?.amount || 0} ${giveaway.entryFee?.currency || 'VEs'}`;
    const prizeDoc = giveaway.prizeId || {};

    const winnerDocsToCreate = selectedParticipants.map((p, index) => {
      const user = userMap.get(p.userId) || {};
      return {
        giveawayId: giveaway._id,
        userId: p.userId,
        userHandle: user.handle || `user_${p.userId.slice(-4)}`,
        maskedUserId: maskUserId(user.email || p.userId),
        maskedPhone: maskPhone(user.phone || ''),
        prizeId: prizeDoc._id || giveaway.prizeId,
        prizeName: prizeDoc.name || giveaway.title,
        rank: index + 1,
        drawnAt: drawDate,
        claimStatus: 'UNCLAIMED',
        statusLabel: 'Pending Claim',
        entryFeePaid: entryFeeText,
        txHash: generateDrawTxHash(),
        isRecent: true,
      };
    });

    // 6. Transactional State Execution & Race Condition Protection
    const topologyType = mongoose.connection.client?.topology?.description?.type;
    const isReplicaSet = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';

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
            // A fresh, clean transaction for retry. All writes from the aborted
            // attempt were rolled back, so the retry can never duplicate winners.
            session = await mongoose.startSession();
            session.startTransaction();
          }

          // Atomically update giveaway status from ENDED (or COMPLETED in recovery) to COMPLETED
          const updatedGiveaway = await Giveaway.findOneAndUpdate(
            { _id: giveaway._id, status: { $in: ['ENDED', 'COMPLETED'] } },
            { $set: { status: 'COMPLETED' } },
            { session, new: true }
          );

          if (!updatedGiveaway) {
            // Another concurrent admin request finalized this giveaway first
            await session.abortTransaction().catch(() => {});
            await session.endSession().catch(() => {});
            session = null;
            const err = new Error('Winners for this giveaway have already been finalized.');
            err.code = 'WINNERS_ALREADY_FINALIZED';
            err.statusCode = 409;
            throw err;
          }

          // Insert Winner records in transaction.
          // `ordered: true` is required when inserting multiple documents on a session.
          const createdWinners = await Winner.create(winnerDocsToCreate, {
            session,
            ordered: true,
          });

          // Record Audit Log
          await AuditLog.create(
            [
              {
                action: 'WINNER_FINALIZATION',
                entityType: 'Giveaway',
                entityId: giveaway._id.toString(),
                actorId: adminUser.userId,
                previousState: { status: giveaway.status },
                newState: {
                  status: 'COMPLETED',
                  winnerCount: createdWinners.length,
                  selectionMethod: 'CRYPTO_RANDOM',
                },
                metadata: {
                  winnerCount: createdWinners.length,
                  selectionMethod: 'CRYPTO_RANDOM',
                  winnerUserIds: selectedUserIds,
                  totalEligibleParticipants: participants.length,
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
            isAlreadyFinalized: false,
            giveawayId: giveaway._id.toString(),
            slug: giveaway.slug,
            title: giveaway.title,
            status: 'COMPLETED',
            winnerCount: createdWinners.length,
            selectionMethod: 'CRYPTO_RANDOM',
            drawnAt: drawDate,
            winners: createdWinners.map(formatPublicWinner),
            message: `Successfully finalized ${createdWinners.length} winner(s) for '${giveaway.title}'.`,
          };
        } catch (error) {
          if (session) {
            await session.abortTransaction().catch(() => {});
            await session.endSession().catch(() => {});
            session = null;
          }
          if (error.code === 11000) {
            const err = new Error('Winners for this giveaway have already been finalized.');
            err.code = 'WINNERS_ALREADY_FINALIZED';
            err.statusCode = 409;
            throw err;
          }

          if (isTransientTransactionError(error)) {
            // If the winning concurrent request committed while we conflicted,
            // respond idempotently instead of failing with a raw server error.
            const committedWinners = await Winner.find({ giveawayId: giveaway._id })
              .populate('prizeId')
              .sort({ rank: 1 })
              .lean();

            if (committedWinners.length > 0) {
              if (giveaway.status !== 'COMPLETED') {
                await Giveaway.findByIdAndUpdate(giveaway._id, { $set: { status: 'COMPLETED' } });
              }
              return {
                isAlreadyFinalized: true,
                giveawayId: giveaway._id.toString(),
                slug: giveaway.slug,
                title: giveaway.title,
                status: 'COMPLETED',
                winnerCount: committedWinners.length,
                winners: committedWinners.map(formatPublicWinner),
                message: 'Winners for this giveaway have already been finalized.',
              };
            }

            if (attempt < MAX_TX_RETRIES - 1) {
              continue;
            }

            const conflictErr = new Error(
              'Concurrent write conflict while finalizing winners. Please try again.'
            );
            conflictErr.code = 'CONCURRENT_WRITE_CONFLICT';
            conflictErr.statusCode = 409;
            throw conflictErr;
          }

          throw error;
        }
      }
    } else {
      // Standalone MongoDB Development Fallback
      // In standalone mode (no multi-doc transactions), insert Winner records FIRST.
      // Unique compound indexes on Winner ({ giveawayId: 1, rank: 1 } and { giveawayId: 1, userId: 1 })
      // guarantee concurrency safety and prevent duplicate winner draws.
      let createdWinners = null;
      try {
        createdWinners = await Winner.create(winnerDocsToCreate);

        // Transition Giveaway status to COMPLETED after winner records are securely persisted
        await Giveaway.findByIdAndUpdate(giveaway._id, { $set: { status: 'COMPLETED' } });

        await AuditLog.create({
          action: 'WINNER_FINALIZATION',
          entityType: 'Giveaway',
          entityId: giveaway._id.toString(),
          actorId: adminUser.userId,
          previousState: { status: giveaway.status },
          newState: {
            status: 'COMPLETED',
            winnerCount: createdWinners.length,
            selectionMethod: 'CRYPTO_RANDOM',
          },
          metadata: {
            winnerCount: createdWinners.length,
            selectionMethod: 'CRYPTO_RANDOM',
            winnerUserIds: selectedUserIds,
            totalEligibleParticipants: participants.length,
          },
          ipAddress: req.ip || '',
        });

        return {
          isAlreadyFinalized: false,
          giveawayId: giveaway._id.toString(),
          slug: giveaway.slug,
          title: giveaway.title,
          status: 'COMPLETED',
          winnerCount: createdWinners.length,
          selectionMethod: 'CRYPTO_RANDOM',
          drawnAt: drawDate,
          winners: createdWinners.map(formatPublicWinner),
          message: `Successfully finalized ${createdWinners.length} winner(s) for '${giveaway.title}'.`,
        };
      } catch (error) {
        if (error.code === 11000) {
          const err = new Error('Winners for this giveaway have already been finalized.');
          err.code = 'WINNERS_ALREADY_FINALIZED';
          err.statusCode = 409;
          throw err;
        }
        // Note: `Winner.create` uses an ordered bulk insert, and every
        // finalization request for the same giveaway targets the same rank set,
        // so a losing request conflicts on its first document and never writes
        // a partial batch. We therefore do NOT attempt any cleanup here: doing
        // so could delete winners committed by a concurrent successful request.
        throw error;
      }
    }
  }

  /**
   * Retrieves presentation-safe public winners for a given giveaway
   */
  static async getWinnersByGiveaway(giveawayIdentifier) {
    const cleanId = giveawayIdentifier
      ? typeof giveawayIdentifier === 'string'
        ? giveawayIdentifier.trim()
        : giveawayIdentifier.toString()
      : '';

    if (!cleanId) {
      const err = new Error('A valid giveaway identifier is required.');
      err.code = 'INVALID_IDENTIFIER';
      err.statusCode = 400;
      throw err;
    }

    let giveaway = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      giveaway = await Giveaway.findById(cleanId).populate('prizeId');
    }
    if (!giveaway) {
      giveaway = await Giveaway.findOne({ slug: cleanId.toLowerCase() }).populate('prizeId');
    }

    if (!giveaway) {
      const err = new Error(`Giveaway '${cleanId}' not found.`);
      err.code = 'GIVEAWAY_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // If giveaway is active, upcoming, or draft with no finalized winners, return empty winner array
    if (giveaway.status !== 'COMPLETED' && giveaway.status !== 'ARCHIVED') {
      return [];
    }

    const winners = await Winner.find({ giveawayId: giveaway._id })
      .populate('prizeId')
      .sort({ rank: 1 })
      .lean();

    return winners.map((w) =>
      formatPublicWinner({
        ...w,
        giveawayId: giveaway,
      })
    );
  }

  /**
   * Retrieves presentation-safe winners from historical/completed giveaways
   * @param {Object} [options]
   * @param {number} [options.limit=50] Safe bounded default limit
   * @returns {Promise<Array>}
   */
  static async getPreviousWinners({ limit = 50 } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    // Query historical winners (isRecent: false or from completed/archived giveaways)
    let winners = await Winner.find({ isRecent: false })
      .populate('giveawayId')
      .populate('prizeId')
      .sort({ drawnAt: -1 })
      .limit(safeLimit)
      .lean();

    // Fall back to all historical winners if none are marked isRecent: false
    if (winners.length === 0) {
      winners = await Winner.find({})
        .populate('giveawayId')
        .populate('prizeId')
        .sort({ drawnAt: -1 })
        .limit(safeLimit)
        .lean();
    }

    return winners.map(formatPublicWinner);
  }

  /**
   * Retrieves presentation-safe recent winners
   * @param {Object} [options]
   * @param {number} [options.limit=50] Safe bounded default limit
   * @returns {Promise<Array>}
   */
  static async getRecentWinners({ limit = 50 } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    const winners = await Winner.find({ isRecent: true })
      .populate('giveawayId')
      .populate('prizeId')
      .sort({ drawnAt: -1 })
      .limit(safeLimit)
      .lean();

    return winners.map(formatPublicWinner);
  }

  /**
   * Retrieves all presentation-safe public winners
   * @param {Object} [options]
   * @param {number} [options.limit=100] Safe bounded default limit
   * @returns {Promise<Array>}
   */
  static async getAllWinners({ limit = 100 } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);

    const winners = await Winner.find({})
      .populate('giveawayId')
      .populate('prizeId')
      .sort({ drawnAt: -1 })
      .limit(safeLimit)
      .lean();

    return winners.map(formatPublicWinner);
  }
}

export default WinnerService;
