import { useState, useRef, useEffect, useCallback } from 'react';
import GiveawayCard from './GiveawayCard.jsx';
import { PRIZE_TYPES } from '../../data/constants.js';
import { EmptyState } from '../common/ui/EmptyState.jsx';
import { Skeleton } from '../common/ui/Skeleton.jsx';
import { Button } from '../common/ui/Button.jsx';
import { Gift, RotateCcw, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import styles from './GiveawayGrid.module.css';

/**
 * Choose Your Giveaway — Premium Horizontal Carousel with touch swipe, smooth scrolling, and category filters.
 */
export const GiveawayGrid = ({ giveaways = [], isLoading = false }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const carouselRef = useRef(null);

  const filteredGiveaways = giveaways.filter((item) => {
    if (activeFilter === 'PHYSICAL') return item.prizeType === PRIZE_TYPES.PHYSICAL;
    if (activeFilter === 'GIFT_CARD') return item.prizeType === PRIZE_TYPES.GIFT_CARD;
    return true;
  });

  const physicalCount = giveaways.filter((g) => g.prizeType === PRIZE_TYPES.PHYSICAL).length;
  const voucherCount = giveaways.filter((g) => g.prizeType === PRIZE_TYPES.GIFT_CARD).length;

  const updateScrollButtons = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [filteredGiveaways, updateScrollButtons]);

  const scroll = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section id="active-giveaways" className={styles.section} aria-label="Choose Your Giveaway">
      <div className={styles.container}>
        {/* Section Intro Header */}
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <span className={styles.sectionBadge}>
              <Sparkles size={13} className={styles.badgeIcon} aria-hidden="true" />
              Exclusive Reward Pools
            </span>
            <h2 className={styles.sectionTitle}>Choose Your Giveaway</h2>
            <p className={styles.sectionSubtitle}>
              Explore curated active reward pools. Enter draws with your available VELOOP reward balances.
            </p>
          </div>

          {/* Carousel Controls & Filter Tabs */}
          <div className={styles.headerActions}>
            <div className={styles.filterTabs} role="tablist" aria-label="Giveaway Categories">
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'ALL'}
                className={`${styles.filterBtn} ${activeFilter === 'ALL' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter('ALL')}
              >
                All Pools <span className={styles.tabCount}>({giveaways.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'PHYSICAL'}
                className={`${styles.filterBtn} ${activeFilter === 'PHYSICAL' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter('PHYSICAL')}
              >
                Hardware <span className={styles.tabCount}>({physicalCount})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'GIFT_CARD'}
                className={`${styles.filterBtn} ${activeFilter === 'GIFT_CARD' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter('GIFT_CARD')}
              >
                Gift Cards <span className={styles.tabCount}>({voucherCount})</span>
              </button>
            </div>

            {/* Arrow Navigation Controls */}
            <div className={styles.carouselNavControls}>
              <button
                type="button"
                className={styles.carouselNavBtn}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left in giveaways carousel"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.carouselNavBtn}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right in giveaways carousel"
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State Skeletons */}
        {isLoading ? (
          <div className={styles.carouselTrack} aria-hidden="true">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={styles.carouselItem}>
                <div className={styles.skeletonCard}>
                  <Skeleton variant="rect" height={190} borderRadius="var(--radius-lg)" />
                  <div className={styles.skeletonBody}>
                    <Skeleton variant="text" width="40%" height={14} />
                    <Skeleton variant="text" width="80%" height={22} />
                    <Skeleton variant="text" width="100%" height={16} count={2} />
                    <Skeleton variant="rect" height={36} borderRadius="var(--radius-sm)" />
                    <Skeleton variant="rect" height={44} borderRadius="var(--radius-md)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredGiveaways.length > 0 ? (
          /* Horizontal Carousel Container */
          <div className={styles.carouselWrapper}>
            <div
              className={styles.carouselTrack}
              ref={carouselRef}
              role="region"
              aria-label="Giveaways horizontal carousel"
              tabIndex={0}
            >
              {filteredGiveaways.map((item) => (
                <div key={item.id || item._id || item.slug} className={styles.carouselItem}>
                  <GiveawayCard giveaway={item} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className={styles.emptyWrapper}>
            {giveaways.length === 0 ? (
              <EmptyState
                icon={<Gift size={32} />}
                title="No active giveaways right now."
                description="Check back soon for the next reward pool."
              />
            ) : (
              <EmptyState
                icon={<Gift size={32} />}
                title="No giveaways found in this category"
                description="There are currently no active pools matching your selected filter. View all pools to explore available rewards."
                action={
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setActiveFilter('ALL')}
                    icon={<RotateCcw size={15} />}
                  >
                    View All Pools ({giveaways.length})
                  </Button>
                }
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default GiveawayGrid;

