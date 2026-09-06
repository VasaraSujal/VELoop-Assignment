import { useState } from 'react';
import { ShieldCheck, Calendar, Trophy } from 'lucide-react';
import styles from './WinnerTabs.module.css';

export const WinnerTabs = ({ recentWinners = [], previousWinners = [] }) => {
  const [activeTab, setActiveTab] = useState('recent');

  const displayList = activeTab === 'recent' ? recentWinners : previousWinners;

  return (
    <section className={styles.section} aria-label="Winner Rosters">
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <span className={styles.badge}>Transparency Log</span>
          <h2 className={styles.title}>All Winner Rosters</h2>
          <p className={styles.subtitle}>
            Historical audit log of verified winners, prizes drawn, and fulfillment statuses.
          </p>
        </div>

        {/* Tab Selection */}
        <div className={styles.tabsNav} role="tablist" aria-label="Winner History Tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recent'}
            className={`${styles.tabBtn} ${activeTab === 'recent' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent Draws ({recentWinners.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'previous'}
            className={`${styles.tabBtn} ${activeTab === 'previous' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('previous')}
          >
            Archived Winners ({previousWinners.length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className={styles.tableWrapper}>
        {displayList.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Prize / Pool</th>
                <th className={styles.th}>Winner (Masked)</th>
                <th className={styles.th}>Draw Date</th>
                <th className={styles.th}>Entry Cost</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((winner) => {
                const drawDateFormatted = new Date(winner.drawDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={winner.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.prizeCell}>
                        <img
                          src={winner.prizeImage || '/assets/prizes/iphone-15-pro.jpg'}
                          alt={winner.prize}
                          className={styles.prizeThumb}
                        />
                        <div>
                          <div>{winner.prize}</div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                            {winner.giveawayTitle}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {winner.maskedUserId}
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} color="var(--color-text-muted)" />
                        <span>{drawDateFormatted}</span>
                      </div>
                    </td>
                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {winner.entryFeePaid}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.statusBadge}>
                        <ShieldCheck size={13} />
                        {winner.statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <Trophy size={32} color="var(--color-text-muted)" style={{ marginBottom: '8px' }} />
            <p>No winner records available in this archive category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default WinnerTabs;
