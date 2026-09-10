import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown, ShieldCheck, Award, Users } from 'lucide-react';
import CountdownTimer from './CountdownTimer.jsx';
import { formatCurrency, formatInr } from '../../utils/currencyFormatter.js';
import { Button } from '../common/ui/Button.jsx';
import { Badge } from '../common/ui/Badge.jsx';
import { Skeleton } from '../common/ui/Skeleton.jsx';
import { resolvePrizeImage } from '../../utils/prizeImageHelper.js';
import styles from './HeroSection.module.css';

/**
 * Premium Hero Showcase displaying the active featured giveaway with live countdown and official assets.
 */
export const HeroSection = ({ giveaway, isLoading = false }) => {
  if (isLoading || !giveaway) {
    return (
      <section className={styles.heroSection} aria-label="Featured Giveaway Loading">
        <div className={styles.container}>
          <div className={styles.contentCol}>
            <div className={styles.badgeRow}>
              <Skeleton theme="dark" width={140} height={26} borderRadius="var(--radius-full)" />
              <Skeleton theme="dark" width={130} height={26} borderRadius="var(--radius-full)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton theme="dark" width="85%" height={44} borderRadius="var(--radius-sm)" />
              <Skeleton theme="dark" width="60%" height={44} borderRadius="var(--radius-sm)" />
            </div>

            <Skeleton theme="dark" width="95%" height={18} count={2} />

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <Skeleton theme="dark" width={60} height={12} />
                <Skeleton theme="dark" width={90} height={20} />
              </div>
              <div className={styles.metaItem}>
                <Skeleton theme="dark" width={70} height={12} />
                <Skeleton theme="dark" width={100} height={20} />
              </div>
              <div className={styles.metaItem}>
                <Skeleton theme="dark" width={80} height={12} />
                <Skeleton theme="dark" width={70} height={20} />
              </div>
            </div>

            <div className={styles.timerCard}>
              <Skeleton theme="dark" width={240} height={44} borderRadius="var(--radius-sm)" />
            </div>

            <div className={styles.ctaRow}>
              <Skeleton theme="dark" width={160} height={48} borderRadius="var(--radius-md)" />
              <Skeleton theme="dark" width={160} height={48} borderRadius="var(--radius-md)" />
            </div>
          </div>

          <div className={styles.visualCol}>
            <div className={styles.cardShowcase}>
              <div className={styles.cardHeader}>
                <Skeleton theme="dark" width={100} height={22} borderRadius="var(--radius-full)" />
                <Skeleton theme="dark" width={90} height={22} borderRadius="var(--radius-full)" />
              </div>
              <div className={styles.imagePedestal}>
                <Skeleton theme="dark" width="80%" height="80%" borderRadius="var(--radius-md)" />
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.footerDetails}>
                  <Skeleton theme="dark" width={140} height={20} />
                  <Skeleton theme="dark" width={100} height={14} />
                </div>
                <Skeleton theme="dark" width={110} height={20} borderRadius="var(--radius-full)" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isActive = giveaway.status === 'ACTIVE';
  const isUpcoming = giveaway.status === 'UPCOMING';
  const isConcluded = giveaway.status === 'ENDED' || giveaway.status === 'COMPLETED';

  // State-aware primary CTA text
  let ctaLabel = 'Join Now';
  if (isUpcoming) {
    ctaLabel = 'View Details • Opens Soon';
  } else if (isConcluded) {
    ctaLabel = 'View Winners Roster';
  }

  const entryText = formatCurrency(giveaway.entry?.amount, giveaway.entry?.currency);
  const prizeImageSrc = resolvePrizeImage(giveaway.prize, giveaway.title, giveaway.prizeImage);

  return (
    <section className={styles.heroSection} aria-label="Featured Giveaway Showcase">
      <div className={styles.container}>
        {/* Left Column: Headline, Value Proposition & Actions */}
        <div className={styles.contentCol}>
          <div className={styles.badgeRow}>
            {isActive && (
              <span className={styles.liveBadge} role="status">
                <span className={styles.pulseDot} aria-hidden="true" />
                <span>Active Giveaway</span>
              </span>
            )}
            {isUpcoming && (
              <Badge variant="info" size="md">Upcoming Pool</Badge>
            )}
            {isConcluded && (
              <Badge variant="neutral" size="md">Concluded Pool</Badge>
            )}
            <Badge variant="navy" size="md" icon={<Sparkles size={13} />}>
              Featured Reward
            </Badge>
          </div>

          <h1 className={styles.title}>
            Win the <span className={styles.titleHighlight}>{giveaway.title}</span>
          </h1>

          <p className={styles.description}>{giveaway.description}</p>

          {/* Quick Metrics Grid */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Entry Fee</span>
              <span className={styles.metaValueHighlight}>{entryText}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Retail Value</span>
              <span className={styles.metaValue}>{formatInr(giveaway.retailValueInr)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Winners Drawn</span>
              <span className={styles.metaValue}>
                <Award size={14} className={styles.metaIcon} aria-hidden="true" />
                <span>{giveaway.winnerCount} {giveaway.winnerCount === 1 ? 'Winner' : 'Winners'}</span>
              </span>
            </div>
          </div>

          {/* Integrated Countdown Timer Box */}
          <div className={styles.timerCard}>
            <CountdownTimer
              startsAt={giveaway.startsAt}
              endsAt={giveaway.endsAt}
              status={giveaway.status}
              theme="dark"
            />
          </div>

          {/* Action CTAs */}
          <div className={styles.ctaRow}>
            <Link
              to={`/giveaway/${giveaway.slug}`}
              className={styles.ctaLink}
              aria-label={`Enter ${giveaway.title} giveaway`}
            >
              <Button
                variant="primary"
                size="lg"
                iconRight={<ArrowRight size={18} />}
              >
                {ctaLabel}
              </Button>
            </Link>

            <a href="#active-giveaways" className={styles.secondaryLink}>
              <Button
                variant="navy"
                size="lg"
                iconRight={<ChevronDown size={16} />}
              >
                Browse All Pools
              </Button>
            </a>
          </div>
        </div>

        {/* Right Column: Official Prize Visual Showcase */}
        <div className={styles.visualCol}>
          <div className={styles.cardShowcase}>
            {/* Top Badges */}
            <div className={styles.cardHeader}>
              <span className={styles.prizeTypeBadge}>{giveaway.prizeType} PRIZE</span>
              {giveaway.participantCount !== undefined && (
                <span className={styles.participantBadge}>
                  <Users size={12} aria-hidden="true" />
                  <span>{giveaway.participantCount?.toLocaleString()} Entered</span>
                </span>
              )}
            </div>

            {/* Official Prize Image */}
            <div className={styles.imagePedestal}>
              <img
                src={prizeImageSrc}
                alt={giveaway.prize || giveaway.title}
                className={styles.prizeImg}
                loading="eager"
              />
            </div>

            {/* Card Footer Summary */}
            <div className={styles.cardFooter}>
              <div className={styles.footerDetails}>
                <div className={styles.footerPrizeName}>{giveaway.prize}</div>
                <div className={styles.footerTier}>
                  {giveaway.eligibility?.description || 'Open to all VELOOP Members'}
                </div>
              </div>
              <div className={styles.verifiedTag}>
                <ShieldCheck size={15} />
                <span>Fair & Transparent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
