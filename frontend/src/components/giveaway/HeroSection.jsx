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
      {/* Background Ambient Glows & Decorative Grid */}
      <div className={styles.ambientGlowPrimary} aria-hidden="true" />
      <div className={styles.ambientGlowSecondary} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />

      <div className={styles.container}>
        {/* Left Column: Headline, Value Proposition & Actions */}
        <div className={styles.contentCol}>
          {/* Eyebrow & Badges */}
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
            <span className={styles.featuredBadge}>
              <Sparkles size={12} className={styles.sparkleIcon} aria-hidden="true" />
              <span>Featured Reward</span>
            </span>
          </div>

          <div className={styles.titleGroup}>
            <span className={styles.eyebrowText}>GRAND PRIZE REWARD</span>
            <h1 className={styles.title}>
              Win the <span className={styles.titleHighlight}>{giveaway.title}</span>
            </h1>
          </div>

          <p className={styles.description}>
            {giveaway.prizeType === 'GIFT_CARD'
              ? 'Instant digital voucher reward. Enter with your VELOOP balance.'
              : 'Premium official hardware reward. Enter the draw with your VELOOP balance.'}
          </p>

          {/* Compact Sleek Metadata Strip */}
          <div className={styles.metaStrip} role="region" aria-label="Giveaway Details">
            <div className={styles.metaPill}>
              <span className={styles.metaPillLabel}>Entry Fee</span>
              <span className={styles.metaPillValueHighlight}>{entryText}</span>
            </div>
            {giveaway.retailValueInr > 0 && (
              <>
                <div className={styles.metaDivider} aria-hidden="true" />
                <div className={styles.metaPill}>
                  <span className={styles.metaPillLabel}>Retail Value</span>
                  <span className={styles.metaPillValue}>{formatInr(giveaway.retailValueInr)}</span>
                </div>
              </>
            )}
            <div className={styles.metaDivider} aria-hidden="true" />
            <div className={styles.metaPill}>
              <span className={styles.metaPillLabel}>Winner Draw</span>
              <span className={styles.metaPillValue}>
                <Award size={13} className={styles.metaPillIcon} aria-hidden="true" />
                <span>{giveaway.winnerCount} {giveaway.winnerCount === 1 ? 'Winner' : 'Winners'}</span>
              </span>
            </div>
          </div>

          {/* Integrated Live Countdown Timer Card */}
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
              to={`/giveaway/${giveaway.slug || giveaway.id || giveaway._id}`}
              className={styles.ctaLink}
              aria-label={`Enter ${giveaway.title} giveaway`}
            >
              <Button
                variant="primary"
                size="lg"
                iconRight={<ArrowRight size={18} className={styles.ctaArrow} />}
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
                Browse Pools
              </Button>
            </a>
          </div>
        </div>

        {/* Right Column: Floating Prize Presentation on Illuminated Pedestal */}
        <div className={styles.visualCol}>
          <div className={styles.stageContainer}>
            {/* Ambient Radial Spotlight & Orbit Rings */}
            <div className={styles.spotlight} aria-hidden="true" />
            <div className={styles.orbitRingOuter} aria-hidden="true" />
            <div className={styles.orbitRingInner} aria-hidden="true" />

            {/* Top Floating Badge Pill */}
            <div className={styles.stageTopBadge}>
              <span className={styles.stageTypeTag}>{giveaway.prizeType} PRIZE</span>
              {giveaway.participantCount !== undefined && (
                <span className={styles.stageParticipantTag}>
                  <Users size={12} aria-hidden="true" />
                  <span>{giveaway.participantCount?.toLocaleString()} Entered</span>
                </span>
              )}
            </div>

            {/* Floating Product Image */}
            <div className={styles.floatingProductWrap}>
              <img
                src={prizeImageSrc}
                alt={giveaway.prize || giveaway.title}
                className={styles.prizeImg}
                loading="eager"
              />
              {/* Product Ground Shadow */}
              <div className={styles.productShadow} aria-hidden="true" />
            </div>

            {/* 3D-styled Illuminated Pedestal Base */}
            <div className={styles.pedestalBase}>
              <div className={styles.pedestalTop} />
              <div className={styles.pedestalFront} />
            </div>

            {/* Bottom Floating Info Summary Pill */}
            <div className={styles.stageFooter}>
              <div className={styles.stagePrizeInfo}>
                <span className={styles.stagePrizeTitle}>{giveaway.prize}</span>
                <span className={styles.stagePrizeSubtitle}>
                  {giveaway.eligibility?.description || 'Open to all VELOOP Members'}
                </span>
              </div>
              <div className={styles.verifiedPill}>
                <ShieldCheck size={14} aria-hidden="true" />
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
