import mongoose from 'mongoose';
import Giveaway from '../models/Giveaway.js';
import Winner from '../models/Winner.js';
import Claim from '../models/Claim.js';
import AuditLog from '../models/AuditLog.js';
import FraudService from './fraudService.js';

// Configurable claim window duration (Default: 14 days)
// Note: Configurable development/demo setting; production policy can be overridden via process.env.CLAIM_WINDOW_DAYS
const DEFAULT_CLAIM_WINDOW_DAYS = 14;

export const getClaimWindowDays = () => {
  const envDays = parseInt(process.env.CLAIM_WINDOW_DAYS, 10);
  return !isNaN(envDays) && envDays > 0 ? envDays : DEFAULT_CLAIM_WINDOW_DAYS;
};

export const getClaimWindowMs = () => getClaimWindowDays() * 24 * 60 * 60 * 1000;

/**
 * Maps Winner claimStatus and Claim operational status into clear user-facing states
 */
export const mapToUserFacingStatus = (winnerClaimStatus, operationalStatus) => {
  if (winnerClaimStatus === 'EXPIRED') return 'EXPIRED';
  if (winnerClaimStatus === 'UNCLAIMED' && !operationalStatus) return 'NOT_SUBMITTED';
  if (operationalStatus === 'DELIVERED' || winnerClaimStatus === 'FULFILLED') return 'COMPLETED';
  if (operationalStatus === 'DISPATCHED') return 'DISPATCHED';
  if (operationalStatus === 'PROCESSING') return 'PROCESSING';
  if (operationalStatus === 'REJECTED') return 'REJECTED';
  return 'SUBMITTED';
};

/**
 * Validates and extracts required fields according to authoritative claim type
 */
export const validateClaimPayload = (claimType, rawData = {}) => {
  if (typeof rawData !== 'object' || rawData === null) {
    const err = new Error('Claim payload must be a valid JSON object.');
    err.code = 'INVALID_CLAIM_DATA';
    err.statusCode = 400;
    throw err;
  }

  if (claimType === 'PHYSICAL_DELIVERY') {
    const fullName = (rawData.fullName || '').trim();
    const phone = (rawData.phone || '').trim();
    const addressLine1 = (rawData.addressLine1 || rawData.address || '').trim();
    const addressLine2 = (rawData.addressLine2 || '').trim();
    const city = (rawData.city || '').trim();
    const state = (rawData.state || '').trim();
    const postalCode = (rawData.postalCode || rawData.pincode || '').trim();
    const email = (rawData.email || '').trim();

    if (!fullName || fullName.length < 2) {
      const err = new Error('Full recipient name is required (minimum 2 characters).');
      err.code = 'INVALID_CLAIM_DATA';
      err.statusCode = 400;
      throw err;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) {
      const err = new Error('A valid contact phone number is required (8-15 digits).');
      err.code = 'INVALID_CLAIM_DATA';
      err.statusCode = 400;
      throw err;
    }

    if (!addressLine1 || addressLine1.length < 5) {
      const err = new Error('A valid delivery address is required (minimum 5 characters).');
      err.code = 'INVALID_CLAIM_DATA';
      err.statusCode = 400;
      throw err;
    }

    if (!city || city.length < 2) {
      const err = new Error('City is required.');
      err.code = 'INVALID_CLAIM_DATA';
      err.statusCode = 400;
      throw err;
    }

    if (!state || state.length < 2) {
      const err = new Error('State / Region is required.');
      err.code = 'INVALID_CLAIM_DATA';
      err.statusCode = 400;
      throw err;
    }

    if (!postalCode || postalCode.length < 3 || postalCode.length > 12) {
      const err = new Error('A valid PIN / postal code is required.');
      err.code = 'INVALID_CLAIM_DATA';
      err.statusCode = 400;
      throw err;
    }

    return {
      fullName,
      phone: cleanPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      email,
    };
  }

  if (claimType === 'GIFT_CARD_CODE' || claimType === 'DIGITAL_CREDIT') {
    const email = (rawData.voucherDeliveryEmail || rawData.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      const err = new Error('A valid email address is required for digital voucher delivery.');
      err.code = 'INVALID_CLAIM_DATA';
      err.statusCode = 400;
      throw err;
    }

    return {
      email,
      voucherDeliveryEmail: email,
    };
  }

  const err = new Error(`Unsupported claim type: ${claimType}`);
  err.code = 'UNSUPPORTED_CLAIM_TYPE';
  err.statusCode = 400;
  throw err;
};

