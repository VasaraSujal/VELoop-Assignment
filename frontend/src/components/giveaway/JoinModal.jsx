import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { giveawayService } from '../../services/giveawayService.js';
import { formatCurrency, formatInr } from '../../utils/currencyFormatter.js';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Coins,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Ticket,
  Lock,
} from 'lucide-react';
import styles from './JoinModal.module.css';

export const JoinModal = ({ giveaway, isOpen, onClose, onSuccess }) => {
  const { balances, isAuthenticated, refreshBalance, login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen || !giveaway) return null;

  const currency = giveaway.entry?.currency || 'VEs';
  const entryFee = giveaway.entry?.amount || 0;
  const currentBalance = balances[currency] ?? 0;
  const hasSufficientBalance = currentBalance >= entryFee;
  const remainingProjected = Math.max(0, currentBalance - entryFee);

  const handleJoinConfirm = async () => {
    if (!isAuthenticated) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await giveawayService.joinGiveaway(giveaway.id || giveaway._id || giveaway.slug);
      setSuccessData(response);
      await refreshBalance();
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete giveaway entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessData(null);
    onClose();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modalCard}>
        {/* Close button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          disabled={submitting}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* 1. SUCCESS STATE ("You're In!") */}
        {successData ? (
          <div className={styles.successContent}>
            <div className={styles.successBadge}>
              <CheckCircle2 size={36} className={styles.checkIcon} />
            </div>

            <div className={styles.celebrationPill}>
              <Sparkles size={14} /> Entry Confirmed
            </div>

            <h2 id="modal-title" className={styles.successTitle}>
              You&apos;re In!
            </h2>
            <p className={styles.successSub}>
              Your entry ticket for <strong>{giveaway.title}</strong> has been authoritatively recorded on the ledger.
            </p>

            <div className={styles.ticketCard}>
              <div className={styles.ticketHeader}>
                <div className={styles.ticketLabel}>
                  <Ticket size={16} /> Official Entry Ticket
                </div>
                <div className={styles.ticketStatus}>CONFIRMED</div>
              </div>

              <div className={styles.ticketBody}>
                <div className={styles.ticketRow}>
                  <span className={styles.tLabel}>Giveaway:</span>
                  <span className={styles.tValue}>{giveaway.prize || giveaway.title}</span>
                </div>
                <div className={styles.ticketRow}>
                  <span className={styles.tLabel}>Fee Deducted:</span>
                  <span className={styles.tValue}>
                    {formatCurrency(successData.entryAmount, successData.entryCurrency)}
                  </span>
                </div>
                <div className={styles.ticketRow}>
                  <span className={styles.tLabel}>Transaction Ref:</span>
                  <span className={`${styles.tValue} ${styles.mono}`}>
                    {successData.transactionRef || 'TX-VERIFIED'}
                  </span>
                </div>
                <div className={styles.ticketRow}>
                  <span className={styles.tLabel}>Updated Balance:</span>
                  <span className={styles.tValueHighlight}>
                    {formatCurrency(successData.remainingBalance, successData.entryCurrency)}
                  </span>
                </div>
              </div>
            </div>

            <button type="button" className={styles.doneBtn} onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          /* 2. CONFIRMATION FLOW */
          <div className={styles.confirmContent}>
            <header className={styles.header}>
              <div className={styles.headerIcon}>
                <Coins size={24} color="var(--color-primary)" />
              </div>
              <div>
                <h2 id="modal-title" className={styles.title}>
                  Confirm Giveaway Entry
                </h2>
                <p className={styles.subTitle}>
                  Review your reward balance deduction before entering the draw.
                </p>
              </div>
            </header>

            {/* Prize preview snapshot */}
            <div className={styles.prizeSnapshot}>
              <img
                src={giveaway.prizeImage || '/assets/prizes/iphone-15-pro.png'}
                alt={giveaway.prize || giveaway.title}
                className={styles.prizeThumb}
              />
              <div className={styles.prizeDetails}>
                <span className={styles.prizeCategory}>{giveaway.prizeType} PRIZE</span>
                <h4 className={styles.prizeName}>{giveaway.prize || giveaway.title}</h4>
                <span className={styles.retailTag}>Retail Value: {formatInr(giveaway.retailValueInr)}</span>
              </div>
            </div>

            {/* Financial deduction ledger preview */}
            <div className={styles.ledgerCard}>
              <div className={styles.ledgerRow}>
                <span className={styles.ledgerLabel}>Required Entry Fee:</span>
                <span className={styles.ledgerFee}>
                  {formatCurrency(entryFee, currency)}
                </span>
              </div>
              <div className={styles.ledgerRow}>
                <span className={styles.ledgerLabel}>Current Authoritative Balance:</span>
                <span className={styles.ledgerBalance}>
                  {formatCurrency(currentBalance, currency)}
                </span>
              </div>
              <div className={styles.divider} />
              <div className={styles.ledgerRow}>
                <span className={styles.ledgerLabel}>Remaining After Deduction:</span>
                <span
                  className={`${styles.ledgerRemaining} ${
                    !hasSufficientBalance ? styles.insufficientText : ''
                  }`}
                >
                  {formatCurrency(remainingProjected, currency)}
                </span>
              </div>
            </div>

            {/* Insufficient balance alert */}
            {!hasSufficientBalance && isAuthenticated && (
              <div className={styles.alertWarning}>
                <AlertTriangle size={18} className={styles.alertIcon} />
                <div className={styles.alertText}>
                  <strong>Insufficient {currency} Balance.</strong> You need{' '}
                  {formatCurrency(entryFee - currentBalance, currency)} more to join this pool.
                </div>
              </div>
            )}

            {/* Unauthenticated prompt */}
            {!isAuthenticated && (
              <div className={styles.alertWarning}>
                <Lock size={18} className={styles.alertIcon} />
                <div className={styles.alertText}>
                  <strong>Authentication Required.</strong> Please select a demo account to join this giveaway.
                </div>
                <button
                  type="button"
                  className={styles.quickLoginBtn}
                  onClick={() => login('user_alex')}
                >
                  Log in as Alex (VIP)
                </button>
              </div>
            )}

            {/* Error Message if API fails */}
            {error && (
              <div className={styles.alertError}>
                <AlertTriangle size={18} className={styles.alertIcon} />
                <div className={styles.alertText}>{error}</div>
              </div>
            )}

            {/* Trust Footer */}
            <div className={styles.trustNote}>
              <ShieldCheck size={14} color="#10b981" />
              <span>Provably fair draw • Non-refundable authoritative deduction</span>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleJoinConfirm}
                disabled={submitting || !hasSufficientBalance || !isAuthenticated}
              >
                {submitting ? (
                  <span className={styles.loadingSpinner}>
                    <span className={styles.miniSpinner} />
                    Joining Giveaway...
                  </span>
                ) : (
                  <>
                    <span>Confirm & Enter Draw</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinModal;
