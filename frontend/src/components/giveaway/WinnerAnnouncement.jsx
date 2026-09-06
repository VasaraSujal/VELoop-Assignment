import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Trophy, ShieldCheck } from 'lucide-react';
import styles from './WinnerAnnouncement.module.css';

export const WinnerAnnouncement = ({ winners = [] }) => {
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

  // Autoplay interval with pause-on-hover
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  if (!winners || winners.length === 0) {
    return (
      <section className={styles.section} aria-label="Winner Announcements">
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <Trophy size={36} color="var(--color-text-muted)" style={{ marginBottom: '12px' }} />
            <p>No winners announced yet. Active giveaway pools are currently accepting entries.</p>
          </div>
        </div>
      </section>
    );
  }

  const current = winners[currentIndex];
  const formattedDate = new Date(current.drawDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <section
      className={styles.section}
      aria-label="Verified Winners Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <span className={styles.badge}>
              <Trophy size={16} />
              Verified Winner Showcase
            </span>
            <h2 className={styles.title}>Recent Giveaway Winners</h2>
            <p className={styles.subtitle}>
              Provably fair random draws completed and fulfilled to verified VELOOP members.
            </p>
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={prevSlide}
              aria-label="Previous winner"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={nextSlide}
              aria-label="Next winner"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Current Slide Card */}
        <div className={styles.sliderCard} key={current.id}>
          <div className={styles.imageWrapper}>
            <img
              src={current.prizeImage || '/assets/prizes/iphone-15-pro.jpg'}
              alt={current.prize}
              className={styles.prizeImg}
            />
          </div>

          <div className={styles.winnerInfo}>
            <div className={styles.winnerHeader}>
              <span className={styles.trophyBadge}>
                <Trophy size={14} />
                Winner Drawn
              </span>
              <span className={styles.drawDate}>Drawn on {formattedDate}</span>
            </div>

            <div>
              <h3 className={styles.prizeTitle}>{current.prize}</h3>
              <p className={styles.poolName}>{current.giveawayTitle}</p>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailCol}>
                <span className={styles.detailLabel}>Winner Identifier</span>
                <span className={styles.detailValue}>{current.maskedUserId}</span>
              </div>
              <div className={styles.detailCol}>
                <span className={styles.detailLabel}>Entry Cost</span>
                <span className={styles.detailValue}>{current.entryFeePaid}</span>
              </div>
              <div className={styles.detailCol}>
                <span className={styles.detailLabel}>Fulfillment</span>
                <span className={styles.detailValue} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669' }}>
                  <ShieldCheck size={14} />
                  {current.statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dots Pagination */}
        <div className={styles.dotsWrapper} role="tablist" aria-label="Winner slide pagination">
          {winners.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={currentIndex === idx}
              aria-label={`Go to slide ${idx + 1}`}
              className={`${styles.dot} ${currentIndex === idx ? styles.dotActive : ''}`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WinnerAnnouncement;
