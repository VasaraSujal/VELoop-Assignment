import { sendNotImplemented } from '../utils/responseHelper.js';

/**
 * Controller placeholders for upcoming giveaway lifecycle endpoints.
 * In Phase 0, all endpoints explicitly return HTTP 501 Not Implemented.
 */

export const getCurrentGiveaways = (req, res) => {
  return sendNotImplemented(res, 'GET /api/giveaways/current');
};

export const getGiveawayBySlug = (req, res) => {
  return sendNotImplemented(res, `GET /api/giveaways/${req.params.slug || ':slug'}`);
};

export const getPreviousGiveaways = (req, res) => {
  return sendNotImplemented(res, 'GET /api/giveaways/previous');
};

export const getMyStatus = (req, res) => {
  return sendNotImplemented(res, `GET /api/giveaways/${req.params.id || ':id'}/my-status`);
};

export const joinGiveaway = (req, res) => {
  return sendNotImplemented(res, `POST /api/giveaways/${req.params.id || ':id'}/join`);
};

export const getWinners = (req, res) => {
  return sendNotImplemented(res, `GET /api/giveaways/${req.params.id || ':id'}/winners`);
};

export const submitPrizeClaim = (req, res) => {
  return sendNotImplemented(res, `POST /api/giveaways/${req.params.id || ':id'}/claim`);
};

export const getMyClaim = (req, res) => {
  return sendNotImplemented(res, `GET /api/giveaways/${req.params.id || ':id'}/my-claim`);
};
