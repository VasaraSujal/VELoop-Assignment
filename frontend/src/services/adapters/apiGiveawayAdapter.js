import { apiClient } from '../apiClient.js';

/**
 * REST API Giveaway Adapter
 * Connects frontend directly to the authoritative Express/MongoDB backend.
 */
export const apiGiveawayAdapter = {
  async getCurrentGiveaways() {
    return apiClient.get('/giveaways/current');
  },

  async getFeaturedGiveaway() {
    const list = await this.getCurrentGiveaways();
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.find((g) => g.isFeatured) || list[0];
  },

  async getCurrentGiveaway() {
    return this.getFeaturedGiveaway();
  },

  async getGiveawayBySlug(slug) {
    return apiClient.get(`/giveaways/${slug}`);
  },

  async getRecentWinners() {
    return apiClient.get('/giveaways/winners/recent');
  },

  async getPreviousWinners() {
    return apiClient.get('/giveaways/winners/previous');
  },

  async getAllWinners() {
    return apiClient.get('/giveaways/winners');
  },

  async getGiveawayStats() {
    return apiClient.get('/giveaways/stats');
  },

  async getPreviousGiveaways() {
    return apiClient.get('/giveaways/previous');
  },

  async getMyParticipation(giveawayId) {
    return apiClient.get(`/giveaways/${giveawayId}/my-status`);
  },

  async joinGiveaway(giveawayId, idempotencyKey = null) {
    return apiClient.post(`/giveaways/${giveawayId}/join`, {
      idempotencyKey,
    });
  },

  async getWinners(giveawayId) {
    return apiClient.get(`/giveaways/${giveawayId}/winners`);
  },

  async submitPrizeClaim(giveawayId, claimData) {
    return apiClient.post(`/giveaways/${giveawayId}/claim`, claimData);
  },

  async getMyClaim(giveawayId) {
    return apiClient.get(`/giveaways/${giveawayId}/my-claim`);
  },

  // Auth & Profile API helpers
  async getMe() {
    return apiClient.get('/auth/me');
  },

  async demoLogin(userId) {
    return apiClient.post('/auth/demo-login', { userId });
  },

  async getDemoUsers() {
    return apiClient.get('/auth/users');
  },
};

export default apiGiveawayAdapter;
