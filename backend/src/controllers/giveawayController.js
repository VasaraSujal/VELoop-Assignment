import Giveaway from '../models/Giveaway.js';
import Winner from '../models/Winner.js';
import { GiveawayEngine } from '../services/giveawayEngine.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Format Giveaway document for API presentation
 */
const formatGiveaway = (gw) => {
  const prize = gw.prizeId || {};
  return {
    id: gw._id.toString(),
    _id: gw._id.toString(),
    slug: gw.slug,
    title: gw.title,
    description: gw.description,
    prize: prize.name || gw.title,
    prizeType: prize.type || 'PHYSICAL',
    prizeImage: prize.imageUrl || '/assets/prizes/iphone-15-pro.png',
    retailValueInr: prize.retailValueInr || 0,
    specifications: prize.specifications || {},
    entry: {
      currency: gw.entryFee?.currency || 'VEs',
      amount: gw.entryFee?.amount || 0,
    },
    entryFee: gw.entryFee,
    status: gw.status,
    startsAt: gw.startsAt,
    endsAt: gw.endsAt,
    winnerCount: gw.winnerCount,
    participantCount: gw.participantCount,
    isFeatured: Boolean(gw.isFeatured),
    eligibility: gw.eligibility || { minTier: 0, requiresKyc: false, description: '' },
    terms: gw.terms || '',
    claimType: gw.claimType,
    createdAt: gw.createdAt,
    updatedAt: gw.updatedAt,
  };
};

/**
 * GET /api/giveaways/current
 * Retrieves all currently active and upcoming giveaways
 */
export const getCurrentGiveaways = async (req, res) => {
  try {
    const list = await Giveaway.find({
      status: { $in: ['ACTIVE', 'UPCOMING'] },
    })
      .populate('prizeId')
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    const formatted = list.map(formatGiveaway);
    return sendSuccess(res, 200, 'Current giveaways retrieved', formatted);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve current giveaways');
  }
};

/**
 * GET /api/giveaways/previous
 * Retrieves past / completed giveaways
 */
export const getPreviousGiveaways = async (req, res) => {
  try {
    const list = await Giveaway.find({
      status: { $in: ['ENDED', 'COMPLETED', 'ARCHIVED'] },
    })
      .populate('prizeId')
      .sort({ endsAt: -1 })
      .lean();

    const formatted = list.map(formatGiveaway);
    return sendSuccess(res, 200, 'Previous giveaways retrieved', formatted);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve previous giveaways');
  }
};

/**
 * GET /api/giveaways/stats
 * Platform aggregate statistics
 */
export const getGiveawayStats = async (req, res) => {
  try {
    const activeCount = await Giveaway.countDocuments({ status: 'ACTIVE' });
    const aggregateResult = await Giveaway.aggregate([
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: '$participantCount' },
          totalWinners: { $sum: '$winnerCount' },
        },
      },
    ]);

    const prizeValueResult = await Giveaway.aggregate([
      {
        $lookup: {
          from: 'prizes',
          localField: 'prizeId',
          foreignField: '_id',
          as: 'prize',
        },
      },
      { $unwind: { path: '$prize', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalRetailValue: { $sum: '$prize.retailValueInr' },
        },
      },
    ]);

    const totalWinnersCount = await Winner.countDocuments();

    const stats = {
      activeGiveawaysCount: activeCount,
      totalParticipants: aggregateResult[0]?.totalParticipants || 0,
      totalWinners: (aggregateResult[0]?.totalWinners || 0) + totalWinnersCount,
      totalRetailValue: prizeValueResult[0]?.totalRetailValue || 0,
    };

    return sendSuccess(res, 200, 'Giveaway platform statistics', stats);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to calculate stats');
  }
};

/**
 * GET /api/giveaways/:idOrSlug
 * Retrieves individual giveaway details by slug or ID
 */
export const getGiveawayBySlug = async (req, res) => {
  try {
    const identifier = req.params.slug || req.params.id;
    const giveaway = await GiveawayEngine.resolveGiveaway(identifier);

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        code: 'GIVEAWAY_NOT_FOUND',
        message: `Giveaway '${identifier}' not found.`,
      });
    }

    return sendSuccess(res, 200, 'Giveaway details retrieved', formatGiveaway(giveaway));
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve giveaway');
  }
};

/**
 * GET /api/giveaways/:id/my-status
 * Authenticated participation status check for the current user
 */
export const getMyStatus = async (req, res) => {
  try {
    const identifier = req.params.id;
    const status = await GiveawayEngine.getParticipationStatus(req.user.userId, identifier);
    return sendSuccess(res, 200, 'Participation status retrieved', status);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: error.code || 'STATUS_LOOKUP_ERROR',
      message: error.message || 'Failed to retrieve participation status',
    });
  }
};

/**
 * POST /api/giveaways/:id/join
 * Authenticated atomic join flow
 */
