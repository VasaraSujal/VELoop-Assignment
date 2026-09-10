import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Trophy, Clock, Coins } from 'lucide-react';
import { formatCurrency, formatInr, formatNumber } from '../../utils/currencyFormatter.js';
import { calculateTimeRemaining, padZero } from '../../utils/countdown.js';
import { StatusBadge } from '../common/ui/StatusBadge.jsx';
import { Badge } from '../common/ui/Badge.jsx';
import { Button } from '../common/ui/Button.jsx';
import { resolvePrizeImage } from '../../utils/prizeImageHelper.js';
import styles from './GiveawayCard.module.css';

/**
 * Production-ready GiveawayCard displaying official prize visual, entry cost, live countdown, and state-aware CTA.
 */
export const GiveawayCard = ({ giveaway }) => {
  const isUpcoming = giveaway?.status === 'UPCOMING';
  const targetDate = isUpcoming ? giveaway?.startsAt : giveaway?.endsAt;

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(targetDate));

  useEffect(() => {
    setTimeLeft(calculateTimeRemaining(targetDate));

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeLeft(remaining);
      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!giveaway) return null;

  const isActive = giveaway.status === 'ACTIVE';
  const isConcluded = giveaway.status === 'ENDED' || giveaway.status === 'COMPLETED' || timeLeft.isExpired;

  // Currency badge variant mapping
  let currencyVariant = 'ves';
  if (giveaway.entry?.currency === 'SVEs') {
    currencyVariant = 'sves';
  } else if (giveaway.entry?.currency === 'Tokens') {
    currencyVariant = 'tokens';
  }

  // CTA label & button variant based on status
  let ctaLabel = 'Join Now';
  let buttonVariant = 'primary';

  if (isUpcoming) {
    ctaLabel = 'View Details';
    buttonVariant = 'secondary';
  } else if (isConcluded) {
    ctaLabel = 'View Winners';
    buttonVariant = 'outline';
  }

  // Countdown timer string formatting
  let countdownLabel = 'Ends In';
  let countdownValue = 'Concluded';

  if (isActive && !timeLeft.isExpired) {
    countdownLabel = 'Ends In';
    if (timeLeft.days > 0) {
      countdownValue = `${timeLeft.days}d ${padZero(timeLeft.hours)}h ${padZero(timeLeft.minutes)}m`;
    } else {
      countdownValue = `${padZero(timeLeft.hours)}h ${padZero(timeLeft.minutes)}m ${padZero(timeLeft.seconds)}s`;
    }
  } else if (isUpcoming && !timeLeft.isExpired) {
    countdownLabel = 'Starts In';
    if (timeLeft.days > 0) {
      countdownValue = `${timeLeft.days}d ${padZero(timeLeft.hours)}h`;
    } else {
      countdownValue = `${padZero(timeLeft.hours)}h ${padZero(timeLeft.minutes)}m`;
    }
  } else {
    countdownLabel = 'Status';
    countdownValue = giveaway.status === 'CANCELLED' ? 'Cancelled' : 'Ended';
  }

  const detailUrl = `/giveaway/${giveaway.slug || giveaway.id || giveaway._id}`;
  const prizeImageSrc = resolvePrizeImage(giveaway.prize, giveaway.title, giveaway.prizeImage);

  return (
    <article className={styles.card} aria-label={`${giveaway.title} prize pool card`}>
      {/* 1. Header Badges & Official Prize Image Frame */}
      <div className={styles.imageFrame}>
        <div className={styles.topBadges}>
          <StatusBadge status={giveaway.status} size="sm" />
          {giveaway.retailValueInr > 0 ? (
            <span className={styles.retailTag} title={`Official Retail Value: ${formatInr(giveaway.retailValueInr)}`}>
              Retail: {formatInr(giveaway.retailValueInr)}
            </span>
          ) : (
            <Badge variant={currencyVariant} size="sm">
              {giveaway.prizeType || 'REWARD'}
            </Badge>
          )}
        </div>

        <Link to={detailUrl} className={styles.imageLink} tabIndex={-1} aria-hidden="true">
          <img
            src={prizeImageSrc}
            alt={giveaway.prize || giveaway.title}
            className={styles.prizeImg}
            loading="lazy"
          />
        </Link>
      </div>

      {/* 2. Card Body Details */}
      <div className={styles.cardBody}>
        {/* Category Eyebrow */}
        <div className={styles.categoryRow}>
          <span className={styles.categoryBadge}>{giveaway.prizeType || 'EXCLUSIVE'} POOL</span>
        </div>

        {/* Prize Title */}
        <h3 className={styles.title}>
          <Link to={detailUrl} className={styles.titleLink}>
            {giveaway.title}
          </Link>
        </h3>

        {/* Short Description */}
        <p className={styles.description}>{giveaway.description}</p>

        {/* 3. Key Metrics: Entry Fee & Live Countdown */}
        <div className={styles.infoBox}>
          {/* Left: Entry Fee */}
          <div className={styles.infoCol}>
            <span className={styles.infoLabel}>
              <Coins size={12} className={styles.labelIcon} aria-hidden="true" />
              Entry Fee
            </span>
            <span className={styles.entryFeeValue}>
              <Badge variant={currencyVariant} size="sm">
                {formatCurrency(giveaway.entry?.amount, giveaway.entry?.currency)}
              </Badge>
            </span>
          </div>

          <div className={styles.infoDivider} aria-hidden="true" />

          {/* Right: Countdown */}
          <div className={styles.infoCol}>
            <span className={styles.infoLabel}>
              <Clock size={12} className={styles.labelIcon} aria-hidden="true" />
              {countdownLabel}
            </span>
            <span className={`${styles.countdownValue} ${isConcluded ? styles.concludedValue : ''}`}>
              {countdownValue}
            </span>
          </div>
        </div>

        {/* 4. Metadata: Participants & Winners */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem} title="Total Verified Participants">
            <Users size={14} className={styles.metaIcon} aria-hidden="true" />
            <span>{formatNumber(giveaway.participantCount || 0)} Entered</span>
          </div>
          <div className={styles.metaItem} title="Number of Winners Drawn">
            <Trophy size={14} className={styles.metaIcon} aria-hidden="true" />
            <span>
              {giveaway.winnerCount} {giveaway.winnerCount === 1 ? 'Winner' : 'Winners'}
            </span>
          </div>
        </div>

        {/* 5. State-Aware Action CTA */}
        <div className={styles.cardFooter}>
          <Link to={detailUrl} className={styles.actionLink} aria-label={`${ctaLabel} for ${giveaway.title}`}>
            <Button
              variant={buttonVariant}
              size="md"
              fullWidth
              iconRight={<ArrowRight size={16} />}
            >
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default GiveawayCard;
