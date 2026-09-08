import { apiGiveawayAdapter } from './adapters/apiGiveawayAdapter.js';
import { mockGiveawayAdapter } from './adapters/mockGiveawayAdapter.js';

/**
 * Service Configuration:
 * In Phase 2, apiGiveawayAdapter is the default active adapter connecting to the live backend.
 */
const USE_MOCK = false;
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

  async joinGiveaway(giveawayId, idempotencyKey = null) {
    return activeAdapter.joinGiveaway(giveawayId, idempotencyKey);
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

  // Auth delegation
  async getMe() {
    return activeAdapter.getMe();
  },

  async demoLogin(userId) {
    return activeAdapter.demoLogin(userId);
  },

  async getDemoUsers() {
    return activeAdapter.getDemoUsers();
  },
};

export default giveawayService;
