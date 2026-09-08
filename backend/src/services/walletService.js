import UserAccount from '../models/UserAccount.js';

export const SUPPORTED_CURRENCIES = ['VEs', 'SVEs', 'Tokens'];

/**
 * Authoritative Wallet & Balance Service
 * The frontend balance is NEVER trusted. All balance checks, validations,
 * and deductions are handled authoritatively server-side.
 */
export class WalletService {
  /**
   * Retrieves authoritative user balances
   */
  static async getBalances(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const account = await UserAccount.findOne({ userId }, 'balances tier isKycVerified status').lean();
    if (!account) {
      throw new Error(`User account '${userId}' not found`);
    }

    return account.balances || { VEs: 0, SVEs: 0, Tokens: 0 };
  }

  /**
   * Checks if user has sufficient authoritative balance for the given currency
   */
  static async checkBalance(userId, currency, requiredAmount) {
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return {
        sufficient: false,
        currentBalance: 0,
        currency,
        error: `Unsupported currency: ${currency}`,
      };
    }

    const balances = await this.getBalances(userId);
    const currentBalance = balances[currency] || 0;

    return {
      sufficient: currentBalance >= requiredAmount,
      currentBalance,
      currency,
      requiredAmount,
      missingAmount: Math.max(0, requiredAmount - currentBalance),
    };
  }

  /**
   * Atomically deducts currency from user account.
   * Ensures balance cannot drop below zero.
   * Supports optional Mongoose session for multi-document ACID transactions.
   */
  static async deductBalance(userId, currency, amount, session = null) {
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      throw new Error(`Invalid currency: ${currency}`);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error(`Invalid deduction amount: ${amount}`);
    }

    const field = `balances.${currency}`;
    const query = {
      userId,
      [field]: { $gte: amount },
      status: 'ACTIVE',
    };

    const update = {
      $inc: { [field]: -amount },
    };

    const options = {
      new: true,
      runValidators: true,
      ...(session ? { session } : {}),
    };

    const updatedAccount = await UserAccount.findOneAndUpdate(query, update, options);

    if (!updatedAccount) {
      // Find account to provide explicit error reason
      const existingAccount = await UserAccount.findOne({ userId }).lean();
      if (!existingAccount) {
        throw new Error(`User account '${userId}' not found`);
      }
      if (existingAccount.status !== 'ACTIVE') {
        throw new Error(`User account is ${existingAccount.status}`);
      }

      const current = existingAccount.balances?.[currency] || 0;
      const err = new Error(
        `Insufficient ${currency} balance. Current: ${current} ${currency}, required: ${amount} ${currency}`
      );
      err.code = `INSUFFICIENT_${currency.toUpperCase()}_BALANCE`;
      err.statusCode = 400;
      throw err;
    }

    return {
      deductedAmount: amount,
      currency,
      remainingBalance: updatedAccount.balances[currency],
      allBalances: updatedAccount.balances,
    };
  }

  /**
   * Credits currency back to user account (for refunds / compensation if needed)
   */
  static async creditBalance(userId, currency, amount, session = null) {
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      throw new Error(`Invalid currency: ${currency}`);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error(`Invalid credit amount: ${amount}`);
    }

    const field = `balances.${currency}`;
    const query = { userId };
    const update = { $inc: { [field]: amount } };
    const options = { new: true, ...(session ? { session } : {}) };

    const updatedAccount = await UserAccount.findOneAndUpdate(query, update, options);
    return updatedAccount ? updatedAccount.balances : null;
  }
}

export default WalletService;
