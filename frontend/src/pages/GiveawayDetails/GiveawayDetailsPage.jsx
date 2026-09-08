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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { giveawayService } from '../../services/giveawayService.js';
import { formatCurrency, formatInr } from '../../utils/currencyFormatter.js';
import CountdownTimer from '../../components/giveaway/CountdownTimer.jsx';
import JoinModal from '../../components/giveaway/JoinModal.jsx';
import VeloopLoader from '../../components/common/VeloopLoader.jsx';
import styles from './GiveawayDetailsPage.module.css';

export const GiveawayDetailsPage = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [giveaway, setGiveaway] = useState(null);
  const [participationStatus, setParticipationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadGiveawayData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await giveawayService.getGiveawayBySlug(slug);
      setGiveaway(data);

      // If user is authenticated, check participation status
      if (data && (data.id || data._id)) {
        try {
          const status = await giveawayService.getMyParticipation(data.id || data._id || data.slug);
          setParticipationStatus(status);
        } catch (_statusErr) {
          setParticipationStatus(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load giveaway details.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadGiveawayData();
  }, [loadGiveawayData, user?.userId]);

  const handleJoinSuccess = async () => {
    // Refresh giveaway and status
    try {
      const updatedStatus = await giveawayService.getMyParticipation(
        giveaway.id || giveaway._id || giveaway.slug
      );
      setParticipationStatus(updatedStatus);

      // Increment local participant count
      setGiveaway((prev) =>
        prev ? { ...prev, participantCount: (prev.participantCount || 0) + 1 } : prev
      );
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
                  isActive ? styles.statusActive : isUpcoming ? styles.statusUpcoming : styles.statusEnded
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
                <div className={styles.trustSub}>Giveaway rules and participation requirements are clearly explained.</div>
              </div>
            </div>
            <div className={styles.trustItem}>
              <Sparkles size={18} color="#6366f1" />
              <div>
                <div className={styles.trustTitle}>Secure Participation</div>
                <div className={styles.trustSub}>Authentication, balance validation and anti-fraud controls protect every entry.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Live Timer, Stats & Join Action */}
        <div className={styles.infoCol}>
          <div className={styles.headerBlock}>
            <h1 className={styles.giveawayTitle}>{giveaway.title}</h1>
            <p className={styles.giveawayDescription}>{giveaway.description}</p>
          </div>

          {/* Live Countdown Component */}
          <div className={styles.timerSection}>
            <div className={styles.timerHeader}>
              <Clock size={16} color="var(--color-primary)" />
              <span>{isActive ? 'Pool Closes In' : isUpcoming ? 'Pool Opens In' : 'Pool Status'}</span>
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

          {/* Participation Status Banner (if user already joined) */}
          {isParticipating ? (
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
            {isActive ? (
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
            ) : (
              <button type="button" className={styles.disabledBtn} disabled>
                <span>Draw Concluded • Winner Selection Finalized</span>
              </button>
            )}

            {!isAuthenticated && isActive && !isParticipating && (
              <p className={styles.loginHint}>
                <Info size={13} /> Select a demo account in the top bar to participate with test balances.
              </p>
            )}
          </div>
        </div>
      </div>

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
                  <h4 className={styles.stepTitle}>Provably Fair Draw</h4>
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
                <p className={styles.emptyNotice}>Full manufacturer specifications included upon fulfillment.</p>
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
                  <span>{giveaway.eligibility?.requiresKyc ? 'Mandatory for prize dispatch' : 'Not required for entry'}</span>
                </div>
                <div className={styles.eligibilityRow}>
                  <strong>Claim Fulfillment:</strong>
                  <span>{giveaway.claimType?.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className={styles.termsBox}>
                <h4>Official Terms & Disclaimers:</h4>
                <p>{giveaway.terms || 'Standard VELOOP Rewards platform rules apply. Single entry per user per pool.'}</p>
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
