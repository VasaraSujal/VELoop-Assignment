import { Gift, Users, Trophy, Sparkles } from 'lucide-react';
import { formatInr } from '../../utils/currencyFormatter.js';
import styles from './GiveawayStats.module.css';

export const GiveawayStats = ({ stats }) => {
  const activeCount = stats?.activeGiveawaysCount ?? 6;
  const participantsCount = stats?.totalParticipants ?? 10510;
  const winnersCount = stats?.totalWinners ?? 21;
  const totalValue = stats?.totalRetailValue ?? 231220;

  return (
    <section className={styles.statsSection} aria-label="Platform Statistics">
      <div className={styles.container}>
        <div className={styles.statCard}>
          <div className={styles.iconWrapper}>
            <Gift size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeCount} Pools</span>
            <span className={styles.statLabel}>Active Giveaways</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: 'var(--currency-ves-bg)', color: 'var(--currency-ves-text)' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{participantsCount.toLocaleString()}+</span>
            <span className={styles.statLabel}>Total Participants</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: 'var(--currency-sves-bg)', color: 'var(--currency-sves-text)' }}>
            <Trophy size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{winnersCount} Winners</span>
            <span className={styles.statLabel}>Total Winners</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: 'var(--currency-tokens-bg)', color: 'var(--currency-tokens-text)' }}>
            <Sparkles size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatInr(totalValue)}</span>
            <span className={styles.statLabel}>Prize Pool Value</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GiveawayStats;
