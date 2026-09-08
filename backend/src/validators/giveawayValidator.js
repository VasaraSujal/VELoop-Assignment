/**
 * Giveaway Request Validator Middleware
 * Sanitizes and validates request parameters while ensuring client-supplied
 * sensitive values (amount, currency, userId, prizeId) are ignored/blocked.
 */

export const validateJoinRequest = (req, res, next) => {
  const giveawayIdentifier = req.params.id || req.body.giveawayId;

  if (!giveawayIdentifier || typeof giveawayIdentifier !== 'string' || !giveawayIdentifier.trim()) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      message: 'A valid giveaway ID or slug is required to join.',
    });
  }

  // Sanitize idempotency key if provided
  if (req.body.idempotencyKey) {
    if (typeof req.body.idempotencyKey !== 'string' || req.body.idempotencyKey.length > 128) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Idempotency key must be a valid string under 128 characters.',
      });
    }
    req.body.idempotencyKey = req.body.idempotencyKey.trim();
  }

  // Enforce security rule: strip any client-supplied financial/identity fields
  // The backend determines these values authoritatively from the database.
  delete req.body.userId;
  delete req.body.amount;
  delete req.body.currency;
  delete req.body.prizeId;
  delete req.body.balance;
  delete req.body.status;

  next();
};

export const validateLookupIdentifier = (req, res, next) => {
  const identifier = req.params.id || req.params.slug;
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_IDENTIFIER',
      message: 'A valid giveaway identifier is required.',
    });
  }
  next();
};

export default { validateJoinRequest, validateLookupIdentifier };
