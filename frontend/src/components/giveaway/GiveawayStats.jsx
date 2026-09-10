import { Gift, Users, Trophy, Sparkles } from 'lucide-react';
import { formatInr, formatNumber } from '../../utils/currencyFormatter.js';
import { Skeleton } from '../common/ui/Skeleton.jsx';
import styles from './GiveawayStats.module.css';

/**
 * Platform Stats Bar displaying live backend statistics with honest data presentation.
 */
export const GiveawayStats = ({ stats, isLoading = false }) => {
  const activeCount = stats?.activeGiveawaysCount ?? 0;
  const participantsCount = stats?.totalParticipants ?? 0;
  const winnersCount = stats?.totalWinners ?? 0;
  const totalValue = stats?.totalRetailValue ?? 0;

  return (
    <section className={styles.statsSection} aria-label="Platform Activity Statistics">
      <div className={styles.container}>
        {/* Metric 1: Active Giveaways */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.iconActive}`} aria-hidden="true">
            <Gift size={22} />
          </div>
          <div className={styles.statInfo}>
            {isLoading ? (
              <Skeleton variant="text" width={80} height={28} />
            ) : (
              <span className={styles.statValue}>
                {formatNumber(activeCount)} <span className={styles.unitText}>Pools</span>
              </span>
            )}
            <span className={styles.statLabel}>Active Giveaways</span>
          </div>
        </div>

        {/* Metric 2: Participants */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.iconVes}`} aria-hidden="true">
            <Users size={22} />
          </div>
          <div className={styles.statInfo}>
            {isLoading ? (
              <Skeleton variant="text" width={100} height={28} />
            ) : (
              <span className={styles.statValue}>
                {formatNumber(participantsCount)}
              </span>
            )}
            <span className={styles.statLabel}>Total Participants</span>
          </div>
        </div>

        {/* Metric 3: Total Winners */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.iconSves}`} aria-hidden="true">
            <Trophy size={22} />
          </div>
          <div className={styles.statInfo}>
            {isLoading ? (
              <Skeleton variant="text" width={80} height={28} />
            ) : (
              <span className={styles.statValue}>
                {formatNumber(winnersCount)} <span className={styles.unitText}>Drawn</span>
              </span>
            )}
            <span className={styles.statLabel}>Total Winners</span>
          </div>
        </div>

        {/* Metric 4: Prize Pool Value */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.iconTokens}`} aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <div className={styles.statInfo}>
            {isLoading ? (
              <Skeleton variant="text" width={110} height={28} />
            ) : (
              <span className={styles.statValue}>
                {formatInr(totalValue)}
              </span>
            )}
            <span className={styles.statLabel}>Total Prize Value</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiveawayStats;
