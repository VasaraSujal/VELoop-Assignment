import { useState, useEffect } from 'react';
import { giveawayService } from '../../services/giveawayService.js';
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
} from 'lucide-react';
import styles from './PrizeClaimModal.module.css';

export const PrizeClaimModal = ({
  giveaway,
  claimState,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    email: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Authoritative claimType determined strictly by backend state or giveaway config
  const authoritativeClaimType = claimState?.claimType || giveaway?.claimType || 'PHYSICAL_DELIVERY';
  const prizeName = claimState?.prizeName || giveaway?.prize || giveaway?.title;
  const prizeImage = claimState?.prizeImage || giveaway?.prizeImage || '/assets/prizes/iphone-15-pro.png';
  const claimDeadline = claimState?.claimDeadline ? new Date(claimState.claimDeadline) : null;

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
        errors.phone = 'Valid phone number is required (8-15 digits).';
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
    } else if (authoritativeClaimType === 'GIFT_CARD_CODE') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
        errors.email = 'Valid recipient email address is required for digital delivery.';
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
    } else if (authoritativeClaimType === 'GIFT_CARD_CODE') {
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

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
    >
      <div className={styles.modalCard}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          disabled={submitting}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* 1. SUCCESS CONFIRMATION STATE */}
        {successData ? (
          <div className={styles.successContent}>
            <div className={styles.successBadge}>
              <CheckCircle2 size={36} />
            </div>

            <div className={styles.celebrationPill}>
              <ShieldCheck size={14} /> Claim Submitted
            </div>

            <h2 id="claim-modal-title" className={styles.successTitle}>
              Prize Claim Received!
            </h2>
            <p className={styles.successSub}>
              Your claim for <strong>{prizeName}</strong> has been securely logged and is now being verified for fulfillment.
            </p>

            <div className={styles.ticketCard}>
              <div className={styles.ticketHeader}>
                <div className={styles.ticketLabel}>
                  <ShieldCheck size={16} /> Fulfillment Receipt
                </div>
                <div className={styles.ticketStatus}>
                  {successData.userFacingStatus || 'SUBMITTED'}
                </div>
              </div>

              <div className={styles.ticketBody}>
                <div className={styles.ticketRow}>
                  <span className={styles.tLabel}>Prize:</span>
                  <span className={styles.tValue}>{prizeName}</span>
                </div>
                <div className={styles.ticketRow}>
                  <span className={styles.tLabel}>Fulfillment Method:</span>
                  <span className={styles.tValue}>
                    {authoritativeClaimType === 'PHYSICAL_DELIVERY'
                      ? 'Insured Courier Delivery'
                      : authoritativeClaimType === 'GIFT_CARD_CODE'
                      ? 'Digital Gift Card Code'
                      : 'Platform Credit'}
                  </span>
                </div>
                {formData.fullName && (
                  <div className={styles.ticketRow}>
                    <span className={styles.tLabel}>Recipient:</span>
                    <span className={styles.tValue}>{formData.fullName}</span>
                  </div>
                )}
                {formData.email && (
                  <div className={styles.ticketRow}>
                    <span className={styles.tLabel}>Delivery Email:</span>
                    <span className={styles.tValue}>{formData.email}</span>
                  </div>
                )}
                <div className={styles.ticketRow}>
                  <span className={styles.tLabel}>Status:</span>
                  <span className={styles.tValue} style={{ color: '#059669' }}>
                    Under Operations Review
                  </span>
                </div>
              </div>
            </div>

            <button type="button" className={styles.doneBtn} onClick={handleDone}>
              Done
            </button>
          </div>
        ) : (
          /* 2. CLAIM SUBMISSION FORM */
          <div className={styles.content}>
            <header className={styles.header}>
              <div className={styles.headerIcon}>
                {authoritativeClaimType === 'PHYSICAL_DELIVERY' ? (
                  <Truck size={24} />
                ) : (
                  <Gift size={24} />
                )}
              </div>
              <div className={styles.headerText}>
                <h2 id="claim-modal-title" className={styles.title}>
                  Claim Your Prize
                </h2>
                <p className={styles.subTitle}>
                  Enter your verified dispatch information to receive your reward.
                </p>
              </div>
            </header>

            {/* Prize snapshot */}
            <div className={styles.prizeSnapshot}>
              <img src={prizeImage} alt={prizeName} className={styles.prizeThumb} />
              <div className={styles.prizeDetails}>
                <span className={styles.claimTypeBadge}>
                  {authoritativeClaimType.replace(/_/g, ' ')}
                </span>
                <h4 className={styles.prizeName}>{prizeName}</h4>
                {claimDeadline && (
                  <div className={styles.deadlineToNotice}>
                    <Clock size={13} />
                    <span>Claim window closes: {claimDeadline.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.formSection} noValidate>
              {authoritativeClaimType === 'PHYSICAL_DELIVERY' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-fullName" className={styles.label}>
                      Full Recipient Name *
                    </label>
                    <input
                      id="claim-fullName"
                      type="text"
                      name="fullName"
                      autoComplete="name"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`${styles.input} ${fieldErrors.fullName ? styles.inputError : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.fullName && (
                      <span className={styles.fieldError}>{fieldErrors.fullName}</span>
                    )}
                  </div>

                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-phone" className={styles.label}>
                      Contact Phone Number *
                    </label>
                    <input
                      id="claim-phone"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.phone && (
                      <span className={styles.fieldError}>{fieldErrors.phone}</span>
                    )}
                  </div>

                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-addressLine1" className={styles.label}>
                      Street Address Line 1 *
                    </label>
                    <input
                      id="claim-addressLine1"
                      type="text"
                      name="addressLine1"
                      autoComplete="address-line1"
                      placeholder="House/Flat No., Building, Street"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      className={`${styles.input} ${fieldErrors.addressLine1 ? styles.inputError : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.addressLine1 && (
                      <span className={styles.fieldError}>{fieldErrors.addressLine1}</span>
                    )}
                  </div>

                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-addressLine2" className={styles.label}>
                      Address Line 2 (Optional)
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

                  <div className={styles.formGroup}>
                    <label htmlFor="claim-city" className={styles.label}>
                      City *
                    </label>
                    <input
                      id="claim-city"
                      type="text"
                      name="city"
                      autoComplete="address-level2"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={handleChange}
                      className={`${styles.input} ${fieldErrors.city ? styles.inputError : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.city && (
                      <span className={styles.fieldError}>{fieldErrors.city}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="claim-state" className={styles.label}>
                      State / Region *
                    </label>
                    <input
                      id="claim-state"
                      type="text"
                      name="state"
                      autoComplete="address-level1"
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={handleChange}
                      className={`${styles.input} ${fieldErrors.state ? styles.inputError : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.state && (
                      <span className={styles.fieldError}>{fieldErrors.state}</span>
                    )}
                  </div>

                  <div className={styles.formGroupFull}>
                    <label htmlFor="claim-postalCode" className={styles.label}>
                      PIN / Postal Code *
                    </label>
                    <input
                      id="claim-postalCode"
                      type="text"
                      name="postalCode"
                      autoComplete="postal-code"
                      placeholder="e.g. 400001"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className={`${styles.input} ${fieldErrors.postalCode ? styles.inputError : ''}`}
                      disabled={submitting}
                    />
                    {fieldErrors.postalCode && (
                      <span className={styles.fieldError}>{fieldErrors.postalCode}</span>
                    )}
                  </div>
                </div>
              )}

              {authoritativeClaimType === 'GIFT_CARD_CODE' && (
                <div className={styles.formGroupFull}>
                  <label htmlFor="claim-email" className={styles.label}>
                    Voucher Delivery Email Address *
                  </label>
                  <input
                    id="claim-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="e.g. winner@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
                    disabled={submitting}
                  />
                  {fieldErrors.email && (
                    <span className={styles.fieldError}>{fieldErrors.email}</span>
                  )}
                </div>
              )}

              {authoritativeClaimType === 'DIGITAL_CREDIT' && (
                <div className={styles.digitalCreditNotice}>
                  Your prize credit will be automatically credited to your VELOOP wallet upon confirmation. No shipping address is required.
                </div>
              )}

              {/* Privacy / Encryption Note */}
              <div className={styles.privacyNote}>
                <Lock size={14} color="var(--color-primary)" />
                <span>
                  Your dispatch information is encrypted and used exclusively for prize fulfillment. It is never sold or shared.
                </span>
              </div>

              {/* API Error Alert */}
              {apiError && (
                <div className={styles.alertError} role="alert">
                  <AlertTriangle size={18} className={styles.alertIcon} />
                  <div className={styles.alertText}>{apiError}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className={styles.loadingSpinner}>
                      <span className={styles.miniSpinner} />
                      Submitting Claim...
                    </span>
                  ) : (
                    <>
                      <span>Submit Claim</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizeClaimModal;
