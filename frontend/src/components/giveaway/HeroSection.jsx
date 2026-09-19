import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown, ShieldCheck, Award, Users, Coins, Gift } from 'lucide-react';
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
      {/* Ambient background glows */}
      <div className={styles.ambientGlowPrimary} aria-hidden="true" />
      <div className={styles.ambientGlowSecondary} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />

      <div className={styles.container}>
        {/* Master Showcase Card Container matching Reference UI */}
        <div className={styles.masterCard}>
          {/* Subtle perimeter neon border glow */}
          <div className={styles.cardGlowEdge} aria-hidden="true" />

          {/* Upper Section: 2-Column Hero Grid */}
          <div className={styles.heroGrid}>
            {/* Left Column: Headlines, Value Props & Actions */}
            <div className={styles.contentCol}>
              {/* Category Pill Badge */}
              <div className={styles.badgeRow}>
                <span className={styles.categoryPill}>
                  <Sparkles size={14} className={styles.pillSparkle} aria-hidden="true" />
                  <span>VELOP GIVEAWAYS</span>
                </span>

                {isActive && (
                  <span className={styles.liveBadge} role="status">
                    <span className={styles.pulseDot} aria-hidden="true" />
                    <span>Active Pool</span>
                  </span>
                )}
                {isUpcoming && (
                  <Badge variant="info" size="md">Upcoming Pool</Badge>
                )}
                {isConcluded && (
                  <Badge variant="neutral" size="md">Concluded Pool</Badge>
                )}
              </div>

              {/* Bold Two-Tone Headline */}
              <div className={styles.titleGroup}>
                <h1 className={styles.title}>
                  Win Grand Prizes,{' '}
                  <span className={styles.titleHighlight}>Earn Rewards!</span>
                </h1>
                <p className={styles.featuredPoolTitle}>
                  Featured Pool: <strong>{giveaway.title}</strong>
                </p>
              </div>

              <p className={styles.description}>
                {giveaway.prizeType === 'GIFT_CARD'
                  ? 'Instant digital voucher rewards. Enter the draw with your VELOOP balance with zero real-cash fees.'
                  : 'Official premium hardware rewards with warranty. Enter verified draws with your VELOOP balance.'}
              </p>

              {/* 3 Reference Feature Highlight Capsules */}
              <div className={styles.capsuleRow}>
                <div className={styles.featureCapsule}>
                  <div className={styles.capsuleIconBox}>
                    <Coins size={14} />
                  </div>
                  <div className={styles.capsuleText}>
                    <span className={styles.capsuleLabel}>Entry Fee</span>
                    <span className={styles.capsuleSub}>{entryText}</span>
                  </div>
                </div>

                <div className={styles.featureCapsule}>
                  <div className={styles.capsuleIconBox}>
                    <Award size={14} />
                  </div>
                  <div className={styles.capsuleText}>
                    <span className={styles.capsuleLabel}>Winners</span>
                    <span className={styles.capsuleSub}>{giveaway.winnerCount} {giveaway.winnerCount === 1 ? 'Winner' : 'Winners'}</span>
                  </div>
                </div>

                <div className={styles.featureCapsule}>
                  <div className={styles.capsuleIconBox}>
                    <ShieldCheck size={14} />
                  </div>
                  <div className={styles.capsuleText}>
                    <span className={styles.capsuleLabel}>Secure &amp; Safe</span>
                    <span className={styles.capsuleSub}>100% Protected</span>
                  </div>
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
                    className={styles.primaryJoinBtn}
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

              {/* Mid-Callout Banner Strip */}
              <div className={styles.calloutStrip}>
                <div className={styles.calloutIconCircle}>
                  <Sparkles size={14} aria-hidden="true" />
                </div>
                <div className={styles.calloutText}>
                  <strong>The more entries you hold, the higher your winning odds!</strong>
                  <span> All draws are 100% verified and publicly announced.</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Illuminated Futuristic Stage Showcase */}
            <div className={styles.visualCol}>
              <div className={styles.stageCard}>
                {/* Ambient Top Glow */}
                <div className={styles.stageSpotlightGlow} aria-hidden="true" />

                {/* Floating Orbiting Badges */}
                <div className={styles.floatingBadgeLeft} aria-hidden="true">
                  <Sparkles size={12} className={styles.sparkleIcon} />
                  <span>EXCLUSIVE REWARDS</span>
                </div>

                <div className={styles.floatingBadgeRight} aria-hidden="true">
                  <ShieldCheck size={12} className={styles.shieldIcon} />
                  <span>100% AUTHENTIC</span>
                </div>

                {/* Floating Coins */}
                <div className={`${styles.floatingCoin} ${styles.coinLeft}`} aria-hidden="true">
                  <div className={styles.coinInner}>V</div>
                </div>
                <div className={`${styles.floatingCoin} ${styles.coinRight}`} aria-hidden="true">
                  <div className={styles.coinInnerGold}>VE</div>
                </div>

                {/* 3D Multi-Layer Sci-Fi Stage Pedestal */}
                <div className={styles.sciFiStageWrapper}>
                  {/* Floating Product Image */}
                  <div className={styles.productHoverWrap}>
                    <img
                      src={prizeImageSrc}
                      alt={giveaway.prize || giveaway.title}
                      className={styles.prizeImage}
                      loading="eager"
                    />
                    <div className={styles.productFloorShadow} aria-hidden="true" />
                  </div>

                  {/* Concentric Neon Rings & Multi-Tier Pedestal */}
                  <div className={styles.pedestalPlatform} aria-hidden="true">
                    <div className={styles.pedestalRingOuter} />
                    <div className={styles.pedestalRingInner} />
                    <div className={styles.pedestalCoreGlow} />
                    <div className={styles.pedestalBase} />
                  </div>
                </div>

                {/* Bottom Card Meta Strip */}
                <div className={styles.stageBottomMeta}>
                  <div className={styles.stagePrizeInfo}>
                    <span className={styles.stagePrizeName}>{giveaway.prize}</span>
                    <span className={styles.stagePrizeSub}>
                      {giveaway.retailValueInr > 0 ? `Retail: ${formatInr(giveaway.retailValueInr)}` : 'Official Platform Prize'}
                    </span>
                  </div>
                  <div className={styles.stageParticipantsBadge}>
                    <Users size={12} aria-hidden="true" />
                    <span>{giveaway.participantCount?.toLocaleString() || 0} Joined</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Benefits Strip — 4 Circular-Icon Cards (Matching Reference Images) */}
          <div className={styles.bottomBenefitsRow}>
            <div className={styles.benefitCard}>
              <div className={`${styles.benefitIconBox} ${styles.iconPurple}`}>
                <Award size={18} />
              </div>
              <div className={styles.benefitContent}>
                <h4 className={styles.benefitTitle}>Verified Draws</h4>
                <p className={styles.benefitText}>Provably fair random winner selection</p>
              </div>
            </div>

            <div className={styles.benefitCard}>
              <div className={`${styles.benefitIconBox} ${styles.iconGold}`}>
                <Coins size={18} />
              </div>
              <div className={styles.benefitContent}>
                <h4 className={styles.benefitTitle}>Zero Cash Fees</h4>
                <p className={styles.benefitText}>Join with VEs, SVEs &amp; Token balances</p>
              </div>
            </div>

            <div className={styles.benefitCard}>
              <div className={`${styles.benefitIconBox} ${styles.iconCyan}`}>
                <ShieldCheck size={18} />
              </div>
              <div className={styles.benefitContent}>
                <h4 className={styles.benefitTitle}>100% Genuine</h4>
                <p className={styles.benefitText}>Official brand hardware with warranty</p>
              </div>
            </div>

            <div className={styles.benefitCard}>
              <div className={`${styles.benefitIconBox} ${styles.iconPink}`}>
                <Sparkles size={18} />
              </div>
              <div className={styles.benefitContent}>
                <h4 className={styles.benefitTitle}>Instant Claims</h4>
                <p className={styles.benefitText}>Direct courier tracking &amp; voucher codes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
