import { WinnerService } from '../services/winnerService.js';
import { sendSuccess } from '../utils/responseHelper.js';

/**
 * POST /api/admin/giveaways/:id/select-winners
 * Protected admin endpoint to finalize an ended giveaway and draw winners.
 * Integrates directly with WinnerService.
 */
export const selectWinners = async (req, res) => {
  try {
    const { id } = req.params;

    // Security: ignore and strip any client-supplied winner/prize overrides
    delete req.body.userId;
    delete req.body.winnerId;
    delete req.body.prizeId;
    delete req.body.winnerCount;

    const result = await WinnerService.finalizeWinners({
      giveawayIdentifier: id,
      adminUser: req.user,
      req,
    });

    const statusCode = result.isAlreadyFinalized ? 200 : 200;
    return sendSuccess(res, statusCode, result.message, result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: error.code || 'FINALIZATION_FAILED',
      message: error.message || 'Failed to finalize giveaway winners.',
    });
  }
};

export default { selectWinners };

