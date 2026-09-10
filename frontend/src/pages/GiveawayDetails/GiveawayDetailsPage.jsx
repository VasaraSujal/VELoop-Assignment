import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Users,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ticket,
  Trophy,
  Gift,
  Truck,
  ArrowRight,
  AlertTriangle,
  Coins,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { giveawayService } from '../../services/giveawayService.js';
import { formatCurrency, formatInr, formatNumber } from '../../utils/currencyFormatter.js';
import CountdownTimer from '../../components/giveaway/CountdownTimer.jsx';
import GiveawayCard from '../../components/giveaway/GiveawayCard.jsx';
import JoinModal from '../../components/giveaway/JoinModal.jsx';
import PrizeClaimModal from '../../components/giveaway/PrizeClaimModal.jsx';
import { StatusBadge } from '../../components/common/ui/StatusBadge.jsx';
import { Badge } from '../../components/common/ui/Badge.jsx';
import { Button } from '../../components/common/ui/Button.jsx';
import { Skeleton } from '../../components/common/ui/Skeleton.jsx';
import { resolvePrizeImage } from '../../utils/prizeImageHelper.js';
import styles from './GiveawayDetailsPage.module.css';

/**
 * Stage G: Production-Quality Individual Giveaway Details Page (/giveaway/:slug)
 * Displays authoritative giveaway prize overview, live countdown, balance preview,
 * participation states, prize specifications, rules, important info, and winner states.
 */
