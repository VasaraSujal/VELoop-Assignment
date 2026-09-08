import { Gift } from 'lucide-react';
import styles from './VeloopLoader.module.css';

export const VeloopLoader = ({ text = 'Loading giveaway experience...', size = 'medium' }) => {
  return (
    <div className={`${styles.loaderContainer} ${styles[size]}`} role="status" aria-label={text}>
      <div className={styles.iconPulseWrapper}>
        <div className={styles.pulseRing} />
        <div className={styles.iconBadge}>
          <Gift className={styles.giftIcon} />
        </div>
      </div>
      <p className={styles.loadingText}>{text}</p>
      <div className={styles.shimmerBar}>
        <div className={styles.shimmerProgress} />
      </div>
    </div>
  );
};

export default VeloopLoader;
