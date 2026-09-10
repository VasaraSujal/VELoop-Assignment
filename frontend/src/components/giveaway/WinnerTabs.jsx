import { useState } from 'react';
import { Calendar, Trophy, User, Coins, ShieldCheck } from 'lucide-react';
import { Badge } from '../common/ui/Badge.jsx';
import { EmptyState } from '../common/ui/EmptyState.jsx';
import { Skeleton } from '../common/ui/Skeleton.jsx';
import { resolvePrizeImage } from '../../utils/prizeImageHelper.js';
import styles from './WinnerTabs.module.css';

/**
 * Maps claim and fulfillment status strings to Badge component variants
 */
const getClaimStatusVariant = (status, label) => {
  const s = (status || '').toUpperCase();
  const l = (label || '').toLowerCase();
  if (s === 'DELIVERED' || s === 'FULFILLED' || l.includes('delivered') || l.includes('claimed')) {
    return 'success';
  }
  if (s === 'UNCLAIMED' || s === 'PENDING' || l.includes('pending')) {
    return 'warning';
  }
  if (s === 'SUBMITTED' || s === 'PROCESSING' || s === 'DISPATCHED' || l.includes('processing') || l.includes('submitted')) {
    return 'info';
  }
  if (s === 'EXPIRED' || s === 'REJECTED' || s === 'CANCELLED') {
    return 'danger';
  }
  return 'neutral';
};

/**
 * Formats user-facing status label, ensuring truthful and restrained terminology.
 * Replaces any unsupported "Delivered & Verified" phrases with clean "Delivered".
 */
const formatClaimStatusLabel = (status, label) => {
  const l = (label || '').trim();
  const s = (status || '').toUpperCase();
  if (l === 'Delivered & Verified' || l.toLowerCase().includes('delivered') || s === 'DELIVERED') {
    return 'Delivered';
  }
  return l || status || 'Pending Claim';
};

/**
 * Production-ready Historical Winner Roster with category tabs, desktop table, and mobile card transformation.
 */
