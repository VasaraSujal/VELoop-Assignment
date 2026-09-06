import { useState } from 'react';
import GiveawayCard from './GiveawayCard.jsx';
import { PRIZE_TYPES } from '../../data/constants.js';
import styles from './GiveawayGrid.module.css';

export const GiveawayGrid = ({ giveaways = [] }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filteredGiveaways = giveaways.filter((item) => {
    if (activeFilter === 'PHYSICAL') return item.prizeType === PRIZE_TYPES.PHYSICAL;
    if (activeFilter === 'GIFT_CARD') return item.prizeType === PRIZE_TYPES.GIFT_CARD;
    return true;
  });

  const physicalCount = giveaways.filter((g) => g.prizeType === PRIZE_TYPES.PHYSICAL).length;
  const voucherCount = giveaways.filter((g) => g.prizeType === PRIZE_TYPES.GIFT_CARD).length;

  return (
    <section id="active-giveaways" className={styles.section} aria-label="Active Giveaway Pools">
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <span className={styles.sectionBadge}>Exclusive Reward Pools</span>
          <h2 className={styles.sectionTitle}>Active Giveaways</h2>
          <p className={styles.sectionSubtitle}>
            Browse curated prize draws and enter using your available VELOOP reward balances.
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
            All Pools ({giveaways.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'PHYSICAL'}
            className={`${styles.filterBtn} ${activeFilter === 'PHYSICAL' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter('PHYSICAL')}
          >
            Physical Hardware ({physicalCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'GIFT_CARD'}
            className={`${styles.filterBtn} ${activeFilter === 'GIFT_CARD' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter('GIFT_CARD')}
          >
            Gift Cards ({voucherCount})
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {filteredGiveaways.length > 0 ? (
          filteredGiveaways.map((item) => (
            <GiveawayCard key={item.id} giveaway={item} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>No giveaways found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GiveawayGrid;
