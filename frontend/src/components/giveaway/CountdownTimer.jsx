import { useState, useEffect } from 'react';
import { calculateTimeRemaining, padZero } from '../../utils/countdown.js';
import { GIVEAWAY_STATUS } from '../../data/constants.js';
import styles from './CountdownTimer.module.css';

export const CountdownTimer = ({ startsAt, endsAt, status = GIVEAWAY_STATUS.ACTIVE, theme = 'dark' }) => {
  const isLight = theme === 'light';
  
  // Determine active target date and state
  const isUpcoming = status === GIVEAWAY_STATUS.UPCOMING;
  const targetDate = isUpcoming ? startsAt : endsAt;

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(targetDate));

  useEffect(() => {
    // Immediate calculation
    setTimeLeft(calculateTimeRemaining(targetDate));

    // Live 1-second interval with cleanup
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeLeft(remaining);
      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (status === GIVEAWAY_STATUS.ENDED || status === GIVEAWAY_STATUS.COMPLETED || timeLeft.isExpired) {
    return (
      <div className={styles.countdownContainer}>
        <div className={styles.endedBadge}>
          <span>Giveaway Concluded</span>
        </div>
      </div>
    );
  }

  const labelText = isUpcoming ? 'Starts in' : 'Ends in';

  return (
    <div className={styles.countdownContainer}>
      <span className={`${styles.label} ${isLight ? styles.labelLight : ''}`}>
        {labelText}
      </span>
      <div className={styles.timerUnits} aria-label={`Time remaining: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}>
        <div className={`${styles.unitBox} ${isLight ? styles.unitBoxLight : ''}`}>
          <span className={`${styles.digit} ${isLight ? styles.digitLight : ''}`}>{padZero(timeLeft.days)}</span>
          <span className={`${styles.unitLabel} ${isLight ? styles.unitLabelLight : ''}`}>Days</span>
        </div>
        <span className={`${styles.separator} ${isLight ? styles.separatorLight : ''}`}>:</span>
        <div className={`${styles.unitBox} ${isLight ? styles.unitBoxLight : ''}`}>
          <span className={`${styles.digit} ${isLight ? styles.digitLight : ''}`}>{padZero(timeLeft.hours)}</span>
          <span className={`${styles.unitLabel} ${isLight ? styles.unitLabelLight : ''}`}>Hours</span>
        </div>
        <span className={`${styles.separator} ${isLight ? styles.separatorLight : ''}`}>:</span>
        <div className={`${styles.unitBox} ${isLight ? styles.unitBoxLight : ''}`}>
          <span className={`${styles.digit} ${isLight ? styles.digitLight : ''}`}>{padZero(timeLeft.minutes)}</span>
          <span className={`${styles.unitLabel} ${isLight ? styles.unitLabelLight : ''}`}>Mins</span>
        </div>
        <span className={`${styles.separator} ${isLight ? styles.separatorLight : ''}`}>:</span>
        <div className={`${styles.unitBox} ${isLight ? styles.unitBoxLight : ''}`}>
          <span className={`${styles.digit} ${isLight ? styles.digitLight : ''}`}>{padZero(timeLeft.seconds)}</span>
          <span className={`${styles.unitLabel} ${isLight ? styles.unitLabelLight : ''}`}>Secs</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
