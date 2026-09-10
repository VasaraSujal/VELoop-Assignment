import { MOCK_GIVEAWAYS, MOCK_WINNERS } from '../../data/giveawayData.js';
import { USER_STATES } from '../../data/constants.js';
import {
  normalizeWinnerPrizeImage,
  normalizeGiveawayPrizeImage,
} from '../../utils/prizeImageHelper.js';

/**
 * Mock Giveaway Adapter
 * Encapsulates all mock data access during frontend development.
 */
export const mockGiveawayAdapter = {
  async getCurrentGiveaways() {
    return Promise.resolve(MOCK_GIVEAWAYS.map(normalizeGiveawayPrizeImage));
  },

  async getFeaturedGiveaway() {
    const list = await this.getCurrentGiveaways();
    const featured = list.find((g) => g.isFeatured) || list[0];
    return Promise.resolve(featured ? { ...featured } : null);
  },

  async getCurrentGiveaway() {
    return this.getFeaturedGiveaway();
  },

  async getGiveawayBySlug(slug) {
    const item = MOCK_GIVEAWAYS.find((g) => g.slug === slug);
    if (!item) {
      const error = new Error(`Giveaway with slug '${slug}' not found.`);
      error.status = 404;
      return Promise.reject(error);
    }
    return Promise.resolve(normalizeGiveawayPrizeImage({ ...item }));
  },

  async getRecentWinners() {
    const recent = MOCK_WINNERS.filter((w) => w.isRecent);
    return Promise.resolve(recent.map(normalizeWinnerPrizeImage));
  },

  async getPreviousWinners() {
    const previous = MOCK_WINNERS.filter((w) => !w.isRecent);
    return Promise.resolve(previous.map(normalizeWinnerPrizeImage));
  },

  async getAllWinners() {
    return Promise.resolve(MOCK_WINNERS.map(normalizeWinnerPrizeImage));
  },

  async getGiveawayStats() {
    const totalParticipants = MOCK_GIVEAWAYS.reduce((sum, g) => sum + (g.participantCount || 0), 0);
    const totalWinners = MOCK_GIVEAWAYS.reduce((sum, g) => sum + (g.winnerCount || 0), 0) + MOCK_WINNERS.length;
    const totalRetailValue = MOCK_GIVEAWAYS.reduce((sum, g) => sum + (g.retailValueInr || 0), 0);

    return Promise.resolve({
      activeGiveawaysCount: MOCK_GIVEAWAYS.length,
      totalParticipants,
      totalWinners,
      totalRetailValue,
    });
  },

  async getPreviousGiveaways() {
    return Promise.resolve([]);
  },

  async getMyParticipation(_giveawayId) {
    return Promise.resolve({
      userState: USER_STATES.VISITOR,
      isParticipating: false,
      entryCount: 0,
      joinedAt: null,
    });
  },

  async joinGiveaway(_giveawayId) {
    return Promise.resolve({
      success: true,
      message: 'Participation recorded in mock state (Demo).',
    });
  },

  async getWinners(giveawayId) {
    const winners = MOCK_WINNERS.filter((w) => w.giveawayId === giveawayId);
    return Promise.resolve(winners.map(normalizeWinnerPrizeImage));
  },

  async submitPrizeClaim(_giveawayId, claimData) {
    return Promise.resolve({
      success: true,
      message: 'Claim submitted in mock state (Demo).',
      claimId: `mock-claim-${Date.now()}`,
      data: claimData,
    });
  },

  async getMyClaim(giveawayId) {
    return Promise.resolve({
      isWinner: false,
      canClaim: false,
      giveawayId,
      claim: null,
      userFacingStatus: 'NOT_SUBMITTED',
      message: 'No winning record found for mock user.',
    });
  },
};

export default mockGiveawayAdapter;

