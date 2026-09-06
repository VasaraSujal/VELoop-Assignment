import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';
import CountdownTimer from './CountdownTimer.jsx';
import { formatCurrency, formatInr } from '../../utils/currencyFormatter.js';
import styles from './HeroSection.module.css';

export const HeroSection = ({ giveaway }) => {
  if (!giveaway) {
    return null;
  }

  return (
    <section className={styles.heroSection} aria-label="Featured Giveaway Showcase">
      <div className={styles.container}>
        {/* Left Column: Information & Actions */}
        <div className={styles.contentCol}>
          <div className={styles.badgeRow}>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} />
              Active Giveaway
            </span>
            <span className={styles.featuredPill}>
              <Sparkles size={14} />
              Featured Reward
            </span>
          </div>

          <h1 className={styles.title}>
            Win the <span className={styles.titleHighlight}>{giveaway.title}</span>
          </h1>

          <p className={styles.description}>{giveaway.description}</p>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Entry Fee</span>
              <span className={styles.metaValue}>
                {formatCurrency(giveaway.entry?.amount, giveaway.entry?.currency)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Retail Value</span>
              <span className={styles.metaValue}>
                {formatInr(giveaway.retailValueInr)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Winners</span>
              <span className={styles.metaValue}>{giveaway.winnerCount} Lucky Winner</span>
            </div>
          </div>

          <div className={styles.timerWrapper}>
            <CountdownTimer
              startsAt={giveaway.startsAt}
              endsAt={giveaway.endsAt}
              status={giveaway.status}
              theme="dark"
            />
          </div>

          <div className={styles.ctaRow}>
            <Link
              to={`/giveaway/${giveaway.slug}`}
              className={styles.primaryCta}
              aria-label={`Enter ${giveaway.title} giveaway`}
            >
              <span>Join Now</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#active-giveaways" className={styles.secondaryCta}>
              <span>Browse All Giveaways</span>
              <ChevronDown size={16} />
            </a>
          </div>
        </div>

        {/* Right Column: Visual Product Card Showcase */}
        <div className={styles.visualCol}>
          <div className={styles.cardShowcase}>
            <div className={styles.floatingTag}>
              {giveaway.participantCount?.toLocaleString()} Entered
            </div>

            <div className={styles.imageContainer}>
              <img
                src={giveaway.prizeImage || '/assets/prizes/iphone-15-pro.jpg'}
                alt={giveaway.prize || giveaway.title}
                className={styles.prizeImg}
                loading="eager"
              />
            </div>

            <div className={styles.cardFooter}>
              <div>
                <div className={styles.footerPrizeName}>{giveaway.prize}</div>
                <div className={styles.footerTier}>
                  {giveaway.eligibility?.description || 'All VELOOP Members'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.8rem' }}>
                <CheckCircle2 size={15} />
                <span>Verified Pool</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