export const joinGiveaway = async (req, res) => {
  try {
    const identifier = req.params.id || req.body.giveawayId;
    const idempotencyKey = req.body.idempotencyKey || req.headers['x-idempotency-key'] || null;
    const deviceHash = req.body.deviceHash || '';

    const result = await GiveawayEngine.processEntry({
      user: req.user,
      giveawayIdentifier: identifier,
      idempotencyKey,
      deviceHash,
      req,
    });

    return res.status(200).json({
      success: true,
      message: result.isIdempotentReplay
        ? 'Participation already recorded (Idempotent response).'
        : "You're in! Participation confirmed.",
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.code === 'ALREADY_PARTICIPATING' ? 409 : 400);
    return res.status(statusCode).json({
      success: false,
      code: error.code || 'JOIN_FAILED',
      message: error.message || 'Failed to join giveaway',
    });
  }
};

/**
 * GET /api/giveaways/winners/recent
 */
export const getRecentWinners = async (req, res) => {
  try {
    const list = await Winner.find({ isRecent: true })
      .populate('prizeId')
      .sort({ drawnAt: -1 })
      .lean();

    const formatted = list.map((w) => ({
      id: w._id.toString(),
      giveawayId: w.giveawayId?.toString(),
      giveawayTitle: w.prizeName || 'VELOOP Giveaway Pool',
      prize: w.prizeName || w.prizeId?.name || 'Prize',
      prizeType: w.prizeId?.type || 'PHYSICAL',
      prizeImage: w.prizeId?.imageUrl || '/assets/prizes/iphone-15-pro.png',
      maskedUserId: w.maskedUserId,
      maskedPhone: w.maskedPhone,
      userHandle: w.userHandle,
      drawDate: w.drawnAt,
      claimStatus: w.claimStatus,
      statusLabel: w.statusLabel,
      entryFeePaid: w.entryFeePaid,
      txHash: w.txHash,
      isRecent: true,
    }));

    return sendSuccess(res, 200, 'Recent winners retrieved', formatted);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve recent winners');
  }
};

/**
 * GET /api/giveaways/winners/previous
 */
export const getPreviousWinners = async (req, res) => {
  try {
    const list = await Winner.find({ isRecent: false })
      .populate('prizeId')
      .sort({ drawnAt: -1 })
      .lean();

    const formatted = list.map((w) => ({
      id: w._id.toString(),
      giveawayId: w.giveawayId?.toString(),
      giveawayTitle: w.prizeName || 'VELOOP Giveaway Pool',
      prize: w.prizeName || w.prizeId?.name || 'Prize',
      prizeType: w.prizeId?.type || 'PHYSICAL',
      prizeImage: w.prizeId?.imageUrl || '/assets/prizes/iphone-15-pro.png',
      maskedUserId: w.maskedUserId,
      maskedPhone: w.maskedPhone,
      userHandle: w.userHandle,
      drawDate: w.drawnAt,
      claimStatus: w.claimStatus,
      statusLabel: w.statusLabel,
      entryFeePaid: w.entryFeePaid,
      txHash: w.txHash,
      isRecent: false,
    }));

    return sendSuccess(res, 200, 'Previous winners retrieved', formatted);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve previous winners');
  }
};

/**
 * GET /api/giveaways/winners (all winners)
 */
export const getAllWinners = async (req, res) => {
  try {
    const list = await Winner.find({})
      .populate('prizeId')
      .sort({ drawnAt: -1 })
      .lean();

    const formatted = list.map((w) => ({
      id: w._id.toString(),
      giveawayId: w.giveawayId?.toString(),
      giveawayTitle: w.prizeName || 'VELOOP Giveaway Pool',
      prize: w.prizeName || w.prizeId?.name || 'Prize',
      prizeType: w.prizeId?.type || 'PHYSICAL',
      prizeImage: w.prizeId?.imageUrl || '/assets/prizes/iphone-15-pro.png',
      maskedUserId: w.maskedUserId,
      maskedPhone: w.maskedPhone,
      userHandle: w.userHandle,
      drawDate: w.drawnAt,
      claimStatus: w.claimStatus,
      statusLabel: w.statusLabel,
      entryFeePaid: w.entryFeePaid,
      txHash: w.txHash,
      isRecent: w.isRecent,
    }));

    return sendSuccess(res, 200, 'All winners retrieved', formatted);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve all winners');
  }
};

/**
 * GET /api/giveaways/:id/winners
 */
export const getWinners = async (req, res) => {
  try {
    const giveaway = await GiveawayEngine.resolveGiveaway(req.params.id);
    if (!giveaway) {
      return res.status(404).json({
        success: false,
        code: 'GIVEAWAY_NOT_FOUND',
        message: 'Giveaway not found',
      });
    }

    const list = await Winner.find({ giveawayId: giveaway._id }).populate('prizeId').lean();
    return sendSuccess(res, 200, 'Giveaway winners retrieved', list);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve winners');
  }
};

export default {
  getCurrentGiveaways,
  getPreviousGiveaways,
  getGiveawayStats,
  getGiveawayBySlug,
  getMyStatus,
  joinGiveaway,
  getRecentWinners,
  getPreviousWinners,
  getAllWinners,
  getWinners,
};