/**
 * Sanitizes claimData projection for the authenticated user
 */
export const sanitizeClaimDataForUser = (claimData = {}) => {
  if (!claimData || typeof claimData !== 'object') return {};
  const res = {};
  if (claimData.fullName) res.fullName = claimData.fullName;
  if (claimData.phone) res.phone = claimData.phone;
  if (claimData.addressLine1) res.addressLine1 = claimData.addressLine1;
  if (claimData.addressLine2) res.addressLine2 = claimData.addressLine2;
  if (claimData.city) res.city = claimData.city;
  if (claimData.state) res.state = claimData.state;
  if (claimData.postalCode) res.postalCode = claimData.postalCode;
  if (claimData.email) res.email = claimData.email;
  if (claimData.voucherDeliveryEmail) res.voucherDeliveryEmail = claimData.voucherDeliveryEmail;
  return res;
};

/**
 * Prize Claim Service
 * Handles authenticated winner verification, claim validation, deadline enforcement,
 * duplicate claim protection, and lifecycle state management.
 */
export class ClaimService {
  /**
   * Submits a secure claim on behalf of the authenticated winner
   */
  static async submitClaim({ user, giveawayIdentifier, claimData = {}, req = {} }) {
    if (!user || !user.userId) {
      const err = new Error('Authentication required to submit prize claim.');
      err.code = 'LOGIN_REQUIRED';
      err.statusCode = 401;
      throw err;
    }

    if (!giveawayIdentifier) {
      const err = new Error('A valid giveaway identifier is required.');
      err.code = 'INVALID_IDENTIFIER';
      err.statusCode = 400;
      throw err;
    }

    const cleanId = typeof giveawayIdentifier === 'string'
      ? giveawayIdentifier.trim()
      : giveawayIdentifier.toString();

    // 1. Resolve Giveaway
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

    // 2. Authoritative Winner Verification (Strictly using req.user.userId)
    const winner = await Winner.findOne({
      giveawayId: giveaway._id,
      userId: user.userId,
    }).populate('prizeId');

    if (!winner) {
      await FraudService.recordFraudEvent({
        userId: user.userId,
        giveawayId: giveaway._id,
        eventType: 'UNAUTHORIZED_CLAIM_ACCESS',
        riskScore: 70,
        actionTaken: 'BLOCKED',
        ipAddress: req.ip || '',
        userAgent: req.headers?.['user-agent'] || '',
        metadata: {
          giveawayId: giveaway._id.toString(),
          reason: 'Non-winner attempted prize claim submission',
        },
      });

      const err = new Error('You are not a registered winner for this giveaway pool.');
      err.code = 'NOT_A_WINNER';
      err.statusCode = 403;
      throw err;
    }

    // 3. Check Deadline & Ineligibility
    const drawnAt = winner.drawnAt || winner.createdAt || new Date();
    const deadline = new Date(new Date(drawnAt).getTime() + getClaimWindowMs());
    const isExpired = winner.claimStatus === 'EXPIRED' || Date.now() > deadline.getTime();

    if (isExpired) {
      if (winner.claimStatus !== 'EXPIRED') {
        await Winner.findByIdAndUpdate(winner._id, {
          $set: { claimStatus: 'EXPIRED', statusLabel: 'Claim Expired' },
        });
      }

      await FraudService.recordFraudEvent({
        userId: user.userId,
        giveawayId: giveaway._id,
        eventType: 'CLAIM_EXPIRED',
        riskScore: 10,
        actionTaken: 'FLAGGED',
        ipAddress: req.ip || '',
        userAgent: req.headers?.['user-agent'] || '',
        metadata: {
          giveawayId: giveaway._id.toString(),
          winnerId: winner._id.toString(),
          drawnAt,
          deadline,
        },
      });

      const err = new Error('The claim window for this prize has expired.');
      err.code = 'CLAIM_EXPIRED';
      err.statusCode = 400;
      throw err;
    }

    // 4. Check for Existing Claim (Idempotent Replay & Crash Recovery)
    const existingClaim = await Claim.findOne({
      giveawayId: giveaway._id,
      userId: user.userId,
    }).lean();

    if (existingClaim) {
      // Self-heal: Synchronize Winner.claimStatus if a previous crash occurred before Winner was updated
      if (winner.claimStatus !== 'CLAIMED' && winner.claimStatus !== 'FULFILLED') {
        await Winner.findByIdAndUpdate(winner._id, {
          $set: {
            claimStatus: 'CLAIMED',
            statusLabel: 'Claim Submitted (Under Review)',
            claimId: existingClaim._id,
          },
        });
        winner.claimStatus = 'CLAIMED';
      }

      return {
        isIdempotentReplay: true,
        claimId: existingClaim._id.toString(),
        giveawayId: giveaway._id.toString(),
        giveawayTitle: giveaway.title,
        prizeName: winner.prizeName || giveaway.title,
        claimType: existingClaim.claimType,
        status: existingClaim.status,
        userFacingStatus: mapToUserFacingStatus(winner.claimStatus, existingClaim.status),
        submittedAt: existingClaim.submittedAt,
        message: 'Claim has already been submitted for this prize pool.',
        claimData: sanitizeClaimDataForUser(existingClaim.claimData),
      };
    }

    // 5. Authoritative Claim Type & Payload Validation
    // Single source of truth is giveaway.claimType
    const authoritativeClaimType = giveaway.claimType || 'PHYSICAL_DELIVERY';

    let validatedClaimData = null;
    try {
      validatedClaimData = validateClaimPayload(authoritativeClaimType, claimData);
    } catch (validationErr) {
      await FraudService.recordFraudEvent({
        userId: user.userId,
        giveawayId: giveaway._id,
        eventType: 'CLAIM_REJECTED',
        riskScore: 15,
        actionTaken: 'BLOCKED',
        ipAddress: req.ip || '',
        userAgent: req.headers?.['user-agent'] || '',
        metadata: {
          giveawayId: giveaway._id.toString(),
          winnerId: winner._id.toString(),
          attemptedClaimType: authoritativeClaimType,
          error: validationErr.message,
        },
      });
      throw validationErr;
    }

    // 6. Transactional State Execution (Session Transaction in ReplicaSet / Safe Fallback in Standalone)
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

    const claimDocToCreate = {
      giveawayId: giveaway._id,
      winnerId: winner._id,
      userId: user.userId,
      claimType: authoritativeClaimType,
      claimData: validatedClaimData,
      status: 'PENDING_REVIEW',
      submittedAt: new Date(),
    };

    if (isReplicaSet && session) {
      try {
        const createdClaims = await Claim.create([claimDocToCreate], { session });
        const claimDoc = createdClaims[0];

        await Winner.findByIdAndUpdate(
          winner._id,
          {
            $set: {
              claimStatus: 'CLAIMED',
              statusLabel: 'Claim Submitted (Under Review)',
              claimId: claimDoc._id,
            },
          },
          { session }
        );

        // Record Audit Log (Omit raw PII: no phone, address, email stored in audit metadata)
        await AuditLog.create(
          [
            {
              action: 'PRIZE_CLAIM_SUBMITTED',
              entityType: 'Claim',
              entityId: claimDoc._id.toString(),
              actorId: user.userId,
              previousState: { claimStatus: winner.claimStatus },
              newState: { claimStatus: 'CLAIMED', status: 'PENDING_REVIEW' },
              metadata: {
                giveawayId: giveaway._id.toString(),
                winnerId: winner._id.toString(),
                claimType: authoritativeClaimType,
                rank: winner.rank,
              },
              ipAddress: req.ip || '',
            },
          ],
          { session }
        );

        await session.commitTransaction();
        await session.endSession();

        return {
          isIdempotentReplay: false,
          claimId: claimDoc._id.toString(),
          giveawayId: giveaway._id.toString(),
          giveawayTitle: giveaway.title,
          prizeName: winner.prizeName || giveaway.title,
          claimType: authoritativeClaimType,
          status: 'PENDING_REVIEW',
          userFacingStatus: 'SUBMITTED',
          submittedAt: claimDoc.submittedAt,
          message: 'Prize claim successfully submitted and queued for verification.',
          claimData: sanitizeClaimDataForUser(validatedClaimData),
        };
      } catch (error) {
        if (session) {
          await session.abortTransaction().catch(() => {});
          await session.endSession().catch(() => {});
        }
        if (error.code === 11000) {
          // Concurrent submission race condition: return existing claim
          const raceClaim = await Claim.findOne({ giveawayId: giveaway._id, userId: user.userId }).lean();
          if (raceClaim) {
            if (winner.claimStatus !== 'CLAIMED' && winner.claimStatus !== 'FULFILLED') {
              await Winner.findByIdAndUpdate(winner._id, {
                $set: {
                  claimStatus: 'CLAIMED',
                  statusLabel: 'Claim Submitted (Under Review)',
                  claimId: raceClaim._id,
                },
              });
              winner.claimStatus = 'CLAIMED';
            }
            return {
              isIdempotentReplay: true,
              claimId: raceClaim._id.toString(),
              giveawayId: giveaway._id.toString(),
              giveawayTitle: giveaway.title,
              prizeName: winner.prizeName || giveaway.title,
              claimType: raceClaim.claimType,
              status: raceClaim.status,
              userFacingStatus: mapToUserFacingStatus(winner.claimStatus, raceClaim.status),
              submittedAt: raceClaim.submittedAt,
              message: 'Claim has already been submitted for this prize pool.',
              claimData: sanitizeClaimDataForUser(raceClaim.claimData),
            };
          }
        }
        throw error;
      }
    } else {
      // Standalone MongoDB Development Fallback
      let createdClaim = null;
      try {
        createdClaim = await Claim.create(claimDocToCreate);

        await Winner.findByIdAndUpdate(winner._id, {
          $set: {
            claimStatus: 'CLAIMED',
            statusLabel: 'Claim Submitted (Under Review)',
            claimId: createdClaim._id,
          },
        });

        // Record Audit Log without PII
        await AuditLog.create({
          action: 'PRIZE_CLAIM_SUBMITTED',
          entityType: 'Claim',
          entityId: createdClaim._id.toString(),
          actorId: user.userId,
          previousState: { claimStatus: winner.claimStatus },
          newState: { claimStatus: 'CLAIMED', status: 'PENDING_REVIEW' },
          metadata: {
            giveawayId: giveaway._id.toString(),
            winnerId: winner._id.toString(),
            claimType: authoritativeClaimType,
            rank: winner.rank,
          },
          ipAddress: req.ip || '',
        });

        return {
          isIdempotentReplay: false,
          claimId: createdClaim._id.toString(),
          giveawayId: giveaway._id.toString(),
          giveawayTitle: giveaway.title,
          prizeName: winner.prizeName || giveaway.title,
          claimType: authoritativeClaimType,
          status: 'PENDING_REVIEW',
          userFacingStatus: 'SUBMITTED',
          submittedAt: createdClaim.submittedAt,
          message: 'Prize claim successfully submitted and queued for verification.',
          claimData: sanitizeClaimDataForUser(validatedClaimData),
        };
      } catch (error) {
        if (error.code === 11000) {
          // Concurrent duplicate claim caught by unique index
          const raceClaim = await Claim.findOne({ giveawayId: giveaway._id, userId: user.userId }).lean();
          if (raceClaim) {
            if (winner.claimStatus !== 'CLAIMED' && winner.claimStatus !== 'FULFILLED') {
              await Winner.findByIdAndUpdate(winner._id, {
                $set: {
                  claimStatus: 'CLAIMED',
                  statusLabel: 'Claim Submitted (Under Review)',
                  claimId: raceClaim._id,
                },
              });
              winner.claimStatus = 'CLAIMED';
            }
            return {
              isIdempotentReplay: true,
              claimId: raceClaim._id.toString(),
              giveawayId: giveaway._id.toString(),
              giveawayTitle: giveaway.title,
              prizeName: winner.prizeName || giveaway.title,
              claimType: raceClaim.claimType,
              status: raceClaim.status,
              userFacingStatus: mapToUserFacingStatus(winner.claimStatus, raceClaim.status),
              submittedAt: raceClaim.submittedAt,
              message: 'Claim has already been submitted for this prize pool.',
              claimData: sanitizeClaimDataForUser(raceClaim.claimData),
            };
          }
        }
        // Cleanup partial write on non-duplicate failure in standalone mode
        if (createdClaim) {
          await Claim.findByIdAndDelete(createdClaim._id).catch(() => {});
        }
        throw error;
      }
    }
  }

