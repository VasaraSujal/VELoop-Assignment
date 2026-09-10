import { apiClient } from '../apiClient.js';
import {
  normalizeWinnerPrizeImage,
  normalizeGiveawayPrizeImage,
  resolvePrizeImage,
} from '../../utils/prizeImageHelper.js';

/**
 * REST API Giveaway Adapter
 * Connects frontend directly to the authoritative Express/MongoDB backend.
 */
export const apiGiveawayAdapter = {
  async getCurrentGiveaways() {
    const list = await apiClient.get('/giveaways/current');
    if (!Array.isArray(list)) return list;
    return list.map(normalizeGiveawayPrizeImage);
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
    const item = await apiClient.get(`/giveaways/${slug}`);
    return normalizeGiveawayPrizeImage(item);
  },

  async getRecentWinners() {
    const list = await apiClient.get('/giveaways/winners/recent');
    if (!Array.isArray(list)) return list;
    return list.map(normalizeWinnerPrizeImage);
  },

  async getPreviousWinners() {
    const list = await apiClient.get('/giveaways/winners/previous');
    if (!Array.isArray(list)) return list;
    return list.map(normalizeWinnerPrizeImage);
  },

  async getAllWinners() {
    const list = await apiClient.get('/giveaways/winners');
    if (!Array.isArray(list)) return list;
    return list.map(normalizeWinnerPrizeImage);
  },

  async getGiveawayStats() {
    return apiClient.get('/giveaways/stats');
  },

  async getPreviousGiveaways() {
    const list = await apiClient.get('/giveaways/previous');
    if (!Array.isArray(list)) return list;
    return list.map(normalizeGiveawayPrizeImage);
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
    const list = await apiClient.get(`/giveaways/${giveawayId}/winners`);
    if (!Array.isArray(list)) return list;
    return list.map(normalizeWinnerPrizeImage);
  },

  async submitPrizeClaim(giveawayId, claimData) {
    return apiClient.post(`/giveaways/${giveawayId}/claim`, claimData);
  },

  async getMyClaim(giveawayId) {
    const res = await apiClient.get(`/giveaways/${giveawayId}/my-claim`);
    if (res && typeof res === 'object') {
      return {
        ...res,
        prizeImage: resolvePrizeImage(res.prizeName, '', res.prizeImage),
      };
    }
    return res;
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

