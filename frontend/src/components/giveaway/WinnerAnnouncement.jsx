import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Calendar, User, Coins, ShieldCheck } from 'lucide-react';
import { Badge } from '../common/ui/Badge.jsx';
import { EmptyState } from '../common/ui/EmptyState.jsx';
import { Skeleton } from '../common/ui/Skeleton.jsx';
import { resolvePrizeImage } from '../../utils/prizeImageHelper.js';
import styles from './WinnerAnnouncement.module.css';

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
 * Production-ready Recent Winner Showcase with carousel navigation, official prize assets, and privacy-safe winner details.
 */
export const WinnerAnnouncement = ({ winners = [], isLoading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = winners.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay interval with pause-on-hover & reduced motion check
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  return (
    <section
      className={styles.section}
      aria-label="Recent Winner Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.container}>
        {/* Section Header Row */}
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <span className={styles.sectionBadge}>
              <Trophy size={13} className={styles.badgeIcon} aria-hidden="true" />
              Recent Winner Showcase
            </span>
            <h2 className={styles.sectionTitle}>Recent Giveaway Winners</h2>
            <p className={styles.sectionSubtitle}>
              Recently drawn winners from completed VELOOP giveaways.
            </p>
          </div>

          {/* Carousel Controls */}
          {total > 1 && (
            <div className={styles.controls} aria-label="Winner carousel navigation">
              <button
                type="button"
                className={styles.arrowBtn}
                onClick={prevSlide}
                aria-label="Previous winner slide"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <span className={styles.slideCounter} aria-live="polite">
                {currentIndex + 1} / {total}
              </span>
              <button
                type="button"
                className={styles.arrowBtn}
                onClick={nextSlide}
                aria-label="Next winner slide"
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Loading State Skeletons */}
        {isLoading ? (
          <div className={styles.sliderCard} aria-hidden="true">
            <Skeleton variant="rect" height={260} borderRadius="var(--radius-lg)" />
            <div className={styles.skeletonBody}>
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="70%" height={28} />
              <Skeleton variant="text" width="45%" height={18} />
              <Skeleton variant="rect" height={70} borderRadius="var(--radius-md)" />
            </div>
          </div>
        ) : total === 0 ? (
          /* Empty State */
          <div className={styles.emptyWrapper}>
            <EmptyState
              icon={<Trophy size={32} />}
              title="No recent winners yet"
              description="Active giveaway pools are currently accepting entries. Winners will appear here once draws conclude."
            />
          </div>
        ) : (
          /* Featured Winner Horizontal Card */
          (() => {
            const current = winners[currentIndex] || winners[0];
            const formattedDate = current.drawDate
              ? new Date(current.drawDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recently Drawn';

            const statusLabel = formatClaimStatusLabel(current.claimStatus, current.statusLabel);
            const statusVariant = getClaimStatusVariant(current.claimStatus, statusLabel);
            const resolvedImage = resolvePrizeImage(current.prize, current.giveawayTitle, current.prizeImage);

            return (
              <div className={styles.sliderCard} key={current.id || currentIndex}>
                {/* 1. Official Prize Image Frame */}
                <div className={styles.imageWrapper}>
                  <img
                    src={resolvedImage}
                    alt={current.prize || 'Winner Prize'}
                    className={styles.prizeImg}
                    loading="lazy"
                  />
                </div>

                {/* 2. Winner & Pool Details */}
                <div className={styles.winnerInfo}>
                  <div className={styles.winnerMetaTop}>
                    <span className={styles.trophyBadge}>
                      <Trophy size={13} aria-hidden="true" />
                      Winner Drawn
                    </span>
                    <span className={styles.drawDate}>
                      <Calendar size={13} className={styles.metaIcon} aria-hidden="true" />
                      Drawn on {formattedDate}
                    </span>
                  </div>

                  <div className={styles.titleGroup}>
                    <h3 className={styles.prizeTitle}>{current.prize}</h3>
                    <p className={styles.poolName}>{current.giveawayTitle}</p>
                  </div>

                  {/* 3-Column Structured Key Details Grid */}
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailCol}>
                      <span className={styles.detailLabel}>
                        <User size={12} className={styles.labelIcon} aria-hidden="true" />
                        Winner
                      </span>
                      <span className={styles.maskedUser} title="Masked identity for privacy">
                        {current.maskedUserId}
                      </span>
                    </div>

                    <div className={styles.detailDivider} aria-hidden="true" />

                    <div className={styles.detailCol}>
                      <span className={styles.detailLabel}>
                        <Coins size={12} className={styles.labelIcon} aria-hidden="true" />
                        Entry Cost
                      </span>
                      <span className={styles.entryCostValue}>{current.entryFeePaid || 'Free'}</span>
                    </div>

                    <div className={styles.detailDivider} aria-hidden="true" />

                    <div className={styles.detailCol}>
                      <span className={styles.detailLabel}>
                        <ShieldCheck size={12} className={styles.labelIcon} aria-hidden="true" />
                        Claim Status
                      </span>
                      <div className={styles.statusWrapper}>
                        <Badge variant={statusVariant} size="sm">
                          {statusLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Pagination Indicators */}
        {total > 1 && (
          <div className={styles.dotsWrapper} role="tablist" aria-label="Winner slide pagination">
            {winners.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                role="tab"
                aria-selected={currentIndex === idx}
                aria-label={`Go to winner slide ${idx + 1}`}
                className={`${styles.dot} ${currentIndex === idx ? styles.dotActive : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WinnerAnnouncement;