  /**
   * Retrieves the authenticated user's claim status and details for a giveaway
   */
  static async getMyClaim({ user, giveawayIdentifier }) {
    if (!user || !user.userId) {
      const err = new Error('Authentication required.');
      err.code = 'LOGIN_REQUIRED';
      err.statusCode = 401;
      throw err;
    }

    if (!giveawayIdentifier) {
      const err = new Error('A valid giveaway identifier is required.');
      err.code = 'INVALID_IDENTIFIER';
      err.statusCode = 400;
      throw err;
    }

    const cleanId = typeof giveawayIdentifier === 'string'
      ? giveawayIdentifier.trim()
      : giveawayIdentifier.toString();

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

    // Authoritative Winner Check
    const winner = await Winner.findOne({
      giveawayId: giveaway._id,
      userId: user.userId,
    }).populate('prizeId');

    if (!winner) {
      return {
        isWinner: false,
        canClaim: false,
        giveawayId: giveaway._id.toString(),
        giveawaySlug: giveaway.slug,
        giveawayTitle: giveaway.title,
        claim: null,
        message: 'No winning record found for the authenticated user.',
      };
    }

    const drawnAt = winner.drawnAt || winner.createdAt || new Date();
    const deadline = new Date(new Date(drawnAt).getTime() + getClaimWindowMs());

    // Check if an existing Claim exists
    const existingClaim = await Claim.findOne({
      giveawayId: giveaway._id,
      userId: user.userId,
    }).lean();

    // If a valid Claim exists, synchronize Winner state (crash recovery) and prevent expiration
    if (existingClaim) {
      if (winner.claimStatus !== 'CLAIMED' && winner.claimStatus !== 'FULFILLED') {
        await Winner.findByIdAndUpdate(winner._id, {
          $set: {
            claimStatus: 'CLAIMED',
            statusLabel: 'Claim Submitted (Under Review)',
            claimId: existingClaim._id,
          },
        });
        winner.claimStatus = 'CLAIMED';
      }
    } else {
      // Only evaluate deadline expiration if no claim has been submitted
      const isExpired = winner.claimStatus === 'EXPIRED' || Date.now() > deadline.getTime();
      if (isExpired && winner.claimStatus !== 'EXPIRED' && winner.claimStatus === 'UNCLAIMED') {
        await Winner.findByIdAndUpdate(winner._id, {
          $set: { claimStatus: 'EXPIRED', statusLabel: 'Claim Expired' },
        });
        winner.claimStatus = 'EXPIRED';
      }
    }

    const isExpired = !existingClaim && (winner.claimStatus === 'EXPIRED' || Date.now() > deadline.getTime());
    const prize = winner.prizeId || giveaway.prizeId || {};

    return {
      isWinner: true,
      canClaim: !isExpired && winner.claimStatus === 'UNCLAIMED' && !existingClaim,
      giveawayId: giveaway._id.toString(),
      giveawaySlug: giveaway.slug,
      giveawayTitle: giveaway.title,
      prizeName: winner.prizeName || prize.name || giveaway.title,
      prizeType: prize.type || giveaway.claimType || 'PHYSICAL',
      prizeImage: prize.imageUrl || '/assets/prizes/iphone-15-pro.png',
      claimType: giveaway.claimType,
      winnerRank: winner.rank,
      drawnAt,
      claimDeadline: deadline,
      isExpired,
      claimStatus: winner.claimStatus,
      fulfillmentStatus: existingClaim?.status || 'NOT_SUBMITTED',
      userFacingStatus: mapToUserFacingStatus(winner.claimStatus, existingClaim?.status),
      claim: existingClaim
        ? {
            id: existingClaim._id.toString(),
            status: existingClaim.status,
            submittedAt: existingClaim.submittedAt,
            trackingNumber: existingClaim.trackingNumber || '',
            courier: existingClaim.courier || '',
            claimData: sanitizeClaimDataForUser(existingClaim.claimData),
          }
        : null,
    };
  }
}

export default ClaimService;
