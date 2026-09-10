import { useState, useEffect } from 'react';
import { calculateTimeRemaining, padZero } from '../../utils/countdown.js';
import { Clock, CheckCircle2 } from 'lucide-react';
import styles from './CountdownTimer.module.css';

/**
 * Reusable, accessible countdown timer with real-time updates and tabular digits.
 * Supports dark theme (Hero) and light theme (Details & Cards).
 */
export const CountdownTimer = ({
  startsAt,
  endsAt,
  status = 'ACTIVE',
  theme = 'dark',
  customLabel,
  className = '',
}) => {
  const isLight = theme === 'light';
  const isUpcoming = status === 'UPCOMING';
  const targetDate = isUpcoming ? startsAt : endsAt;

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

  const isConcluded = status === 'ENDED' || status === 'COMPLETED' || timeLeft.isExpired;

  if (isConcluded) {
    return (
      <div className={`${styles.countdownWrapper} ${isLight ? styles.lightTheme : styles.darkTheme} ${className}`}>
        <div className={styles.concludedBadge} role="status">
          <CheckCircle2 size={16} className={styles.concludedIcon} />
          <span>Giveaway Concluded</span>
        </div>
      </div>
    );
  }

  const defaultLabel = isUpcoming ? 'Pool Opens In' : 'Giveaway Ends In';
  const activeLabel = customLabel || defaultLabel;

  return (
    <div
      className={`${styles.countdownWrapper} ${isLight ? styles.lightTheme : styles.darkTheme} ${className}`}
      role="timer"
      aria-label={`${activeLabel}: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
    >
      <div className={styles.headerRow}>
        <Clock size={14} className={styles.clockIcon} aria-hidden="true" />
        <span className={styles.timerLabel}>{activeLabel}</span>
      </div>

      <div className={styles.timerGrid}>
        {/* Days */}
        <div className={styles.segment}>
          <div className={styles.digitBox}>
            <span className={styles.digit}>{padZero(timeLeft.days)}</span>
          </div>
          <span className={styles.unitLabel}>Days</span>
        </div>

        <span className={styles.colon} aria-hidden="true">:</span>

        {/* Hours */}
        <div className={styles.segment}>
          <div className={styles.digitBox}>
            <span className={styles.digit}>{padZero(timeLeft.hours)}</span>
          </div>
          <span className={styles.unitLabel}>Hours</span>
        </div>

        <span className={styles.colon} aria-hidden="true">:</span>

        {/* Minutes */}
        <div className={styles.segment}>
          <div className={styles.digitBox}>
            <span className={styles.digit}>{padZero(timeLeft.minutes)}</span>
          </div>
          <span className={styles.unitLabel}>Mins</span>
        </div>

        <span className={styles.colon} aria-hidden="true">:</span>

        {/* Seconds */}
        <div className={styles.segment}>
          <div className={styles.digitBox}>
            <span className={styles.digit}>{padZero(timeLeft.seconds)}</span>
          </div>
          <span className={styles.unitLabel}>Secs</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
