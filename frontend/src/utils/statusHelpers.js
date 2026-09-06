import { GIVEAWAY_STATUS } from '../data/constants.js';

/**
 * Returns metadata (label, text color, and light subtle background) for a given giveaway status
 */
export const getStatusBadgeInfo = (status) => {
  switch (status) {
    case GIVEAWAY_STATUS.ACTIVE:
      return {
        label: 'Live Now',
        colorVar: 'var(--status-active)',
        bgVar: 'var(--status-active-bg)',
      };
    case GIVEAWAY_STATUS.UPCOMING:
      return {
        label: 'Upcoming',
        colorVar: 'var(--status-upcoming)',
        bgVar: 'var(--status-upcoming-bg)',
      };
    case GIVEAWAY_STATUS.ENDED:
      return {
        label: 'Closed',
        colorVar: 'var(--status-ended)',
        bgVar: 'var(--status-ended-bg)',
      };
    case GIVEAWAY_STATUS.COMPLETED:
      return {
        label: 'Completed',
        colorVar: 'var(--status-winner)',
        bgVar: 'var(--status-winner-bg)',
      };
    default:
      return {
        label: status || 'Unknown',
        colorVar: 'var(--color-text-muted)',
        bgVar: 'var(--color-surface-muted)',
      };
  }
};
