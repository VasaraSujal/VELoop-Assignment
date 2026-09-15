import { useState, useMemo } from 'react';
import { Trophy, Medal, Award, Sparkles, Calendar, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../common/ui/Badge.jsx';
import { EmptyState } from '../common/ui/EmptyState.jsx';
import { useScrollReveal } from '../../utils/useScrollReveal.js';
import { resolvePrizeImage } from '../../utils/prizeImageHelper.js';
import styles from './GiveawayLeaderboard.module.css';

const INITIAL_DISPLAY_COUNT = 5;

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
 */
const formatClaimStatusLabel = (status, label) => {
  const l = (label || '').trim();
  const s = (status || '').toUpperCase();
  if (l === 'Delivered & Verified' || l.toLowerCase().includes('delivered') || s === 'DELIVERED') {
    return 'Delivered';
  }
  return l || status || 'Pending Claim';
};

const formatDrawDate = (value) => {
  if (!value) return 'Recently Drawn';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Recently Drawn';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getDisplayName = (winner) => {
  const raw = winner.maskedUserId || winner.userHandle || winner.maskedPhone || '';
  const cleaned = String(raw).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned || 'U';
};

/**
 * Giveaway Leaderboard — Displays verified winner draws with dark podium showcase and ranking table.
 */
export const GiveawayLeaderboard = ({ winners = [] }) => {
  const [sectionRef, isVisible] = useScrollReveal({ threshold: 0.08 });
  const [isExpanded, setIsExpanded] = useState(false);

  const leaderboardData = useMemo(() => {
    if (!Array.isArray(winners)) return [];
    return winners.map((winner, index) => ({
      rank: winner.rank || index + 1,
      maskedId: winner.maskedUserId || winner.userHandle || 'Masked Account',
      displayName: getDisplayName(winner),
      prize: winner.prize || winner.prizeName || 'Reward Prize',
      poolTitle: winner.giveawayTitle || winner.poolTitle || 'VELOOP Giveaway Pool',
      drawDate: formatDrawDate(winner.drawDate || winner.drawnAt),
      status: formatClaimStatusLabel(winner.claimStatus, winner.statusLabel),
      statusVariant: getClaimStatusVariant(winner.claimStatus, winner.statusLabel),
      rawWinner: winner,
    }));
  }, [winners]);

  const displayedList = useMemo(() => {
    return isExpanded ? leaderboardData : leaderboardData.slice(0, INITIAL_DISPLAY_COUNT);
  }, [leaderboardData, isExpanded]);

  const top1 = leaderboardData.find((w) => w.rank === 1) || leaderboardData[0];
  const top2 = leaderboardData.find((w) => w.rank === 2) || leaderboardData[1];
  const top3 = leaderboardData.find((w) => w.rank === 3) || leaderboardData[2];

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className={`${styles.rankBadge} ${styles.rankGold}`} title="Rank 1">
          <Trophy size={14} aria-hidden="true" />
          <span>#1</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className={`${styles.rankBadge} ${styles.rankSilver}`} title="Rank 2">
          <Medal size={14} aria-hidden="true" />
          <span>#2</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className={`${styles.rankBadge} ${styles.rankBronze}`} title="Rank 3">
          <Award size={14} aria-hidden="true" />
          <span>#3</span>
        </span>
      );
    }
    return (
      <span className={`${styles.rankBadge} ${styles.rankNeutral}`} title={`Rank ${rank}`}>
        <span>#{rank}</span>
      </span>
    );
  };

  return (
    <section
      id="leaderboard"
      ref={sectionRef}
      className={`${styles.section} ${isVisible ? styles.sectionVisible : ''}`}
      aria-label="Giveaway Leaderboard"
    >
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.badge}>
            <Sparkles size={13} className={styles.badgeIcon} aria-hidden="true" />
            Top Verified Draws
          </span>
          <h2 className={styles.title}>Giveaway Leaderboard</h2>
          <p className={styles.subtitle}>
            Concluded prize draws &amp; recent winners ranked with privacy-safe masked identifiers.
          </p>
        </div>

        {leaderboardData.length === 0 ? (
          <div className={styles.emptyWrapper}>
            <EmptyState
              icon={<Trophy size={32} />}
              title="No draw results yet"
              description="The leaderboard will appear here once active giveaways conclude and their winners are drawn and verified."
            />
          </div>
        ) : (
          <>
            {/* Top 3 Podium Showcase (Desktop & Mobile) */}
            {leaderboardData.length >= 2 && (
              <div className={styles.podiumContainer} aria-label="Top 3 Winners Podium">
                {/* 2nd Place (Left on Desktop, Left on Mobile grid) */}
                {top2 && (
                  <div className={`${styles.podiumCard} ${styles.podiumSilver}`}>
                    <div className={styles.podiumBadge}>
                      <Medal size={13} aria-hidden="true" />
                      <span>2ND PLACE</span>
                    </div>
                    <div className={styles.podiumAvatarBox}>
                      <div className={styles.podiumAvatar}>
                        {top2.displayName.charAt(0)}
                      </div>
                      <span className={styles.podiumRankCircle}>2</span>
                    </div>
                    <div className={styles.podiumUser}>{top2.maskedId}</div>
                    {top2.prize && (
                      <div className={styles.podiumPrizeThumb}>
                        <img src={resolvePrizeImage(top2.rawWinner)} alt={top2.prize} loading="lazy" />
                      </div>
                    )}
                    {top2.prize && <div className={styles.podiumPrize}>{top2.prize}</div>}
                    {top2.status && <Badge variant={top2.statusVariant} size="sm">{top2.status}</Badge>}
                  </div>
                )}

                {/* 1st Place Champion (Center - Elevated on Desktop, Top on Mobile) */}
                {top1 && (
                  <div className={`${styles.podiumCard} ${styles.podiumGold}`}>
                    <div className={styles.crownWrapper}>
                      <Crown size={22} className={styles.crownIcon} aria-hidden="true" />
                    </div>
                    <div className={styles.podiumBadgeGold}>
                      <Trophy size={13} aria-hidden="true" />
                      <span>CHAMPION</span>
                    </div>
                    <div className={styles.podiumAvatarBox}>
                      <div className={styles.podiumAvatarGold}>
                        {top1.displayName.charAt(0)}
                      </div>
                      <span className={styles.podiumRankCircleGold}>1</span>
                    </div>
                    <div className={styles.podiumUserGold}>{top1.maskedId}</div>
                    {top1.prize && (
                      <div className={styles.podiumPrizeThumbGold}>
                        <img src={resolvePrizeImage(top1.rawWinner)} alt={top1.prize} loading="lazy" />
                      </div>
                    )}
                    {top1.prize && <div className={styles.podiumPrizeGold}>{top1.prize}</div>}
                    {top1.status && <Badge variant={top1.statusVariant} size="sm">{top1.status}</Badge>}
                  </div>
                )}

                {/* 3rd Place (Right on Desktop, Right on Mobile grid) */}
                {top3 && (
                  <div className={`${styles.podiumCard} ${styles.podiumBronze}`}>
                    <div className={styles.podiumBadgeBronze}>
                      <Award size={13} aria-hidden="true" />
                      <span>3RD PLACE</span>
                    </div>
                    <div className={styles.podiumAvatarBox}>
                      <div className={styles.podiumAvatarBronze}>
                        {top3.displayName.charAt(0)}
                      </div>
                      <span className={styles.podiumRankCircleBronze}>3</span>
                    </div>
                    <div className={styles.podiumUser}>{top3.maskedId}</div>
                    {top3.prize && (
                      <div className={styles.podiumPrizeThumb}>
                        <img src={resolvePrizeImage(top3.rawWinner)} alt={top3.prize} loading="lazy" />
                      </div>
                    )}
                    {top3.prize && <div className={styles.podiumPrize}>{top3.prize}</div>}
                    {top3.status && <Badge variant={top3.statusVariant} size="sm">{top3.status}</Badge>}
                  </div>
                )}
              </div>
            )}

            {/* Desktop Leaderboard Table */}
            <div className={styles.desktopLeaderboard} role="table" aria-label="Leaderboard Rankings">
              <div className={styles.tableHeader} role="row">
                <span className={styles.thRank} role="columnheader">Rank</span>
                <span className={styles.thUser} role="columnheader">Winner (Masked)</span>
                <span className={styles.thEntries} role="columnheader">Drawn Date</span>
                <span className={styles.thPrize} role="columnheader">Prize / Pool</span>
                <span className={styles.thStatus} role="columnheader">Claim Status</span>
              </div>

              <div className={styles.rowsContainer}>
                {displayedList.map((item, index) => {
                  const prizeImgSrc = resolvePrizeImage(item.rawWinner);
                  const isTop3 = item.rank <= 3;

                  return (
                    <div
                      key={`desktop-row-${item.rank}-${item.maskedId}-${index}`}
                      className={`${styles.row} ${isTop3 ? styles.topRow : ''}`}
                      role="row"
                    >
                      {/* 1. Rank */}
                      <div className={styles.cellRank} role="cell">
                        {getRankBadge(item.rank)}
                      </div>

                      {/* 2. Masked Winner Identity */}
                      <div className={styles.cellUser} role="cell">
                        <div className={styles.userAvatar} aria-hidden="true">
                          {item.displayName.charAt(0)}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{item.maskedId}</span>
                          <span className={styles.userMasked} title="Privacy-masked account identifier">
                            Masked Account
                          </span>
                        </div>
                      </div>

                      {/* 3. Draw Date */}
                      <div className={styles.cellEntries} role="cell">
                        <div className={styles.entriesTag}>
                          <Calendar size={13} className={styles.cellIcon} aria-hidden="true" />
                          <span>{item.drawDate}</span>
                        </div>
                      </div>

                      {/* 4. Reward / Prize */}
                      <div className={styles.cellPrize} role="cell">
                        <div className={styles.prizeThumbBox}>
                          <img
                            src={prizeImgSrc}
                            alt={item.prize}
                            className={styles.prizeThumb}
                            loading="lazy"
                          />
                        </div>
                        <div className={styles.prizeTextGroup}>
                          <span className={styles.prizeTitleText}>{item.prize}</span>
                          <span className={styles.poolSubText}>{item.poolTitle}</span>
                        </div>
                      </div>

                      {/* 5. Status */}
                      <div className={styles.cellStatus} role="cell">
                        <Badge variant={item.statusVariant} size="sm">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Stacked Ranking Cards (Visible on mobile screens) */}
            <div className={styles.mobileLeaderboard}>
              {displayedList.map((item, index) => {
                const prizeImgSrc = resolvePrizeImage(item.rawWinner);
                const isTop3 = item.rank <= 3;

                return (
                  <article
                    key={`mobile-card-${item.rank}-${item.maskedId}-${index}`}
                    className={`${styles.mobileCard} ${isTop3 ? styles.mobileTopCard : ''}`}
                    aria-label={`Rank ${item.rank}: ${item.maskedId}`}
                  >
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.mobileHeaderLeft}>
                        {getRankBadge(item.rank)}
                        <div className={styles.userAvatar} aria-hidden="true">
                          {item.displayName.charAt(0)}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{item.maskedId}</span>
                          <span className={styles.userMasked}>Masked Account</span>
                        </div>
                      </div>
                      <Badge variant={item.statusVariant} size="sm">
                        {item.status}
                      </Badge>
                    </div>

                    <div className={styles.mobileCardBody}>
                      <div className={styles.mobilePrizeRow}>
                        <div className={styles.prizeThumbBox}>
                          <img
                            src={prizeImgSrc}
                            alt={item.prize}
                            className={styles.prizeThumb}
                            loading="lazy"
                          />
                        </div>
                        <div className={styles.prizeTextGroup}>
                          <span className={styles.prizeTitleText}>{item.prize}</span>
                          <span className={styles.poolSubText}>{item.poolTitle}</span>
                        </div>
                      </div>

                      <div className={styles.mobileMetaBottom}>
                        <div className={styles.entriesTag}>
                          <Calendar size={13} className={styles.cellIcon} aria-hidden="true" />
                          <span>{item.drawDate}</span>
                        </div>
                        <Badge variant="neutral" size="sm">
                          Draw Finalized
                        </Badge>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Show More / Show Less Toggle Button */}
            {leaderboardData.length > INITIAL_DISPLAY_COUNT && (
              <div className={styles.showMoreContainer}>
                <button
                  type="button"
                  className={styles.showMoreBtn}
                  onClick={() => setIsExpanded((prev) => !prev)}
                  aria-expanded={isExpanded}
                >
                  <span>
                    {isExpanded
                      ? 'Show Less'
                      : `Show More (${leaderboardData.length - INITIAL_DISPLAY_COUNT} more)`}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default GiveawayLeaderboard;