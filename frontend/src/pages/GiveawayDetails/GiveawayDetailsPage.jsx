import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { giveawayService } from '../../services/giveawayService.js';
import { formatCurrency, formatInr } from '../../utils/currencyFormatter.js';
import styles from './GiveawayDetailsPage.module.css';

export const GiveawayDetailsPage = () => {
  const { slug } = useParams();
  const [giveaway, setGiveaway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    giveawayService
      .getGiveawayBySlug(slug)
      .then((data) => {
        if (isMounted) {
          setGiveaway(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Giveaway not found');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className={styles.page}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Giveaways
        </Link>
        <p>Loading giveaway details for &apos;{slug}&apos;...</p>
      </main>
    );
  }

  if (error || !giveaway) {
    return (
      <main className={styles.page}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Giveaways
        </Link>
        <div className={styles.detailsCard}>
          <h1 className={styles.title}>Giveaway Not Found</h1>
          <p className={styles.sectionText}>{error || 'The requested giveaway could not be located.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link to="/" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Giveaways
      </Link>

      <article className={styles.detailsCard}>
        <header className={styles.header}>
          <div className={styles.badges}>
            <span
              className={styles.badge}
              style={{
                backgroundColor:
                  giveaway.prizeType === 'PHYSICAL'
                    ? 'var(--currency-ves-bg)'
                    : 'var(--currency-tokens-bg)',
                color:
                  giveaway.prizeType === 'PHYSICAL'
                    ? 'var(--currency-ves-text)'
                    : 'var(--currency-tokens-text)',
              }}
            >
              {giveaway.prizeType}
            </span>
            <span
              className={styles.badge}
              style={{
                backgroundColor: 'var(--status-active-bg)',
                color: 'var(--status-active)',
              }}
            >
              {giveaway.status}
            </span>
          </div>
          <h1 className={styles.title}>{giveaway.title}</h1>
        </header>

        <div className={styles.infoGrid}>
          <div>
            <div className={styles.infoItemLabel}>Entry Fee</div>
            <div className={styles.infoItemValue}>
              {formatCurrency(giveaway.entry.amount, giveaway.entry.currency)}
            </div>
          </div>
          <div>
            <div className={styles.infoItemLabel}>Retail Value</div>
            <div className={styles.infoItemValue}>
              {formatInr(giveaway.retailValueInr)}
            </div>
          </div>
          <div>
            <div className={styles.infoItemLabel}>Winners</div>
            <div className={styles.infoItemValue}>{giveaway.winnerCount} Lucky Winner(s)</div>
          </div>
          <div>
            <div className={styles.infoItemLabel}>Participants</div>
            <div className={styles.infoItemValue}>{giveaway.participantCount} Joined</div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Prize Details</h2>
          <p className={styles.sectionText}>{giveaway.prize}</p>
          <p className={styles.sectionText}>{giveaway.description}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Eligibility & Rules</h2>
          <p className={styles.sectionText}>{giveaway.eligibility?.description}</p>
          <p className={styles.sectionText}>{giveaway.terms}</p>
        </section>

        <div className={styles.actionArea}>
          <div className={styles.phaseNote}>
            Phase 0 Foundation • Join modal & wallet deduction will be implemented in Phase 1
          </div>
        </div>
      </article>
    </main>
  );
};

export default GiveawayDetailsPage;
