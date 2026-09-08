import FraudEvent from '../models/FraudEvent.js';

/**
 * Fraud & Security Boundary Service Foundation (Phase 2)
 * Establishes real-time risk checks and audit recording prior to financial/giveaway operations.
 */
export class FraudService {
  /**
   * Evaluates baseline security and risk signals before allowing giveaway entry
   */
  static async evaluateJoinRisk(userId, giveawayId, req = {}) {
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers?.['user-agent'] || 'unknown';

    // Baseline sanity checks
    if (!userId || typeof userId !== 'string') {
      await this.recordFraudEvent({
        userId: userId || 'unknown',
        giveawayId,
        eventType: 'INVALID_USER_ID',
        riskScore: 90,
        actionTaken: 'BLOCKED',
        ipAddress,
        userAgent,
      });

      return {
        allowed: false,
        code: 'PARTICIPATION_BLOCKED',
        message: 'Security validation failed.',
      };
    }

    return {
      allowed: true,
      riskScore: 0,
    };
  }

  /**
   * Logs a security/fraud event
   */
  static async recordFraudEvent({
    userId,
    giveawayId = null,
    eventType,
    riskScore = 0,
    actionTaken = 'FLAGGED',
    ipAddress = '',
    userAgent = '',
    metadata = {},
  }) {
    try {
      await FraudEvent.create({
        userId,
        giveawayId,
        eventType,
        riskScore,
        actionTaken,
        ipAddress,
        userAgent,
        metadata,
      });
    } catch (err) {
      console.warn(`[FraudService] Failed to record fraud event: ${err.message}`);
    }
  }
}

export default FraudService;
