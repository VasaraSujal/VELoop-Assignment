import { mockGiveawayAdapter } from './adapters/mockGiveawayAdapter.js';
import { apiGiveawayAdapter } from './adapters/apiGiveawayAdapter.js';

/**
 * Service Configuration:
 * In Phase 0 & Phase 1, default adapter is mockGiveawayAdapter.
 * Set to apiGiveawayAdapter when connecting to live backend in Phase 3+.
 */
const USE_MOCK = true;
const activeAdapter = USE_MOCK ? mockGiveawayAdapter : apiGiveawayAdapter;

/**
 * Unified Giveaway Service
 * Used across all UI components. Insulates UI from backend/mock implementation details.
 */
export const giveawayService = {
  async getCurrentGiveaways() {
    return activeAdapter.getCurrentGiveaways();
  },

  async getFeaturedGiveaway() {
    return activeAdapter.getFeaturedGiveaway();
  },

  async getCurrentGiveaway() {
    return activeAdapter.getCurrentGiveaway();
  },

  async getGiveawayBySlug(slug) {
    return activeAdapter.getGiveawayBySlug(slug);
  },

  async getRecentWinners() {
    return activeAdapter.getRecentWinners();
  },

  async getPreviousWinners() {
    return activeAdapter.getPreviousWinners();
  },

  async getAllWinners() {
    return activeAdapter.getAllWinners();
  },

  async getGiveawayStats() {
    return activeAdapter.getGiveawayStats();
  },

  async getPreviousGiveaways() {
    return activeAdapter.getPreviousGiveaways();
  },

  async getMyParticipation(giveawayId) {
    return activeAdapter.getMyParticipation(giveawayId);
  },

  async joinGiveaway(giveawayId) {
    return activeAdapter.joinGiveaway(giveawayId);
  },

  async getWinners(giveawayId) {
    return activeAdapter.getWinners(giveawayId);
  },

  async submitPrizeClaim(giveawayId, claimData) {
    return activeAdapter.submitPrizeClaim(giveawayId, claimData);
  },

  async getMyClaim(giveawayId) {
    return activeAdapter.getMyClaim(giveawayId);
  },
};

export default giveawayService;