export const WinnerTabs = ({ recentWinners = [], previousWinners = [], isLoading = false }) => {
  const [activeTab, setActiveTab] = useState('recent');

  const displayList = activeTab === 'recent' ? recentWinners : previousWinners;

  return (
    <section className={styles.section} aria-label="Winner Roster and History">
      <div className={styles.container}>
        {/* Section Intro Header */}
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <span className={styles.sectionBadge}>Winner Roster</span>
            <h2 className={styles.sectionTitle}>Historical Winners</h2>
            <p className={styles.sectionSubtitle}>
              Browse previous giveaway winners and their current claim statuses.
            </p>
          </div>

          {/* Tab Selection */}
          <div className={styles.tabsNav} role="tablist" aria-label="Winner History Tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'recent'}
              className={`${styles.tabBtn} ${activeTab === 'recent' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('recent')}
            >
              Recent Draws <span className={styles.tabCount}>({recentWinners.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'previous'}
              className={`${styles.tabBtn} ${activeTab === 'previous' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('previous')}
            >
              Archived Winners <span className={styles.tabCount}>({previousWinners.length})</span>
            </button>
          </div>
        </div>

        {/* Loading State Skeletons */}
        {isLoading ? (
          <div className={styles.skeletonWrapper} aria-hidden="true">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={styles.skeletonRow}>
                <Skeleton variant="rect" width={44} height={44} borderRadius="var(--radius-sm)" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Skeleton variant="text" width="60%" height={18} />
                  <Skeleton variant="text" width="30%" height={14} />
                </div>
                <Skeleton variant="text" width="15%" height={18} />
                <Skeleton variant="text" width="15%" height={18} />
                <Skeleton variant="rect" width={90} height={24} borderRadius="var(--radius-full)" />
              </div>
            ))}
          </div>
        ) : displayList.length > 0 ? (
          <>
            {/* 1. Desktop Structured Table (Hidden on Mobile) */}
            <div className={styles.desktopTableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Prize / Pool</th>
                    <th className={styles.th}>Winner (Masked)</th>
                    <th className={styles.th}>Draw Date</th>
                    <th className={styles.th}>Entry Cost</th>
                    <th className={styles.th}>Claim Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((winner) => {
                    const drawDateFormatted = winner.drawDate
                      ? new Date(winner.drawDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Completed';

                    const statusLabel = formatClaimStatusLabel(winner.claimStatus, winner.statusLabel);
                    const statusVariant = getClaimStatusVariant(winner.claimStatus, statusLabel);
                    const resolvedImage = resolvePrizeImage(winner.prize, winner.giveawayTitle, winner.prizeImage);

                    return (
                      <tr key={winner.id} className={styles.tr}>
                        {/* Prize & Pool Name */}
                        <td className={styles.td}>
                          <div className={styles.prizeCell}>
                            <div className={styles.thumbWrapper}>
                              <img
                                src={resolvedImage}
                                alt={winner.prize}
                                className={styles.prizeThumb}
                                loading="lazy"
                              />
                            </div>
                            <div className={styles.prizeTextGroup}>
                              <span className={styles.prizeNameText}>{winner.prize}</span>
                              <span className={styles.poolNameText}>{winner.giveawayTitle}</span>
                            </div>
                          </div>
                        </td>

                        {/* Masked Winner Identity */}
                        <td className={styles.td}>
                          <span className={styles.maskedUserText} title="Masked identity for privacy">
                            {winner.maskedUserId}
                          </span>
                        </td>

                        {/* Draw Date */}
                        <td className={styles.td}>
                          <div className={styles.dateCell}>
                            <Calendar size={13} className={styles.cellIcon} aria-hidden="true" />
                            <span>{drawDateFormatted}</span>
                          </div>
                        </td>

                        {/* Entry Cost */}
                        <td className={styles.td}>
                          <span className={styles.entryCostText}>{winner.entryFeePaid || 'Free'}</span>
                        </td>

                        {/* Claim Status */}
                        <td className={styles.td}>
                          <Badge variant={statusVariant} size="sm">
                            {statusLabel}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. Mobile Responsive Record Cards (Visible only on Tablet/Mobile) */}
            <div className={styles.mobileCardsList}>
              {displayList.map((winner) => {
                const drawDateFormatted = winner.drawDate
                  ? new Date(winner.drawDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Completed';

                const statusLabel = formatClaimStatusLabel(winner.claimStatus, winner.statusLabel);
                const statusVariant = getClaimStatusVariant(winner.claimStatus, statusLabel);
                const resolvedImage = resolvePrizeImage(winner.prize, winner.giveawayTitle, winner.prizeImage);

                return (
                  <article key={winner.id} className={styles.mobileCard} aria-label={`${winner.prize} winner record`}>
                    {/* Prize Header */}
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.thumbWrapper}>
                        <img
                          src={resolvedImage}
                          alt={winner.prize}
                          className={styles.prizeThumb}
                          loading="lazy"
                        />
                      </div>
                      <div className={styles.prizeTextGroup}>
                        <h4 className={styles.prizeNameText}>{winner.prize}</h4>
                        <span className={styles.poolNameText}>{winner.giveawayTitle}</span>
                      </div>
                    </div>

                    {/* 2x2 Metadata Grid */}
                    <div className={styles.mobileMetaGrid}>
                      <div className={styles.mobileMetaItem}>
                        <span className={styles.mobileMetaLabel}>
                          <User size={11} className={styles.cellIcon} aria-hidden="true" />
                          Winner
                        </span>
                        <span className={styles.maskedUserText}>{winner.maskedUserId}</span>
                      </div>

                      <div className={styles.mobileMetaItem}>
                        <span className={styles.mobileMetaLabel}>
                          <Calendar size={11} className={styles.cellIcon} aria-hidden="true" />
                          Drawn
                        </span>
                        <span className={styles.mobileMetaValue}>{drawDateFormatted}</span>
                      </div>

                      <div className={styles.mobileMetaItem}>
                        <span className={styles.mobileMetaLabel}>
                          <Coins size={11} className={styles.cellIcon} aria-hidden="true" />
                          Entry Cost
                        </span>
                        <span className={styles.mobileMetaValue}>{winner.entryFeePaid || 'Free'}</span>
                      </div>

                      <div className={styles.mobileMetaItem}>
                        <span className={styles.mobileMetaLabel}>
                          <ShieldCheck size={11} className={styles.cellIcon} aria-hidden="true" />
                          Status
                        </span>
                        <Badge variant={statusVariant} size="sm">
                          {statusLabel}
                        </Badge>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className={styles.emptyWrapper}>
            <EmptyState
              icon={<Trophy size={32} />}
              title="No winner records available"
              description="No historical draw records were found for this archive category."
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default WinnerTabs;

