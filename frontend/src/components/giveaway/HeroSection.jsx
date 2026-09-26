import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown, ShieldCheck, Award, Users, Coins } from 'lucide-react';
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
          <div className={styles.masterCard}>
            <div className={styles.heroGrid}>
              <div className={styles.contentCol}>
                <div className={styles.badgeRow}>
                  <Skeleton theme="dark" width={140} height={26} borderRadius="var(--radius-full)" />
                  <Skeleton theme="dark" width={110} height={26} borderRadius="var(--radius-full)" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton theme="dark" width="85%" height={38} borderRadius="var(--radius-sm)" />
                  <Skeleton theme="dark" width="60%" height={38} borderRadius="var(--radius-sm)" />
                </div>

                <Skeleton theme="dark" width="95%" height={16} count={2} />

                <div className={styles.capsuleRow}>
                  <div className={styles.featureCapsule}>
                    <Skeleton theme="dark" width={80} height={32} />
                  </div>
                  <div className={styles.featureCapsule}>
                    <Skeleton theme="dark" width={80} height={32} />
                  </div>
                  <div className={`${styles.featureCapsule} ${styles.featureCapsuleFull}`}>
                    <Skeleton theme="dark" width={120} height={32} />
                  </div>
                </div>

                <div className={styles.timerCard}>
                  <Skeleton theme="dark" width="100%" height={44} borderRadius="var(--radius-sm)" />
                </div>

                <div className={styles.ctaRow}>
                  <Skeleton theme="dark" width="100%" height={48} borderRadius="var(--radius-md)" />
                  <Skeleton theme="dark" width="100%" height={48} borderRadius="var(--radius-md)" />
                </div>
              </div>

              <div className={styles.visualCol}>
                <div className={styles.stageCard}>
                  <div className={styles.sciFiStageWrapper}>
                    <Skeleton theme="dark" width="80%" height="80%" borderRadius="var(--radius-md)" />
                  </div>
                </div>
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
      {/* Ambient background depth */}
      <div className={styles.ambientGlowPrimary} aria-hidden="true" />
      <div className={styles.ambientGlowSecondary} aria-hidden="true" />

      <div className={styles.container}>
        {/* Master Showcase Card Container */}
        <div className={styles.masterCard}>
          <div className={styles.cardGlowEdge} aria-hidden="true" />

          {/* Upper Section: Responsive Hero Grid */}
          <div className={styles.heroGrid}>
            {/* Left Column: Headlines, Value Props & Actions */}
            <div className={styles.contentCol}>
              {/* Category Pill & Status Badge */}
              <div className={styles.badgeRow}>
                <span className={styles.categoryPill}>
                  <Sparkles size={13} className={styles.pillSparkle} aria-hidden="true" />
                  <span>VELOP REWARDS</span>
                </span>

                {isActive && (
                  <span className={styles.liveBadge} role="status">
                    <span className={styles.pulseDot} aria-hidden="true" />
                    <span>Active Draw</span>
                  </span>
                )}
                {isUpcoming && (
                  <Badge variant="info" size="md">Upcoming Draw</Badge>
                )}
                {isConcluded && (
                  <Badge variant="neutral" size="md">Concluded Draw</Badge>
                )}
              </div>

              {/* Bold Two-Tone Headline & Structured Featured Pool */}
              <div className={styles.titleGroup}>
                <h1 className={styles.title}>
                  Win Grand Prizes,{' '}
                  <span className={styles.titleHighlight}>Earn Rewards!</span>
                </h1>
                <div className={styles.featuredPoolBlock}>
                  <span className={styles.featuredPoolLabel}>Featured Pool</span>
                  <p className={styles.featuredPoolName}>{giveaway.title || giveaway.prize}</p>
                </div>
              </div>

              <p className={styles.description}>
                {giveaway.prizeType === 'GIFT_CARD'
                  ? 'Instant digital voucher rewards. Enter verified draws using your VELOOP balance with instant code redemption.'
                  : 'Official premium hardware rewards with warranty. Enter verified draws using your VELOOP balance.'}
              </p>

              {/* Compact Information Grid */}
              <div className={styles.capsuleRow}>
                <div className={styles.featureCapsule}>
                  <div className={styles.capsuleIconBox}>
                    <Coins size={15} aria-hidden="true" />
                  </div>
                  <div className={styles.capsuleText}>
                    <span className={styles.capsuleLabel}>Entry Fee</span>
                    <span className={styles.capsuleSub}>{entryText}</span>
                  </div>
                </div>

                <div className={styles.featureCapsule}>
                  <div className={styles.capsuleIconBox}>
                    <Award size={15} aria-hidden="true" />
                  </div>
                  <div className={styles.capsuleText}>
                    <span className={styles.capsuleLabel}>Winners</span>
                    <span className={styles.capsuleSub}>
                      {giveaway.winnerCount} {giveaway.winnerCount === 1 ? 'Winner' : 'Winners'}
                    </span>
                  </div>
                </div>

                <div className={`${styles.featureCapsule} ${styles.featureCapsuleFull}`}>
                  <div className={styles.capsuleIconBox}>
                    <ShieldCheck size={15} aria-hidden="true" />
                  </div>
                  <div className={styles.capsuleText}>
                    <span className={styles.capsuleLabel}>Verification</span>
                    <span className={styles.capsuleSub}>Provably Fair Random Draw</span>
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
                    fullWidth
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
                    fullWidth
                    iconRight={<ChevronDown size={16} />}
                    className={styles.secondaryBrowseBtn}
                  >
                    Browse Pools
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: Premium Stage Showcase */}
            <div className={styles.visualCol}>
              <div className={styles.stageCard}>
                <div className={styles.stageLighting} aria-hidden="true" />

                {/* Product Stage Presentation */}
                <div className={styles.stageProductArea}>
                  <div className={styles.productHoverWrap}>
                    <img
                      src={prizeImageSrc}
                      alt={giveaway.prize || giveaway.title}
                      className={styles.prizeImage}
                      loading="eager"
                    />
                    <div className={styles.productShadow} aria-hidden="true" />
                  </div>
                </div>

                {/* Bottom Card Meta Strip */}
                <div className={styles.stageBottomMeta}>
                  <div className={styles.stagePrizeInfo}>
                    <span className={styles.stagePrizeTag}>Verified Reward</span>
                    <span className={styles.stagePrizeName}>{giveaway.prize || giveaway.title}</span>
                    <span className={styles.stagePrizeSub}>
                      {giveaway.retailValueInr > 0 ? `Est. Value: ${formatInr(giveaway.retailValueInr)}` : 'Official Platform Pool'}
                    </span>
                  </div>
                  <div className={styles.stageParticipantsBadge}>
                    <Users size={13} aria-hidden="true" />
                    <span>{giveaway.participantCount?.toLocaleString() || 0} Joined</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Benefits Strip */}
          <div className={styles.bottomBenefitsRow}>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIconBox}>
                <Award size={18} aria-hidden="true" />
              </div>
              <div className={styles.benefitContent}>
                <h4 className={styles.benefitTitle}>Verified Draws</h4>
                <p className={styles.benefitText}>Provably fair random winner selection algorithm</p>
              </div>
            </div>

            <div className={styles.benefitCard}>
              <div className={styles.benefitIconBox}>
                <Coins size={18} aria-hidden="true" />
              </div>
              <div className={styles.benefitContent}>
                <h4 className={styles.benefitTitle}>Zero Cash Fees</h4>
                <p className={styles.benefitText}>Join directly using your VELOOP balance</p>
              </div>
            </div>

            <div className={styles.benefitCard}>
              <div className={styles.benefitIconBox}>
                <ShieldCheck size={18} aria-hidden="true" />
              </div>
              <div className={styles.benefitContent}>
                <h4 className={styles.benefitTitle}>Authentic Rewards</h4>
                <p className={styles.benefitText}>Brand-authorized products &amp; official vouchers</p>
              </div>
            </div>

            <div className={styles.benefitCard}>
              <div className={styles.benefitIconBox}>
                <Sparkles size={18} aria-hidden="true" />
              </div>
              <div className={styles.benefitContent}>
                <h4 className={styles.benefitTitle}>Fast Fulfillment</h4>
                <p className={styles.benefitText}>Tracked delivery &amp; direct digital voucher claims</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
