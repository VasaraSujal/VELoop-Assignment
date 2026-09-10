import { useState } from 'react';
import GiveawayCard from './GiveawayCard.jsx';
import { PRIZE_TYPES } from '../../data/constants.js';
import { EmptyState } from '../common/ui/EmptyState.jsx';
import { Skeleton } from '../common/ui/Skeleton.jsx';
import { Button } from '../common/ui/Button.jsx';
import { Gift, RotateCcw } from 'lucide-react';
import styles from './GiveawayGrid.module.css';

/**
 * Active Giveaway Discovery Grid with category filter controls, card skeleton loading, and empty states.
 */
export const GiveawayGrid = ({ giveaways = [], isLoading = false }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filteredGiveaways = giveaways.filter((item) => {
    if (activeFilter === 'PHYSICAL') return item.prizeType === PRIZE_TYPES.PHYSICAL;
    if (activeFilter === 'GIFT_CARD') return item.prizeType === PRIZE_TYPES.GIFT_CARD;
    return true;
  });

  const physicalCount = giveaways.filter((g) => g.prizeType === PRIZE_TYPES.PHYSICAL).length;
  const voucherCount = giveaways.filter((g) => g.prizeType === PRIZE_TYPES.GIFT_CARD).length;

  return (
    <section id="active-giveaways" className={styles.section} aria-label="Active Giveaway Discovery Pools">
      <div className={styles.container}>
        {/* Section Intro Header */}
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <span className={styles.sectionBadge}>Exclusive Reward Pools</span>
            <h2 className={styles.sectionTitle}>Active &amp; Upcoming Giveaways</h2>
            <p className={styles.sectionSubtitle}>
              Browse curated active reward pools and upcoming releases. Enter active draws using your available VELOOP reward balances.
            </p>
          </div>

          {/* Filter Tabs */}
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
              Physical Hardware <span className={styles.tabCount}>({physicalCount})</span>
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
        </div>

        {/* Loading State Skeletons */}
        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={styles.skeletonCard} aria-hidden="true">
                <Skeleton variant="rect" height={190} borderRadius="var(--radius-lg)" />
                <div className={styles.skeletonBody}>
                  <Skeleton variant="text" width="40%" height={14} />
                  <Skeleton variant="text" width="80%" height={22} />
                  <Skeleton variant="text" width="100%" height={16} count={2} />
                  <Skeleton variant="rect" height={36} borderRadius="var(--radius-sm)" />
                  <Skeleton variant="rect" height={44} borderRadius="var(--radius-md)" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGiveaways.length > 0 ? (
          /* Cards Grid */
          <div className={styles.grid}>
            {filteredGiveaways.map((item) => (
              <GiveawayCard key={item.id || item._id || item.slug} giveaway={item} />
            ))}
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
