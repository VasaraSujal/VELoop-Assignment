import { apiClient } from '../apiClient.js';

/**
 * REST API Giveaway Adapter
 * Connects to live backend endpoints in subsequent phases.
 */
export const apiGiveawayAdapter = {
  async getCurrentGiveaways() {
    return apiClient.get('/giveaways/current');
  },

  async getFeaturedGiveaway() {
    const data = await apiClient.get('/giveaways/current');
    return Array.isArray(data) ? data[0] : data;
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

  async joinGiveaway(giveawayId) {
    return apiClient.post(`/giveaways/${giveawayId}/join`);
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
};

export default apiGiveawayAdapter;