export const GiveawayDetailsPage = () => {
  const { slug } = useParams();
  const { user, balances, isAuthenticated, loading: authLoading } = useAuth();

  const [giveaway, setGiveaway] = useState(null);
  const [relatedGiveaways, setRelatedGiveaways] = useState([]);
  const [participationStatus, setParticipationStatus] = useState(null);
  const [claimState, setClaimState] = useState(null);
  const [winnersList, setWinnersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);

  // Load authoritative giveaway data from backend
  const loadGiveawayData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await giveawayService.getGiveawayBySlug(slug);
      if (!data) {
        throw new Error(`Giveaway "${slug}" not found.`);
      }
      setGiveaway(data);

      const identifier = data.id || data._id || data.slug || slug;
      const promises = [];

      // 1. Check user participation status if logged in
      if (isAuthenticated) {
        promises.push(
          giveawayService
            .getMyParticipation(identifier)
            .then((status) => setParticipationStatus(status))
            .catch(() => setParticipationStatus(null))
        );
      } else {
        setParticipationStatus(null);
      }

      // 2. If concluded, fetch authoritative public winners & user claim state
      if (data.status === 'COMPLETED' || data.status === 'ENDED') {
        promises.push(
          giveawayService
            .getWinners(identifier)
            .then((winners) => setWinnersList(Array.isArray(winners) ? winners : []))
            .catch(() => setWinnersList([]))
        );

        if (isAuthenticated) {
          promises.push(
            giveawayService
              .getMyClaim(identifier)
              .then((claim) => setClaimState(claim))
              .catch(() => setClaimState(null))
          );
        } else {
          setClaimState(null);
        }
      } else {
        setWinnersList([]);
        setClaimState(null);
      }

      // 3. Fetch related active giveaways for discovery strip
      promises.push(
        giveawayService
          .getCurrentGiveaways()
          .then((pools) => {
            if (Array.isArray(pools)) {
              // Filter out current giveaway and take up to 3
              const filtered = pools.filter(
                (p) => p.slug !== slug && (p.id || p._id) !== identifier
              );
              setRelatedGiveaways(filtered.slice(0, 3));
            }
          })
          .catch(() => setRelatedGiveaways([]))
      );

      await Promise.all(promises);
    } catch (err) {
      setError(err.message || 'Unable to load this giveaway.');
    } finally {
      setLoading(false);
    }
  }, [slug, isAuthenticated]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadGiveawayData();
  }, [loadGiveawayData, user?.userId]);

  // Handle successful join action
  const handleJoinSuccess = async () => {
    try {
      const identifier = giveaway.id || giveaway._id || giveaway.slug;
      const updatedStatus = await giveawayService.getMyParticipation(identifier);
      setParticipationStatus(updatedStatus);

      setGiveaway((prev) =>
        prev ? { ...prev, participantCount: (prev.participantCount || 0) + 1 } : prev
      );
    } catch (_err) {
      // Non-critical background refresh failure
    }
  };

  // Handle successful prize claim submission
  const handleClaimSuccess = async () => {
    try {
      const identifier = giveaway.id || giveaway._id || giveaway.slug;
      const updatedClaim = await giveawayService.getMyClaim(identifier);
      setClaimState(updatedClaim);
    } catch (_err) {
      // Non-critical background refresh failure
    }
  };

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.backNav}>
            <Skeleton width="160px" height="24px" />
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.visualCol}>
              <div className={styles.imageCardSkeleton}>
                <Skeleton width="100%" height="340px" borderRadius="var(--radius-xl)" />
              </div>
            </div>

            <div className={styles.infoCol}>
              <div className={styles.skeletonHeader}>
                <Skeleton width="120px" height="22px" borderRadius="var(--radius-full)" />
                <Skeleton width="90%" height="38px" />
                <Skeleton width="75%" height="20px" />
              </div>
              <Skeleton width="100%" height="80px" borderRadius="var(--radius-lg)" />
              <div className={styles.metricsSkeletonGrid}>
                <Skeleton height="72px" borderRadius="var(--radius-md)" />
                <Skeleton height="72px" borderRadius="var(--radius-md)" />
                <Skeleton height="72px" borderRadius="var(--radius-md)" />
              </div>
              <Skeleton width="100%" height="56px" borderRadius="var(--radius-lg)" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 2. Error / Not Found State
  if (error || !giveaway) {
    const isNotFound = !error || error.toLowerCase().includes('not found') || error.toLowerCase().includes('404');

    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <nav aria-label="Breadcrumb" className={styles.backNav}>
            <Link to="/" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to Giveaways</span>
            </Link>
          </nav>

          <div className={styles.errorCard} role="alert">
            <div className={styles.errorIconWrap}>
              <AlertCircle size={36} className={styles.errorIcon} />
            </div>
            <h1 className={styles.errorTitle}>
              {isNotFound ? 'Giveaway not found' : "We couldn't load this giveaway right now"}
            </h1>
            <p className={styles.errorText}>
              {isNotFound
                ? 'This reward pool may no longer be available.'
                : 'Please check your connection and try again.'}
            </p>
            <div className={styles.errorActions}>
              {!isNotFound && (
                <Button variant="primary" size="md" onClick={loadGiveawayData}>
                  Try Again
                </Button>
              )}
              <Link to="/">
                <Button variant={isNotFound ? 'primary' : 'outline'} size="md">
                  Explore Giveaways
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Authoritative status & participation calculations
  const isActive = giveaway.status === 'ACTIVE';
  const isUpcoming = giveaway.status === 'UPCOMING';
  const isConcluded = giveaway.status === 'COMPLETED' || giveaway.status === 'ENDED';
  const isParticipating = Boolean(participationStatus?.isParticipating);

  const currency = giveaway.entry?.currency || 'VEs';
  const entryAmount = giveaway.entry?.amount || 0;
  const userBalance = balances[currency] ?? 0;
  const hasSufficientBalance = userBalance >= entryAmount;
  const balanceShortage = Math.max(0, entryAmount - userBalance);
  const remainingProjected = Math.max(0, userBalance - entryAmount);

  // Winner calculation
  const isWinner = Boolean(claimState?.isWinner);
  const canClaim = Boolean(claimState?.canClaim);
  const userFacingStatus = claimState?.userFacingStatus || 'NOT_SUBMITTED';
  const claimDeadline = claimState?.claimDeadline ? new Date(claimState.claimDeadline) : null;

  // Currency badge variant
  let currencyVariant = 'ves';
  if (currency === 'SVEs') currencyVariant = 'sves';
  else if (currency === 'Tokens') currencyVariant = 'tokens';

  // Format dates cleanly
  const formattedStartDate = giveaway.startsAt
    ? new Date(giveaway.startsAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Announced on Platform';

  const formattedEndDate = giveaway.endsAt
    ? new Date(giveaway.endsAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Platform Schedule';

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Top Navigation / Back Link */}
        <nav aria-label="Breadcrumb" className={styles.backNav}>
          <Link to="/" className={styles.backLink} aria-label="Return to all giveaways">
            <ArrowLeft size={16} aria-hidden="true" />
            <span className={styles.backLinkDesktop}>Back to Giveaways</span>
            <span className={styles.backLinkMobile}>Back</span>
          </Link>
        </nav>

        {/* 1. HERO SHOWCASE (Two-column Desktop Layout) */}
        <section className={styles.heroGrid} aria-label="Giveaway prize overview">
          {/* Left Column: Visual Prize Card */}
          <div className={styles.visualCol}>
            <div className={styles.imageCard}>
              <div className={styles.topBadges}>
                <Badge variant={currencyVariant} size="sm">
                  {giveaway.prizeType || 'EXCLUSIVE'} REWARD
                </Badge>
                <StatusBadge status={giveaway.status} size="md" />
              </div>

              <div className={styles.imageBox}>
                <img
                  src={resolvePrizeImage(giveaway.prize, giveaway.title, giveaway.prizeImage)}
                  alt={giveaway.prize || giveaway.title}
                  className={styles.prizeImg}
                />
              </div>

              {giveaway.retailValueInr > 0 && (
                <div className={styles.retailValueBanner}>
                  <span className={styles.retailLabel}>Official Retail Value:</span>
                  <strong className={styles.retailAmount}>
                    {formatInr(giveaway.retailValueInr)}
                  </strong>
                </div>
              )}
            </div>

            {/* Quick Trust / Confidence Highlights */}
            <div className={styles.trustCard}>
              <div className={styles.trustItem}>
                <ShieldCheck size={18} className={styles.trustIconGreen} aria-hidden="true" />
                <div className={styles.trustText}>
                  <strong className={styles.trustTitle}>Transparent Rules</strong>
                  <span className={styles.trustSub}>
                    Official pool parameters and winner counts are finalized in advance.
                  </span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <Sparkles size={18} className={styles.trustIconIndigo} aria-hidden="true" />
                <div className={styles.trustText}>
                  <strong className={styles.trustTitle}>Authentic Platform Rewards</strong>
                  <span className={styles.trustSub}>
                    Fulfillments are managed directly through authorized brand channels.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Live Countdown, Metrics & Participation Action */}
          <div className={styles.infoCol}>
            <div className={styles.headerBlock}>
              <div className={styles.categoryEyebrow}>
                <span>{giveaway.prizeType || 'EXCLUSIVE'} POOL</span>
              </div>
              <h1 className={styles.giveawayTitle}>{giveaway.title}</h1>
              <p className={styles.giveawayDescription}>{giveaway.description}</p>
            </div>

            {/* Live Countdown Component */}
            <div className={styles.timerSection}>
              <CountdownTimer
                startsAt={giveaway.startsAt}
                endsAt={giveaway.endsAt}
                status={giveaway.status}
                theme="light"
                customLabel={
                  isActive
                    ? 'Giveaway Ends In'
                    : isUpcoming
                    ? 'Giveaway Starts In'
                    : 'Pool Status'
                }
              />
            </div>

            {/* Scannable Metrics Grid */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>
                  <Coins size={13} className={styles.metricIcon} aria-hidden="true" />
                  Entry Fee
                </span>
                <span className={styles.metricValueHighlight}>
                  {formatCurrency(entryAmount, currency)}
                </span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>
                  <Award size={13} className={styles.metricIcon} aria-hidden="true" />
                  Winners Drawn
                </span>
                <span className={styles.metricValue}>
                  {giveaway.winnerCount} {giveaway.winnerCount === 1 ? 'Winner' : 'Winners'}
                </span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>
                  <Users size={13} className={styles.metricIcon} aria-hidden="true" />
                  Participants
                </span>
                <span className={styles.metricValue}>
                  {formatNumber(giveaway.participantCount || 0)} Entered
                </span>
              </div>
            </div>

            {/* Balance Preview Card (For Authenticated Users on Active Pools) */}
            {isAuthenticated && isActive && (
              <div className={styles.balancePreviewCard}>
                <div className={styles.balanceHeader}>
                  <span className={styles.balanceHeaderText}>Reward Balance Summary</span>
                  <span className={styles.balanceBadge}>Preview</span>
                </div>

                <div className={styles.balanceGrid}>
                  <div className={styles.balanceItem}>
                    <span className={styles.balanceItemLabel}>Your Balance</span>
                    <strong className={styles.balanceItemValue}>
                      {formatCurrency(userBalance, currency)}
                    </strong>
                  </div>
                  <div className={styles.balanceDivider} aria-hidden="true" />
                  <div className={styles.balanceItem}>
                    <span className={styles.balanceItemLabel}>Entry Fee</span>
                    <strong className={styles.balanceItemFee}>
                      {formatCurrency(entryAmount, currency)}
                    </strong>
                  </div>
                  <div className={styles.balanceDivider} aria-hidden="true" />
                  <div className={styles.balanceItem}>
                    <span className={styles.balanceItemLabel}>
                      {isParticipating ? 'Balance Left' : 'After Entry'}
                    </span>
                    <strong
                      className={`${styles.balanceItemValue} ${
                        !hasSufficientBalance && !isParticipating
                          ? styles.balanceItemShortage
                          : ''
                      }`}
                    >
                      {isParticipating
                        ? formatCurrency(userBalance, currency)
                        : formatCurrency(remainingProjected, currency)}
                    </strong>
                  </div>
                </div>

                {!hasSufficientBalance && !isParticipating && (
                  <div className={styles.shortageNotice} role="alert">
                    <AlertTriangle size={15} className={styles.shortageIcon} />
                    <span>
                      You need <strong>{formatCurrency(balanceShortage, currency)}</strong> more to
                      join this giveaway.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 2. AUTHENTICATED WINNER CELEBRATION BANNER (If Winner) */}
            {authLoading ? (
              <div className={styles.authLoadingSkeleton}>
                <Skeleton width="100%" height="48px" borderRadius="var(--radius-lg)" />
              </div>
            ) : isWinner ? (
              <div className={styles.winnerCelebrationBanner} role="status">
                <div className={styles.winnerCelebrationHeader}>
                  <div className={styles.winnerIconCircle}>
                    <Trophy size={24} aria-hidden="true" />
                  </div>
                  <div className={styles.winnerHeaderText}>
                    <div className={styles.winnerBadgeRow}>
                      <span className={styles.winnerPill}>
                        <Sparkles size={12} /> Winner Selected
                      </span>
                      {claimDeadline && canClaim && (
                        <span className={styles.deadlineToBadge}>
                          <Clock size={12} /> Claim before{' '}
                          {claimDeadline.toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className={styles.winnerTitle}>
                      🎉 Congratulations! You Won This Giveaway!
                    </h3>
                    <p className={styles.winnerSub}>
                      {canClaim
                        ? `You were drawn as Rank #${claimState.winnerRank || 1} for ${
                            claimState.prizeName || giveaway.title
                          }. Click below to submit your claim.`
                        : `Your prize claim for ${
                            claimState.prizeName || giveaway.title
                          } is recorded.`}
                    </p>
                  </div>
                </div>

                {/* Fulfillment Status Lifecycle Stepper for Submitted Claims */}
                {userFacingStatus !== 'NOT_SUBMITTED' &&
                  userFacingStatus !== 'EXPIRED' &&
                  userFacingStatus !== 'REJECTED' && (
                    <div className={styles.trackerBox}>
                      <div className={styles.trackerTitle}>Claim Fulfillment Status</div>
                      <div className={styles.trackerSteps}>
                        <div className={styles.trackerLine} />
                        <div className={styles.trackerStep}>
                          <div className={`${styles.stepDot} ${styles.stepCompleted}`}>✓</div>
                          <span className={`${styles.stepLabel} ${styles.stepLabelActive}`}>
                            Submitted
                          </span>
                        </div>
                        <div className={styles.trackerStep}>
                          <div
                            className={`${styles.stepDot} ${
                              userFacingStatus === 'PROCESSING' ||
                              userFacingStatus === 'DISPATCHED' ||
                              userFacingStatus === 'COMPLETED'
                                ? styles.stepCompleted
                                : styles.stepCurrent
                            }`}
                          >
                            {userFacingStatus === 'PROCESSING' ||
                            userFacingStatus === 'DISPATCHED' ||
                            userFacingStatus === 'COMPLETED'
                              ? '✓'
                              : '2'}
                          </div>
                          <span
                            className={`${styles.stepLabel} ${
                              userFacingStatus === 'PROCESSING' ? styles.stepLabelActive : ''
                            }`}
                          >
                            Processing
                          </span>
                        </div>
                        <div className={styles.trackerStep}>
                          <div
                            className={`${styles.stepDot} ${
                              userFacingStatus === 'DISPATCHED' ||
                              userFacingStatus === 'COMPLETED'
                                ? styles.stepCompleted
                                : ''
                            }`}
                          >
                            {userFacingStatus === 'DISPATCHED' ||
                            userFacingStatus === 'COMPLETED'
                              ? '✓'
                              : '3'}
                          </div>
                          <span
                            className={`${styles.stepLabel} ${
                              userFacingStatus === 'DISPATCHED' ? styles.stepLabelActive : ''
                            }`}
                          >
                            Dispatched
                          </span>
                        </div>
                        <div className={styles.trackerStep}>
                          <div
                            className={`${styles.stepDot} ${
                              userFacingStatus === 'COMPLETED' ? styles.stepCompleted : ''
                            }`}
                          >
                            {userFacingStatus === 'COMPLETED' ? '✓' : '4'}
                          </div>
                          <span
                            className={`${styles.stepLabel} ${
                              userFacingStatus === 'COMPLETED' ? styles.stepLabelActive : ''
                            }`}
                          >
                            Delivered
                          </span>
                        </div>
                      </div>

                      {userFacingStatus === 'DISPATCHED' &&
                        (claimState?.claim?.courier || claimState?.claim?.trackingNumber) && (
                          <div className={styles.dispatchedDetails}>
                            {claimState.claim.courier && (
                              <div>
                                <strong>Courier:</strong> {claimState.claim.courier}
                              </div>
                            )}
                            {claimState.claim.trackingNumber && (
                              <div>
                                <strong>Tracking #:</strong> {claimState.claim.trackingNumber}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                {userFacingStatus === 'EXPIRED' && (
                  <div className={styles.winnerAlertExpired}>
                    <AlertTriangle size={18} />
                    <span>
                      <strong>Claim window closed:</strong> This prize can no longer be claimed through this form.
                    </span>
                  </div>
                )}

                {userFacingStatus === 'REJECTED' && (
                  <div className={styles.winnerAlertRejected}>
                    <AlertCircle size={18} />
                    <span>
                      <strong>Claim Submission Rejected:</strong> Please reach out to VELOOP
                      support for assistance.
                    </span>
                  </div>
                )}
              </div>
            ) : isParticipating && isActive ? (
              /* Participation Confirmed Banner */
              <div className={styles.participationBanner} role="status">
                <div className={styles.pBannerHeader}>
                  <CheckCircle2 size={20} className={styles.pBannerIcon} aria-hidden="true" />
                  <div>
                    <strong className={styles.pBannerTitle}>
                      You&apos;re Participating in This Draw
                    </strong>
                    <p className={styles.pBannerSub}>
                      Your entry ticket is confirmed. Winners will be selected automatically when
                      the countdown concludes.
                    </p>
                  </div>
                </div>
                {participationStatus?.transactionRef && (
                  <div className={styles.txRefRow}>
                    <Ticket size={14} aria-hidden="true" />
                    <span>Ticket Reference:</span>
                    <code>{participationStatus.transactionRef}</code>
                  </div>
                )}
              </div>
            ) : isParticipating && isConcluded && !isWinner ? (
              /* Non-winner participant state */
              <div className={styles.nonWinnerBanner} role="status">
                <div className={styles.pBannerHeader}>
                  <Info size={20} className={styles.nonWinnerIcon} aria-hidden="true" />
                  <div>
                    <strong className={styles.nonWinnerTitle}>Thanks for Participating</strong>
                    <p className={styles.nonWinnerSub}>
                      The giveaway has concluded and winners have been announced. Check the official
                      winners roster below or explore other active pools.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Primary Participation Action CTA */}
            <div className={styles.actionSection}>
              {authLoading ? (
                <Skeleton width="100%" height="48px" borderRadius="var(--radius-lg)" />
              ) : isActive ? (
                !isAuthenticated ? (
                  /* Guest State */
                  <div className={styles.guestCtaWrap}>
                    <Button variant="secondary" size="lg" fullWidth disabled>
                      Login to Participate
                    </Button>
                    <p className={styles.loginHint}>
                      <Info size={14} aria-hidden="true" />
                      <span>
                        Select a demo profile in the top bar to participate with VELOOP reward
                        balances.
                      </span>
                    </p>
                  </div>
                ) : isParticipating ? (
                  /* Already Participating State */
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    disabled
                    iconLeft={<CheckCircle2 size={18} color="#10b981" />}
                  >
                    Already Entered in Pool
                  </Button>
                ) : !hasSufficientBalance ? (
                  /* Insufficient Balance State */
                  <div className={styles.insufficientCtaWrap}>
                    <Button variant="secondary" size="lg" fullWidth disabled>
                      Insufficient Balance
                    </Button>
                    <p className={styles.insufficientHint}>
                      You need {formatCurrency(balanceShortage, currency)} more {currency} to join.
                    </p>
                  </div>
                ) : (
                  /* Eligible to Join */
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    iconLeft={<Sparkles size={18} />}
                    onClick={() => setIsJoinModalOpen(true)}
                    aria-label={`Enter ${giveaway.title} giveaway`}
                  >
                    Join Giveaway • {formatCurrency(entryAmount, currency)}
                  </Button>
                )
              ) : isUpcoming ? (
                /* Upcoming State */
                <Button variant="secondary" size="lg" fullWidth disabled>
                  Starts Soon • Opens {formattedStartDate}
                </Button>
              ) : isConcluded ? (
                /* Concluded State */
                isWinner ? (
                  canClaim ? (
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      iconLeft={<Gift size={20} />}
                      iconRight={<ArrowRight size={18} />}
                      onClick={() => setIsClaimModalOpen(true)}
                      aria-label={`Claim ${claimState?.prizeName || giveaway.title}`}
                      className={styles.claimPulseBtn}
                    >
                      Claim Your Prize
                    </Button>
                  ) : userFacingStatus === 'SUBMITTED' ? (
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      disabled
                      iconLeft={<CheckCircle2 size={18} color="#10b981" />}
                    >
                      Claim Submitted • Under Review
                    </Button>
                  ) : userFacingStatus === 'PROCESSING' ? (
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      disabled
                      iconLeft={<Clock size={18} color="var(--color-primary)" />}
                    >
                      Fulfillment in Progress
                    </Button>
                  ) : userFacingStatus === 'DISPATCHED' ? (
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      disabled
                      iconLeft={<Truck size={18} color="#059669" />}
                    >
                      Prize Dispatched
                    </Button>
                  ) : userFacingStatus === 'COMPLETED' ? (
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      disabled
                      iconLeft={<CheckCircle2 size={18} color="#10b981" />}
                    >
                      Prize Delivered
                    </Button>
                  ) : userFacingStatus === 'EXPIRED' ? (
                    <Button variant="secondary" size="lg" fullWidth disabled>
                      Claim Window Closed
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" fullWidth disabled>
                      Claim Status: {userFacingStatus}
                    </Button>
                  )
                ) : (
                  <Button variant="secondary" size="lg" fullWidth disabled>
                    Giveaway Concluded • Winners Announced
                  </Button>
                )
              ) : (
                <Button variant="secondary" size="lg" fullWidth disabled>
                  Giveaway Inactive
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* 3. PRIZE DETAILS / "ABOUT THE PRIZE" */}
        <section className={styles.sectionCard} aria-labelledby="about-prize-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <Award size={20} className={styles.sectionIcon} aria-hidden="true" />
              <h2 id="about-prize-title" className={styles.sectionTitle}>
                About the Prize
              </h2>
            </div>
          </div>

          <div className={styles.aboutPrizeContent}>
            <div className={styles.prizeOverview}>
              <div className={styles.prizeNameBadge}>
                <span className={styles.prizeItemName}>
                  {giveaway.prize || giveaway.title}
                </span>
                {giveaway.retailValueInr > 0 && (
                  <span className={styles.prizeItemRetail}>
                    Retail Value: {formatInr(giveaway.retailValueInr)}
                  </span>
                )}
              </div>
              <p className={styles.prizeOverviewText}>
                {giveaway.description ||
                  `Official reward distributed directly through VELOOP verified reward partners.`}
              </p>
            </div>

            {/* Specifications Grid (if available in backend) */}
            {giveaway.specifications && Object.keys(giveaway.specifications).length > 0 ? (
              <div className={styles.specsContainer}>
                <h3 className={styles.specsTitle}>Prize Specifications</h3>
                <div className={styles.specsGrid}>
                  {Object.entries(giveaway.specifications).map(([key, value]) => (
                    <div key={key} className={styles.specCard}>
                      <span className={styles.specKey}>{key}</span>
                      <span className={styles.specVal}>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* 4. HOW THIS GIVEAWAY WORKS */}
        <section className={styles.sectionCard} aria-labelledby="how-it-works-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <FileText size={20} className={styles.sectionIcon} aria-hidden="true" />
              <h2 id="how-it-works-title" className={styles.sectionTitle}>
                How This Giveaway Works
              </h2>
            </div>
          </div>

          <div className={styles.workflowGrid}>
            <div className={styles.workflowStep}>
              <div className={styles.stepNum}>01</div>
              <h3 className={styles.stepHeading}>Review the Giveaway</h3>
              <p className={styles.stepDesc}>
                Inspect the official prize details, required entry balance, and pool schedule.
              </p>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.stepNum}>02</div>
              <h3 className={styles.stepHeading}>Check Eligibility</h3>
              <p className={styles.stepDesc}>
                Ensure your VELOOP account has sufficient reward balance and is in good standing.
              </p>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.stepNum}>03</div>
              <h3 className={styles.stepHeading}>Confirm Entry</h3>
              <p className={styles.stepDesc}>
                Submit your single entry. The required balance is deducted upon confirmation.
              </p>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.stepNum}>04</div>
              <h3 className={styles.stepHeading}>Pool Conclusion</h3>
              <p className={styles.stepDesc}>
                Entries automatically lock when the countdown timer reaches zero.
              </p>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.stepNum}>05</div>
              <h3 className={styles.stepHeading}>Winner Selection</h3>
              <p className={styles.stepDesc}>
                The platform randomly draws {giveaway.winnerCount} winner(s) from all confirmed
                entries.
              </p>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.stepNum}>06</div>
              <h3 className={styles.stepHeading}>Prize Fulfillment</h3>
              <p className={styles.stepDesc}>
                Winners submit required claim details to receive delivery or voucher dispatch.
              </p>
            </div>
          </div>
        </section>

        {/* 5. RULES & ELIGIBILITY */}
        <section className={styles.sectionCard} aria-labelledby="rules-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <ShieldCheck size={20} className={styles.sectionIcon} aria-hidden="true" />
              <h2 id="rules-title" className={styles.sectionTitle}>
                Rules & Eligibility
              </h2>
            </div>
          </div>

          <div className={styles.rulesGrid}>
            <div className={styles.ruleCard}>
              <div className={styles.ruleCardHeader}>
                <CheckCircle2 size={16} className={styles.ruleCheckIcon} aria-hidden="true" />
                <h3 className={styles.ruleCardTitle}>Single Entry Policy</h3>
              </div>
              <p className={styles.ruleCardText}>
                Each authenticated account may enter this giveaway pool exactly once to ensure
                equitable participation.
              </p>
            </div>

            <div className={styles.ruleCard}>
              <div className={styles.ruleCardHeader}>
                <CheckCircle2 size={16} className={styles.ruleCheckIcon} aria-hidden="true" />
                <h3 className={styles.ruleCardTitle}>Reward Balance Required</h3>
              </div>
              <p className={styles.ruleCardText}>
                The entry fee of {formatCurrency(entryAmount, currency)} is deducted directly from
                your available reward balance.
              </p>
            </div>

            <div className={styles.ruleCard}>
              <div className={styles.ruleCardHeader}>
                <CheckCircle2 size={16} className={styles.ruleCheckIcon} aria-hidden="true" />
                <h3 className={styles.ruleCardTitle}>Active Window Only</h3>
              </div>
              <p className={styles.ruleCardText}>
                Entries are only accepted while the pool is in Live status. Upcoming or concluded
                pools do not accept entries.
              </p>
            </div>

            <div className={styles.ruleCard}>
              <div className={styles.ruleCardHeader}>
                <CheckCircle2 size={16} className={styles.ruleCheckIcon} aria-hidden="true" />
                <h3 className={styles.ruleCardTitle}>Claim Requirements</h3>
              </div>
              <p className={styles.ruleCardText}>
                Selected winners must submit accurate delivery address or digital contact info
                within the designated claim window.
              </p>
            </div>
          </div>
        </section>

        {/* 6. IMPORTANT INFORMATION (Expandable Section) */}
        <section className={styles.sectionCard} aria-labelledby="important-info-title">
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setIsInfoExpanded((prev) => !prev)}
            aria-expanded={isInfoExpanded}
            aria-controls="important-info-content"
          >
            <div className={styles.sectionTitleRow}>
              <HelpCircle size={20} className={styles.sectionIcon} aria-hidden="true" />
              <h2 id="important-info-title" className={styles.sectionTitle}>
                Important Information & Terms
              </h2>
            </div>
            <div className={styles.accordionToggle}>
              {isInfoExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {isInfoExpanded && (
            <div id="important-info-content" className={styles.infoContentBody}>
              <div className={styles.infoTable}>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Entry Fee & Currency</span>
                  <span className={styles.infoVal}>
                    {formatCurrency(entryAmount, currency)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Pool Lifecycle Status</span>
                  <span className={styles.infoVal}>{giveaway.status}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Pool Opening Date</span>
                  <span className={styles.infoVal}>{formattedStartDate}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Pool Closing Date</span>
                  <span className={styles.infoVal}>{formattedEndDate}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Winner Allocation</span>
                  <span className={styles.infoVal}>
                    {giveaway.winnerCount} Total Winner(s)
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Fulfillment Method</span>
                  <span className={styles.infoVal}>
                    {giveaway.claimType?.replace(/_/g, ' ') || 'Platform Fulfillment'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Participation Terms</span>
                  <span className={styles.infoVal}>
                    Participation deductions are recorded by the platform as part of the giveaway
                    entry transaction. Single entry per user per pool.
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 7. OFFICIAL WINNERS ROSTER (For Concluded Pools with Winners) */}
        {isConcluded && winnersList.length > 0 && (
          <section className={styles.sectionCard} aria-labelledby="winners-roster-title">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <Trophy size={20} className={styles.sectionIconGold} aria-hidden="true" />
                <h2 id="winners-roster-title" className={styles.sectionTitle}>
                  Official Winners ({winnersList.length})
                </h2>
              </div>
              <span className={styles.winnersBadge}>Concluded Draw</span>
            </div>

            <div className={styles.winnerRosterList}>
              {winnersList.map((win, idx) => (
                <div
                  key={win.id || win.userId || win.userHandle || idx}
                  className={styles.winnerItem}
                >
                  <div className={styles.winnerMain}>
                    <span className={styles.winnerRankBadge}>Rank #{win.rank || idx + 1}</span>
                    <div>
                      <div className={styles.winnerHandle}>
                        {win.userHandle || 'Platform Winner'}
                      </div>
                      <div className={styles.winnerMaskedId}>
                        {win.maskedUserId || 'Identity Protected'}
                      </div>
                    </div>
                  </div>
                  <div className={styles.winnerMeta}>
                    <span className={styles.winnerDrawDate}>
                      {win.drawnAt || win.drawDate
                        ? new Date(win.drawnAt || win.drawDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Drawn'}
                    </span>
                    <span className={styles.winnerStatusPill}>
                      {win.claimStatus === 'FULFILLED' || win.claimStatus === 'DELIVERED'
                        ? 'Delivered'
                        : win.claimStatus === 'CLAIMED' || win.claimStatus === 'PROCESSING'
                        ? 'Claimed'
                        : 'Drawn'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. EXPLORE MORE GIVEAWAYS (Discovery Strip) */}
        {relatedGiveaways.length > 0 && (
          <section className={styles.relatedSection} aria-labelledby="related-title">
            <div className={styles.relatedHeader}>
              <div>
                <h2 id="related-title" className={styles.relatedTitle}>
                  Explore More Giveaways
                </h2>
                <p className={styles.relatedSub}>
                  Browse other active and upcoming reward pools currently live on VELOOP.
                </p>
              </div>
              <Link to="/" className={styles.viewAllLink}>
                <span>View All Pools</span>
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className={styles.relatedGrid}>
              {relatedGiveaways.map((item) => (
                <GiveawayCard key={item.id || item._id || item.slug} giveaway={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Join Confirmation Modal */}
      <JoinModal
        giveaway={giveaway}
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
      />

      {/* Secure Prize Claim Modal */}
      <PrizeClaimModal
        giveaway={giveaway}
        claimState={claimState}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={handleClaimSuccess}
      />
    </main>
  );
};

export default GiveawayDetailsPage;
