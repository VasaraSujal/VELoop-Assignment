import { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Truck,
  ShieldCheck,
  Lock,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { giveawayService } from '../../services/giveawayService.js';
import { Button } from '../common/ui/Button.jsx';
import { Badge } from '../common/ui/Badge.jsx';
import { resolvePrizeImage } from '../../utils/prizeImageHelper.js';
import styles from './PrizeClaimModal.module.css';

/**
 * Production-ready Prize Claim Modal with strict verification, multi-stage forms, and accessible focus trapping.
 */
export const PrizeClaimModal = ({
  isOpen,
  onClose,
  giveaway,
  claimState,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
    email: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Authoritative claimType determined strictly by backend state or giveaway config
  const authoritativeClaimType =
    claimState?.claimType || giveaway?.claimType || 'PHYSICAL_DELIVERY';
  const prizeName = claimState?.prizeName || giveaway?.prize || giveaway?.title || 'Prize Reward';
  const prizeImage = resolvePrizeImage(
    prizeName,
    giveaway?.title || '',
    claimState?.prizeImage || giveaway?.prizeImage
  );
  const claimDeadline = claimState?.claimDeadline ? new Date(claimState.claimDeadline) : null;
  const userFacingStatus = claimState?.userFacingStatus || 'NOT_SUBMITTED';
  const canClaim = Boolean(claimState?.canClaim ?? (userFacingStatus === 'NOT_SUBMITTED'));
  const winnerRank = claimState?.winnerRank || 1;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        email: '',
      });
      setFieldErrors({});
      setApiError(null);
      setSuccessData(null);

      // Focus first input on modal open
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !giveaway) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (authoritativeClaimType === 'PHYSICAL_DELIVERY') {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
        errors.fullName = 'Full recipient name is required (minimum 2 characters).';
      }
      const cleanPhone = formData.phone.replace(/[^0-9+]/g, '');
      if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) {
        errors.phone = 'Valid phone number is required (8–15 digits).';
      }
      if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 5) {
        errors.addressLine1 = 'Street address is required (minimum 5 characters).';
      }
      if (!formData.city.trim() || formData.city.trim().length < 2) {
        errors.city = 'City is required.';
      }
      if (!formData.state.trim() || formData.state.trim().length < 2) {
        errors.state = 'State / Region is required.';
      }
      if (!formData.postalCode.trim() || formData.postalCode.trim().length < 3) {
        errors.postalCode = 'PIN / Postal Code is required.';
      }
    } else if (authoritativeClaimType === 'GIFT_CARD_CODE' || authoritativeClaimType === 'DIGITAL_CREDIT') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
        errors.email = 'Valid recipient email address is required for voucher delivery.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setApiError(null);

    // Strict Security Invariant: Send ONLY legitimate delivery/contact fields
    // NEVER send userId, winnerId, claimId, prizeId, claimType, deadline, or status
    let payload = {};
    if (authoritativeClaimType === 'PHYSICAL_DELIVERY') {
      payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
      };
    } else if (authoritativeClaimType === 'GIFT_CARD_CODE' || authoritativeClaimType === 'DIGITAL_CREDIT') {
      payload = {
        email: formData.email.trim().toLowerCase(),
      };
    }

    try {
      const giveawayIdentifier = giveaway.id || giveaway._id || giveaway.slug;
      const response = await giveawayService.submitPrizeClaim(giveawayIdentifier, payload);
      setSuccessData(response);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      const errorMsg =
        err.message || 'Unable to submit prize claim. Please check your information and try again.';
      setApiError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setSuccessData(null);
    onClose();
  };

  // Close modal when clicking outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  // Formatted deadline string
  const formattedDeadline = claimDeadline
    ? claimDeadline.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
      onClick={handleOverlayClick}
    >
      <div className={styles.modalCard} ref={modalRef}>
        {/* Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          disabled={submitting}
          aria-label="Close prize claim dialog"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* 1. SUCCESS CONFIRMATION STATE */}
        {successData ? (
          <div className={styles.successContent} role="status">
            <div className={styles.successBadge}>
              <CheckCircle2 size={36} aria-hidden="true" />
            </div>

            <div className={styles.celebrationPill}>
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Claim Submitted</span>
            </div>

            <h2 id="claim-modal-title" className={styles.successTitle}>
              Prize Claim Received!
            </h2>
            <p className={styles.successSub}>
              Your claim information for <strong>{prizeName}</strong> has been received and logged
              for fulfillment.
            </p>

            <div className={styles.receiptCard}>
              <div className={styles.receiptHeader}>
                <div className={styles.receiptHeaderTitle}>
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>Fulfillment Summary</span>
                </div>
                <span className={styles.receiptStatusBadge}>
                  {successData.userFacingStatus || 'SUBMITTED'}
                </span>
              </div>

              <div className={styles.receiptBody}>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Prize:</span>
                  <span className={styles.receiptValue}>{prizeName}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Fulfillment Method:</span>
                  <span className={styles.receiptValue}>
                    {authoritativeClaimType === 'PHYSICAL_DELIVERY'
                      ? 'Insured Courier Delivery'
                      : authoritativeClaimType === 'GIFT_CARD_CODE'
                      ? 'Digital Gift Card Code'
                      : 'Platform Credit'}
                  </span>
                </div>
                {formData.fullName && (
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Recipient:</span>
                    <span className={styles.receiptValue}>{formData.fullName}</span>
                  </div>
                )}
                {formData.email && (
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Delivery Email:</span>
                    <span className={styles.receiptValue}>{formData.email}</span>
                  </div>
                )}
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Claim Status:</span>
                  <span className={styles.receiptStatusHighlight}>
                    Submitted (Pending Review)
                  </span>
                </div>
              </div>
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={handleDone}>
              Done
            </Button>
          </div>
        ) : !canClaim && userFacingStatus !== 'NOT_SUBMITTED' ? (
          /* 2. EXISTING CLAIM STATUS STATE (Read-Only) */
          <div className={styles.content}>
            <header className={styles.header}>
              <div className={styles.headerIconWrap}>
                {userFacingStatus === 'COMPLETED' ? (
                  <CheckCircle2 size={24} className={styles.iconGreen} />
                ) : userFacingStatus === 'DISPATCHED' ? (
                  <Truck size={24} className={styles.iconIndigo} />
                ) : userFacingStatus === 'REJECTED' ? (
                  <AlertCircle size={24} className={styles.iconRed} />
                ) : (
                  <Clock size={24} className={styles.iconIndigo} />
                )}
              </div>
              <div className={styles.headerText}>
                <div className={styles.winnerEyebrow}>
                  <span>Winner • Rank #{winnerRank}</span>
                </div>
                <h2 id="claim-modal-title" className={styles.title}>
                  Prize Claim Details
                </h2>
                <p className={styles.subTitle}>
                  {userFacingStatus === 'COMPLETED'
                    ? 'Your prize fulfillment is complete.'
                    : userFacingStatus === 'DISPATCHED'
                    ? 'Your prize has been dispatched for delivery.'
                    : userFacingStatus === 'PROCESSING'
                    ? 'Your prize claim is currently being processed.'
                    : userFacingStatus === 'REJECTED'
                    ? 'Your prize claim could not be processed.'
                    : userFacingStatus === 'EXPIRED'
                    ? 'The official claim window has closed.'
                    : 'Your prize claim has been submitted.'}
                </p>
              </div>
            </header>

            {/* Prize snapshot card */}
            <div className={styles.prizeSnapshot}>
              <img src={prizeImage} alt={prizeName} className={styles.prizeThumb} />
              <div className={styles.prizeDetails}>
                <Badge variant="ves" size="sm">
                  {authoritativeClaimType.replace(/_/g, ' ')}
                </Badge>
                <h3 className={styles.prizeName}>{prizeName}</h3>
                {giveaway.title && (
                  <span className={styles.giveawaySubtitle}>{giveaway.title}</span>
                )}
              </div>
            </div>

            {/* Read-only status breakdown card */}
            <div className={styles.statusBreakdownCard}>
              <div className={styles.statusCardHeader}>
                <span className={styles.statusCardTitle}>Claim Status</span>
                <span
                  className={`${styles.statusPill} ${
                    userFacingStatus === 'COMPLETED'
                      ? styles.statusPillCompleted
                      : userFacingStatus === 'DISPATCHED'
                      ? styles.statusPillDispatched
                      : userFacingStatus === 'REJECTED'
                      ? styles.statusPillRejected
                      : styles.statusPillActive
                  }`}
                >
                  {userFacingStatus === 'COMPLETED'
                    ? 'Delivered'
                    : userFacingStatus === 'DISPATCHED'
                    ? 'Dispatched'
                    : userFacingStatus === 'PROCESSING'
                    ? 'Processing'
                    : userFacingStatus === 'REJECTED'
                    ? 'Rejected'
                    : userFacingStatus === 'EXPIRED'
                    ? 'Expired'
                    : 'Submitted'}
                </span>
              </div>

              {/* Dispatched details if available */}
              {userFacingStatus === 'DISPATCHED' &&
                (claimState?.claim?.courier || claimState?.claim?.trackingNumber) && (
                  <div className={styles.dispatchedBox}>
                    {claimState.claim.courier && (
                      <div className={styles.dispatchRow}>
                        <span className={styles.dispatchLabel}>Courier Partner:</span>
                        <strong className={styles.dispatchVal}>
                          {claimState.claim.courier}
                        </strong>
                      </div>
                    )}
                    {claimState.claim.trackingNumber && (
                      <div className={styles.dispatchRow}>
                        <span className={styles.dispatchLabel}>Tracking Number:</span>
                        <strong className={styles.dispatchVal}>
                          {claimState.claim.trackingNumber}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

              {userFacingStatus === 'EXPIRED' && (
                <div className={styles.rejectionNotice}>
                  <AlertTriangle size={16} />
                  <span>
                    Claim window closed. This prize can no longer be claimed through this form.
                  </span>
                </div>
              )}

              {userFacingStatus === 'REJECTED' && (
                <div className={styles.rejectionNotice}>
                  <AlertTriangle size={16} />
                  <span>
                    Please contact VELOOP support if you need assistance regarding this claim.
                  </span>
                </div>
              )}
            </div>

            <Button variant="outline" size="md" fullWidth onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          /* 3. CLAIM SUBMISSION FORM */
          <div className={styles.content}>
            <header className={styles.header}>
              <div className={styles.headerIconWrap}>
                {authoritativeClaimType === 'PHYSICAL_DELIVERY' ? (
                  <Truck size={24} className={styles.iconGreen} aria-hidden="true" />
                ) : (
                  <Gift size={24} className={styles.iconIndigo} aria-hidden="true" />
                )}
              </div>
              <div className={styles.headerText}>
                <div className={styles.winnerEyebrow}>
                  <span>Winner • Rank #{winnerRank}</span>
                </div>
                <h2 id="claim-modal-title" className={styles.title}>
                  Claim Your Prize
                </h2>
                <p className={styles.subTitle}>
                  {authoritativeClaimType === 'PHYSICAL_DELIVERY'
                    ? 'Enter your shipping address to receive your reward.'
                    : 'Enter your email address to receive your digital voucher.'}
                </p>
              </div>
            </header>

            {/* Prize snapshot card */}
            <div className={styles.prizeSnapshot}>
              <img src={prizeImage} alt={prizeName} className={styles.prizeThumb} />
              <div className={styles.prizeDetails}>
                <Badge variant="ves" size="sm">
                  {authoritativeClaimType.replace(/_/g, ' ')}
                </Badge>
                <h3 className={styles.prizeName}>{prizeName}</h3>
                {formattedDeadline && (
                  <div className={styles.deadlineToNotice}>
                    <Clock size={13} aria-hidden="true" />
                    <span>Claim window closes on {formattedDeadline}</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.formSection} noValidate>
              {authoritativeClaimType === 'PHYSICAL_DELIVERY' && (
                <div className={styles.formGrid}>
                  {/* Full Name */}
                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-fullName" className={styles.label}>
                      Full Recipient Name <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      id="claim-fullName"
                      ref={firstInputRef}
                      type="text"
                      name="fullName"
                      autoComplete="name"
                      placeholder="e.g. Priya Sharma"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        fieldErrors.fullName ? styles.inputError : ''
                      }`}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      aria-describedby={
                        fieldErrors.fullName ? 'error-claim-fullName' : undefined
                      }
                    />
                    {fieldErrors.fullName && (
                      <span id="error-claim-fullName" className={styles.fieldError}>
                        {fieldErrors.fullName}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-phone" className={styles.label}>
                      Contact Phone Number <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      id="claim-phone"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        fieldErrors.phone ? styles.inputError : ''
                      }`}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={
                        fieldErrors.phone ? 'error-claim-phone' : undefined
                      }
                    />
                    {fieldErrors.phone && (
                      <span id="error-claim-phone" className={styles.fieldError}>
                        {fieldErrors.phone}
                      </span>
                    )}
                  </div>

                  {/* Address Line 1 */}
                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-addressLine1" className={styles.label}>
                      Street Address Line 1 <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      id="claim-addressLine1"
                      type="text"
                      name="addressLine1"
                      autoComplete="address-line1"
                      placeholder="House / Flat No., Building, Street Name"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        fieldErrors.addressLine1 ? styles.inputError : ''
                      }`}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.addressLine1)}
                      aria-describedby={
                        fieldErrors.addressLine1 ? 'error-claim-addressLine1' : undefined
                      }
                    />
                    {fieldErrors.addressLine1 && (
                      <span id="error-claim-addressLine1" className={styles.fieldError}>
                        {fieldErrors.addressLine1}
                      </span>
                    )}
                  </div>

                  {/* Address Line 2 (Optional) */}
                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-addressLine2" className={styles.label}>
                      Address Line 2 <span className={styles.optionalTag}>(Optional)</span>
                    </label>
                    <input
                      id="claim-addressLine2"
                      type="text"
                      name="addressLine2"
                      autoComplete="address-line2"
                      placeholder="Apartment, Suite, Landmark"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      className={styles.input}
                      disabled={submitting}
                    />
                  </div>

                  {/* City */}
                  <div className={styles.formGroup}>
                    <label htmlFor="claim-city" className={styles.label}>
                      City <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      id="claim-city"
                      type="text"
                      name="city"
                      autoComplete="address-level2"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        fieldErrors.city ? styles.inputError : ''
                      }`}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.city)}
                      aria-describedby={
                        fieldErrors.city ? 'error-claim-city' : undefined
                      }
                    />
                    {fieldErrors.city && (
                      <span id="error-claim-city" className={styles.fieldError}>
                        {fieldErrors.city}
                      </span>
                    )}
                  </div>

                  {/* State */}
                  <div className={styles.formGroup}>
                    <label htmlFor="claim-state" className={styles.label}>
                      State / Region <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      id="claim-state"
                      type="text"
                      name="state"
                      autoComplete="address-level1"
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        fieldErrors.state ? styles.inputError : ''
                      }`}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.state)}
                      aria-describedby={
                        fieldErrors.state ? 'error-claim-state' : undefined
                      }
                    />
                    {fieldErrors.state && (
                      <span id="error-claim-state" className={styles.fieldError}>
                        {fieldErrors.state}
                      </span>
                    )}
                  </div>

                  {/* Postal Code */}
                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-postalCode" className={styles.label}>
                      PIN / Postal Code <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      id="claim-postalCode"
                      type="text"
                      name="postalCode"
                      autoComplete="postal-code"
                      placeholder="e.g. 400001"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        fieldErrors.postalCode ? styles.inputError : ''
                      }`}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.postalCode)}
                      aria-describedby={
                        fieldErrors.postalCode ? 'error-claim-postalCode' : undefined
                      }
                    />
                    {fieldErrors.postalCode && (
                      <span id="error-claim-postalCode" className={styles.fieldError}>
                        {fieldErrors.postalCode}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Gift Card / Voucher Email Form */}
              {(authoritativeClaimType === 'GIFT_CARD_CODE' ||
                authoritativeClaimType === 'DIGITAL_CREDIT') && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-email" className={styles.label}>
                      Voucher Delivery Email Address{' '}
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      id="claim-email"
                      ref={firstInputRef}
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="e.g. winner@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        fieldErrors.email ? styles.inputError : ''
                      }`}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? 'error-claim-email' : undefined
                      }
                    />
                    {fieldErrors.email && (
                      <span id="error-claim-email" className={styles.fieldError}>
                        {fieldErrors.email}
                      </span>
                    )}
                    <span className={styles.inputHelperText}>
                      Your digital voucher code will be sent to this email address upon review.
                    </span>
                  </div>
                </div>
              )}

              {/* Privacy / Information Processing Note */}
              <div className={styles.privacyNote}>
                <Lock size={14} className={styles.privacyIcon} aria-hidden="true" />
                <span>
                  Your dispatch information is used exclusively for prize fulfillment.
                </span>
              </div>

              {/* API Error Alert */}
              {apiError && (
                <div className={styles.alertError} role="alert">
                  <AlertTriangle size={18} className={styles.alertIcon} aria-hidden="true" />
                  <div className={styles.alertText}>{apiError}</div>
                </div>
              )}

              {/* Modal Actions */}
              <div className={styles.actions}>
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  disabled={submitting}
                  className={styles.cancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={submitting}
                  disabled={submitting}
                  iconRight={!submitting ? <ArrowRight size={16} /> : null}
                  className={styles.submitBtn}
                >
                  {submitting ? 'Submitting Claim...' : 'Submit Claim'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizeClaimModal;
