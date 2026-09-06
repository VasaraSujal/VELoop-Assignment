import { Link } from 'react-router-dom';
import { ArrowRight, Users, Award } from 'lucide-react';
import { formatCurrency, formatInr } from '../../utils/currencyFormatter.js';
import { CURRENCIES } from '../../data/constants.js';
import styles from './GiveawayCard.module.css';

export const GiveawayCard = ({ giveaway }) => {
  if (!giveaway) return null;

  // Determine currency styling
  let currencyBg = 'var(--currency-ves-bg)';
  let currencyColor = 'var(--currency-ves-text)';

  if (giveaway.entry?.currency === CURRENCIES.SVES) {
    currencyBg = 'var(--currency-sves-bg)';
    currencyColor = 'var(--currency-sves-text)';
  } else if (giveaway.entry?.currency === CURRENCIES.TOKENS) {
    currencyBg = 'var(--currency-tokens-bg)';
    currencyColor = 'var(--currency-tokens-text)';
  }

  return (
    <article className={styles.card} aria-label={`${giveaway.title} prize card`}>
      <div className={styles.imageWrapper}>
        <img
          src={giveaway.prizeImage || '/assets/prizes/iphone-15-pro.png'}
          alt={giveaway.prize || giveaway.title}
          className={styles.prizeImg}
          loading="lazy"
        />
        <div className={styles.topBadges}>
          <span className={styles.prizeTypeBadge}>{giveaway.prizeType}</span>
          <span
            className={styles.entryFeeBadge}
            style={{ backgroundColor: currencyBg, color: currencyColor }}
          >
            {formatCurrency(giveaway.entry?.amount, giveaway.entry?.currency)}
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>
          <Link to={`/giveaway/${giveaway.slug}`} className={styles.titleLink}>
            {giveaway.title}
          </Link>
        </h3>

        <p className={styles.description}>{giveaway.description}</p>

        <div className={styles.metaGrid}>
          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>Retail Value</span>
            <span className={styles.metaValue}>{formatInr(giveaway.retailValueInr)}</span>
          </div>
          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>Winners</span>
            <span className={styles.metaValue} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Award size={13} color="var(--color-primary)" />
              {giveaway.winnerCount}
            </span>
          </div>
          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>Participants</span>
            <span className={styles.metaValue} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Users size={13} color="var(--color-text-secondary)" />
              {giveaway.participantCount?.toLocaleString()}
            </span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <Link
            to={`/giveaway/${giveaway.slug}`}
            className={styles.actionButton}
            aria-label={`View giveaway details for ${giveaway.title}`}
          >
            <span>View Details</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default GiveawayCard;
