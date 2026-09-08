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
  FileText,
  AlertCircle,
  Clock,
  Ticket,
  Trophy,
  Gift,
  Truck,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { giveawayService } from '../../services/giveawayService.js';
import { formatCurrency, formatInr } from '../../utils/currencyFormatter.js';
import CountdownTimer from '../../components/giveaway/CountdownTimer.jsx';
import JoinModal from '../../components/giveaway/JoinModal.jsx';
import PrizeClaimModal from '../../components/giveaway/PrizeClaimModal.jsx';
import VeloopLoader from '../../components/common/VeloopLoader.jsx';
import styles from './GiveawayDetailsPage.module.css';

export const GiveawayDetailsPage = () => {
  const { slug } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [giveaway, setGiveaway] = useState(null);
  const [participationStatus, setParticipationStatus] = useState(null);
  const [claimState, setClaimState] = useState(null);
  const [winnersList, setWinnersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadGiveawayData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await giveawayService.getGiveawayBySlug(slug);
      setGiveaway(data);

      const identifier = data?.id || data?._id || data?.slug || slug;

      // Parallelize status and winner requests
      const promises = [];

      // If user is authenticated, check participation
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

      // If completed or ended, fetch public winners list
      if (data && (data.status === 'COMPLETED' || data.status === 'ENDED')) {
        promises.push(
          giveawayService
            .getWinners(identifier)
            .then((winners) => setWinnersList(Array.isArray(winners) ? winners : []))
            .catch(() => setWinnersList([]))
        );

        // If authenticated, fetch user's claim status
        if (isAuthenticated) {
          promises.push(
            giveawayService
              .getMyClaim(identifier)
              .then((claimData) => setClaimState(claimData))
              .catch(() => setClaimState(null))
          );
        } else {
          setClaimState(null);
        }
      } else {
        setWinnersList([]);
        setClaimState(null);
      }

      await Promise.all(promises);
    } catch (err) {
      setError(err.message || 'Unable to load giveaway details.');
    } finally {
      setLoading(false);
    }
  }, [slug, isAuthenticated]);

  useEffect(() => {
    loadGiveawayData();
  }, [loadGiveawayData, user?.userId]);

  const handleJoinSuccess = async () => {
    try {
      const identifier = giveaway.id || giveaway._id || giveaway.slug;
      const updatedStatus = await giveawayService.getMyParticipation(identifier);
      setParticipationStatus(updatedStatus);

      setGiveaway((prev) =>
        prev ? { ...prev, participantCount: (prev.participantCount || 0) + 1 } : prev
      );
    } catch (_err) {
      // Non-critical
    }
  };

  const handleClaimSuccess = async () => {
    try {
      const identifier = giveaway.id || giveaway._id || giveaway.slug;
      const updatedClaim = await giveawayService.getMyClaim(identifier);
      setClaimState(updatedClaim);
    } catch (_err) {
      // Non-critical
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loaderWrapper}>
          <VeloopLoader text={`Loading giveaway details for ${slug}...`} />
        </div>
      </main>
    );
  }

  if (error || !giveaway) {
    return (
      <main className={styles.page}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Giveaways
        </Link>
        <div className={styles.errorCard}>
          <AlertCircle size={36} className={styles.errorIcon} />
          <h1 className={styles.errorTitle}>Giveaway Not Found</h1>
          <p className={styles.errorText}>
            {error || `The giveaway "${slug}" could not be located in the database.`}
          </p>
          <div className={styles.errorActions}>
            <button type="button" className={styles.retryBtn} onClick={loadGiveawayData}>
              Try Again
            </button>
            <Link to="/" className={styles.homeBtn}>
              Explore Active Pools
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isParticipating = Boolean(participationStatus?.isParticipating);
  const isActive = giveaway.status === 'ACTIVE';
  const isUpcoming = giveaway.status === 'UPCOMING';
  const isConcluded = giveaway.status === 'COMPLETED' || giveaway.status === 'ENDED';

  const isWinner = Boolean(claimState?.isWinner);
  const canClaim = Boolean(claimState?.canClaim);
  const userFacingStatus = claimState?.userFacingStatus || 'NOT_SUBMITTED';
  const claimDeadline = claimState?.claimDeadline ? new Date(claimState.claimDeadline) : null;

  return (
    <main className={styles.page}>
      {/* Top Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to All Giveaways
        </Link>
      </nav>

      {/* Main Giveaway Showcase Grid */}
      <div className={styles.showcaseGrid}>
        {/* Left Column: Visual Prize Showcase & Badges */}
        <div className={styles.visualCol}>
          <div className={styles.imageCard}>
            <div className={styles.topBadges}>
              <span className={styles.prizeCategoryBadge}>{giveaway.prizeType} REWARD</span>
              <span
                className={`${styles.statusBadge} ${
                  isActive
                    ? styles.statusActive
                    : isUpcoming
                    ? styles.statusUpcoming
                    : styles.statusEnded
                }`}
              >
                {giveaway.status}
              </span>
            </div>

            <div className={styles.imageBox}>
              <img
                src={giveaway.prizeImage || '/assets/prizes/iphone-15-pro.png'}
                alt={giveaway.prize || giveaway.title}
                className={styles.prizeImg}
              />
            </div>

            <div className={styles.retailValueBanner}>
              <span>Official Retail Value:</span>
              <strong>{formatInr(giveaway.retailValueInr)}</strong>
            </div>
          </div>

          {/* Quick Trust Highlights */}
          <div className={styles.trustCard}>
            <div className={styles.trustItem}>
              <ShieldCheck size={18} color="#10b981" />
              <div>
                <div className={styles.trustTitle}>Fair & Transparent</div>
                <div className={styles.trustSub}>
                  Giveaway rules and participation requirements are clearly explained.
                </div>
              </div>
            </div>
            <div className={styles.trustItem}>
              <Sparkles size={18} color="#6366f1" />
              <div>
                <div className={styles.trustTitle}>Secure Participation</div>
                <div className={styles.trustSub}>
                  Authentication, balance validation, and anti-fraud controls protect every entry.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Live Timer, Stats & Join/Claim Action */}
        <div className={styles.infoCol}>
          <div className={styles.headerBlock}>
            <h1 className={styles.giveawayTitle}>{giveaway.title}</h1>
            <p className={styles.giveawayDescription}>{giveaway.description}</p>
          </div>

          {/* Live Countdown Component */}
          <div className={styles.timerSection}>
            <div className={styles.timerHeader}>
              <Clock size={16} color="var(--color-primary)" />
              <span>
                {isActive ? 'Pool Closes In' : isUpcoming ? 'Pool Opens In' : 'Pool Status'}
              </span>
            </div>
            <CountdownTimer
              startsAt={giveaway.startsAt}
              endsAt={giveaway.endsAt}
              status={giveaway.status}
              theme="light"
            />
          </div>

          {/* Core Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Entry Fee</span>
              <span className={styles.metricValueHighlight}>
                {formatCurrency(giveaway.entry?.amount, giveaway.entry?.currency)}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Winners</span>
              <span className={styles.metricValue}>
                <Award size={15} color="var(--color-primary)" />
                {giveaway.winnerCount} Winner(s)
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Participants</span>
              <span className={styles.metricValue}>
                <Users size={15} color="var(--color-text-secondary)" />
                {giveaway.participantCount?.toLocaleString()} Entered
              </span>
            </div>
          </div>

          {/* 1. AUTHENTICATED WINNER CELEBRATION & STATUS TRACKER */}
          {authLoading ? (
            <div className={styles.authLoadingSkeleton} />
          ) : isWinner ? (
            <div className={styles.winnerCelebrationBanner}>
              <div className={styles.winnerCelebrationHeader}>
                <div className={styles.winnerIconCircle}>
                  <Trophy size={24} />
                </div>
                <div className={styles.winnerHeaderText}>
                  <div className={styles.winnerBadgeRow}>
                    <span className={styles.winnerPill}>
                      <Sparkles size={12} /> Winner Drawn
                    </span>
                    {claimDeadline && canClaim && (
                      <span className={styles.deadlineToBadge}>
                        <Clock size={12} /> Claim before {claimDeadline.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <h3 className={styles.winnerTitle}>
                    🎉 Congratulations! You Won This Giveaway!
                  </h3>
                  <p className={styles.winnerSub}>
                    {canClaim
                      ? `You were drawn as Rank #${claimState.winnerRank || 1} for ${claimState.prizeName}. Click below to submit your claim.`
                      : `Your prize claim for ${claimState.prizeName} is logged.`}
                  </p>
                </div>
              </div>

              {/* Status lifecycle stepper for submitted claims */}
              {userFacingStatus !== 'NOT_SUBMITTED' && userFacingStatus !== 'EXPIRED' && userFacingStatus !== 'REJECTED' && (
                <div className={styles.trackerBox}>
                  <div className={styles.trackerTitle}>Claim Fulfillment Status</div>
                  <div className={styles.trackerSteps}>
                    <div className={styles.trackerLine} />
                    <div className={styles.trackerStep}>
                      <div className={`${styles.stepDot} ${styles.stepCompleted}`}>✓</div>
                      <span className={`${styles.stepLabel} ${styles.stepLabelActive}`}>Submitted</span>
                    </div>
                    <div className={styles.trackerStep}>
                      <div
                        className={`${styles.stepDot} ${
                          userFacingStatus === 'PROCESSING' || userFacingStatus === 'DISPATCHED' || userFacingStatus === 'COMPLETED'
                            ? styles.stepCompleted
                            : styles.stepCurrent
                        }`}
                      >
                        {userFacingStatus === 'PROCESSING' || userFacingStatus === 'DISPATCHED' || userFacingStatus === 'COMPLETED' ? '✓' : '2'}
                      </div>
                      <span className={`${styles.stepLabel} ${userFacingStatus === 'PROCESSING' ? styles.stepLabelActive : ''}`}>
                        Processing
                      </span>
                    </div>
                    <div className={styles.trackerStep}>
                      <div
                        className={`${styles.stepDot} ${
                          userFacingStatus === 'DISPATCHED' || userFacingStatus === 'COMPLETED'
                            ? styles.stepCompleted
                            : ''
                        }`}
                      >
                        {userFacingStatus === 'DISPATCHED' || userFacingStatus === 'COMPLETED' ? '✓' : '3'}
                      </div>
                      <span className={`${styles.stepLabel} ${userFacingStatus === 'DISPATCHED' ? styles.stepLabelActive : ''}`}>
                        Dispatched
                      </span>
                    </div>
                    <div className={styles.trackerStep}>
                      <div className={`${styles.stepDot} ${userFacingStatus === 'COMPLETED' ? styles.stepCompleted : ''}`}>
                        {userFacingStatus === 'COMPLETED' ? '✓' : '4'}
                      </div>
                      <span className={`${styles.stepLabel} ${userFacingStatus === 'COMPLETED' ? styles.stepLabelActive : ''}`}>
                        Completed
                      </span>
                    </div>
                  </div>

                  {/* Safe dispatched details without fabricating */}
                  {userFacingStatus === 'DISPATCHED' && (claimState?.claim?.courier || claimState?.claim?.trackingNumber) && (
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

              {/* Expired alert */}
              {userFacingStatus === 'EXPIRED' && (
                <div className={styles.winnerAlertExpired}>
                  <AlertTriangle size={20} />
                  <div>
                    <strong>Claim Window Expired:</strong> The official deadline to claim this reward has passed.
                  </div>
                </div>
              )}

              {/* Rejected alert */}
              {userFacingStatus === 'REJECTED' && (
                <div className={styles.winnerAlertRejected}>
                  <AlertCircle size={20} />
                  <div>
                    <strong>Claim Submission Rejected:</strong> Please reach out to VELOOP support for verification assistance.
                  </div>
                </div>
              )}
            </div>
          ) : isParticipating && isActive ? (
            /* Participation Status Banner (if user already joined active pool) */
            <div className={styles.participationBanner}>
              <div className={styles.pBannerHeader}>
                <CheckCircle2 size={20} color="#10b981" />
                <div>
                  <h4 className={styles.pBannerTitle}>You Are Participating in This Draw!</h4>
                  <p className={styles.pBannerSub}>
                    Your entry ticket is confirmed. Winner will be drawn automatically when the countdown ends.
                  </p>
                </div>
              </div>
              {participationStatus.transactionRef && (
                <div className={styles.txRefRow}>
                  <Ticket size={14} />
                  <span>Ticket Reference:</span>
                  <code>{participationStatus.transactionRef}</code>
                </div>
              )}
            </div>
          ) : null}

          {/* CTA Action Bar */}
          <div className={styles.actionSection}>
            {authLoading ? (
              <div className={styles.authLoadingSkeleton} />
            ) : isActive ? (
              isParticipating ? (
                <button type="button" className={styles.participatingBtn} disabled>
                  <CheckCircle2 size={18} />
                  <span>Already Entered in Pool</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.joinPrimaryBtn}
                  onClick={() => setIsJoinModalOpen(true)}
                  aria-label={`Enter ${giveaway.title} giveaway`}
                >
                  <Sparkles size={18} />
                  <span>
                    Join Giveaway • {formatCurrency(giveaway.entry?.amount, giveaway.entry?.currency)}
                  </span>
                </button>
              )
            ) : isUpcoming ? (
              <button type="button" className={styles.disabledBtn} disabled>
                <span>Opens Soon • Countdown in Progress</span>
              </button>
            ) : isConcluded ? (
              /* Concluded / Completed Giveaway CTA State */
              isWinner ? (
                canClaim ? (
                  <button
                    type="button"
                    className={styles.claimPrimaryBtn}
                    onClick={() => setIsClaimModalOpen(true)}
                    aria-label={`Claim ${claimState?.prizeName || giveaway.title}`}
                  >
                    <Gift size={20} />
                    <span>Claim Your Prize</span>
                    <ArrowRight size={18} />
                  </button>
                ) : userFacingStatus === 'SUBMITTED' ? (
                  <button type="button" className={styles.claimStatusBtn} disabled>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span>Claim Submitted • Under Review</span>
                  </button>
                ) : userFacingStatus === 'PROCESSING' ? (
                  <button type="button" className={styles.claimStatusBtn} disabled>
                    <Clock size={18} color="var(--color-primary)" />
                    <span>Fulfillment in Progress</span>
                  </button>
                ) : userFacingStatus === 'DISPATCHED' ? (
                  <button type="button" className={styles.claimStatusBtn} disabled>
                    <Truck size={18} color="#059669" />
                    <span>Prize Dispatched</span>
                  </button>
                ) : userFacingStatus === 'COMPLETED' ? (
                  <button type="button" className={styles.claimStatusBtn} disabled>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span>Prize Delivered & Verified</span>
                  </button>
                ) : userFacingStatus === 'EXPIRED' ? (
                  <button type="button" className={styles.disabledBtn} disabled>
                    <span>Claim Expired</span>
                  </button>
                ) : (
                  <button type="button" className={styles.disabledBtn} disabled>
                    <span>Claim Status: {userFacingStatus}</span>
                  </button>
                )
              ) : (
                <button type="button" className={styles.disabledBtn} disabled>
                  <span>Draw Concluded • Winner Selection Finalized</span>
                </button>
              )
            ) : (
              <button type="button" className={styles.disabledBtn} disabled>
                <span>Draw Concluded</span>
              </button>
            )}

            {!isAuthenticated && isActive && !isParticipating && (
              <p className={styles.loginHint}>
                <Info size={13} /> Select a demo account in the top bar to participate with test balances.
              </p>
            )}

            {!isAuthenticated && isConcluded && (
              <p className={styles.loginHint}>
                <Info size={13} /> Log in to verify if you were drawn as a winner for this pool.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. OFFICIAL VERIFIED WINNERS ROSTER (For Concluded Pools) */}
      {isConcluded && winnersList.length > 0 && (
        <section className={styles.officialWinnersSection} aria-label="Official Winners">
          <div className={styles.winnersCard}>
            <div className={styles.winnersCardHeader}>
              <div className={styles.winnersCardTitle}>
                <Trophy size={20} color="var(--color-primary)" />
                <span>Official Verified Winners ({winnersList.length})</span>
              </div>
              <span className={styles.winnerPill}>
                <ShieldCheck size={13} /> Cryptographic Random Draw
              </span>
            </div>

            <div className={styles.winnerRosterList}>
              {winnersList.map((win, idx) => (
                <div key={win.userId || win.userHandle || idx} className={styles.winnerItem}>
                  <div className={styles.winnerMain}>
                    <span className={styles.winnerRankBadge}>Rank #{win.rank || idx + 1}</span>
                    <div>
                      <div className={styles.winnerHandle}>{win.userHandle || 'Verified Winner'}</div>
                      <div className={styles.winnerMaskedId}>{win.maskedUserId || 'Identity Protected'}</div>
                    </div>
                  </div>
                  <div className={styles.winnerMeta}>
                    <span className={styles.winnerDrawDate}>
                      {win.drawnAt ? new Date(win.drawnAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Drawn'}
                    </span>
                    <span className={styles.winnerStatusPill}>
                      {win.statusLabel || (win.claimStatus === 'FULFILLED' ? 'Delivered' : win.claimStatus === 'CLAIMED' ? 'Claimed' : 'Drawn')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Deep Details Navigation Tabs */}
      <section className={styles.tabsSection}>
        <div className={styles.tabsNav} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FileText size={16} /> How It Works & Rules
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'specs'}
            className={`${styles.tabBtn} ${activeTab === 'specs' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            <Info size={16} /> Prize Specifications
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'eligibility'}
            className={`${styles.tabBtn} ${activeTab === 'eligibility' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('eligibility')}
          >
            <ShieldCheck size={16} /> Eligibility & Terms
          </button>
        </div>

        <div className={styles.tabContentCard}>
          {activeTab === 'overview' && (
            <div className={styles.tabBody}>
              <h3 className={styles.tabHeading}>How this Giveaway Works</h3>
              <div className={styles.stepGrid}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <h4 className={styles.stepTitle}>Enter the Pool</h4>
                  <p className={styles.stepText}>
                    Use your earned {giveaway.entry?.currency} reward balance to enter. Fee is securely deducted upon confirmation.
                  </p>
                </div>
                <div className={styles.stepNumberDivider} />
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <h4 className={styles.stepTitle}>Cryptographic Random Draw</h4>
                  <p className={styles.stepText}>
                    When the countdown timer expires, an automated cryptographic random draw chooses {giveaway.winnerCount} lucky winner(s).
                  </p>
                </div>
                <div className={styles.stepNumberDivider} />
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <h4 className={styles.stepTitle}>Instant Claim</h4>
                  <p className={styles.stepText}>
                    Winners receive instant app notifications to claim their prize via doorstep courier or digital voucher code.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className={styles.tabBody}>
              <h3 className={styles.tabHeading}>Prize Specifications</h3>
              <p className={styles.tabLeadText}>{giveaway.prize}</p>
              {giveaway.specifications && Object.keys(giveaway.specifications).length > 0 ? (
                <div className={styles.specsTable}>
                  {Object.entries(giveaway.specifications).map(([key, value]) => (
                    <div key={key} className={styles.specsRow}>
                      <span className={styles.specsKey}>{key}</span>
                      <span className={styles.specsVal}>{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyNotice}>
                  Full manufacturer specifications included upon fulfillment.
                </p>
              )}
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div className={styles.tabBody}>
              <h3 className={styles.tabHeading}>Eligibility & Official Guidelines</h3>
              <div className={styles.eligibilityBlock}>
                <div className={styles.eligibilityRow}>
                  <strong>Account Tier:</strong>
                  <span>Tier {giveaway.eligibility?.minTier || 0}+ required</span>
                </div>
                <div className={styles.eligibilityRow}>
                  <strong>KYC Verification:</strong>
                  <span>
                    {giveaway.eligibility?.requiresKyc
                      ? 'Mandatory for prize dispatch'
                      : 'Not required for entry'}
                  </span>
                </div>
                <div className={styles.eligibilityRow}>
                  <strong>Claim Fulfillment:</strong>
                  <span>{giveaway.claimType?.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className={styles.termsBox}>
                <h4>Official Terms & Disclaimers:</h4>
                <p>
                  {giveaway.terms ||
                    'Standard VELOOP Rewards platform rules apply. Single entry per user per pool.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Join Confirmation Modal */}
      <JoinModal
        giveaway={giveaway}
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
      />

    </main>
  );
};

export default GiveawayDetailsPage;
