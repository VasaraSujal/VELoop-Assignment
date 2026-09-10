import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ChevronDown, RefreshCw, Check, User, LogOut, Sparkles } from 'lucide-react';
import { formatNumber } from '../../utils/currencyFormatter.js';
import { Skeleton } from './ui/Skeleton.jsx';
import styles from './UserBar.module.css';

/**
 * Top Utility Bar - Integrates platform environment status, wallet balances, and demo profile switcher.
 */
export const UserBar = () => {
  const { user, balances, demoUsers, login, logout, refreshBalance, isAuthenticated, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false);
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleUserChange = useCallback(async (targetUserId) => {
    setDropdownOpen(false);
    await login(targetUserId);
  }, [login]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className={styles.userBar} role="region" aria-label="Account and Environment Utility Bar">
      <div className={styles.container}>
        {/* Left: Persona / Environment Indicator */}
        <div className={styles.leftSection}>
          <span className={styles.demoTag}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.demoLabel}>Demo Profile</span>
          </span>

          {loading ? (
            <Skeleton variant="text" width={140} height={18} />
          ) : isAuthenticated ? (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Active Account'}</span>
              <span className={styles.userTier}>Tier {user?.tier ?? 1}</span>
              <span className={styles.accountStatus}>Active</span>
            </div>
          ) : (
            <div className={styles.userInfo}>
              <span className={styles.guestText}>Viewing as Guest</span>
            </div>
          )}
        </div>

        {/* Right: Quick Balances & Switcher */}
        <div className={styles.rightSection}>
          {isAuthenticated && (
            <div className={styles.balancesGroup} aria-label="Wallet Balances">
              {loading ? (
                <Skeleton variant="text" width={180} height={24} />
              ) : (
                <>
                  <div className={`${styles.balanceChip} ${styles.vesChip}`} title="VEs Core Balance">
                    <span className={styles.currKey}>VEs</span>
                    <strong className={styles.currVal}>{formatNumber(balances.VEs || 0)}</strong>
                  </div>
                  <div className={`${styles.balanceChip} ${styles.svesChip}`} title="SVEs Super-Tier Balance">
                    <span className={styles.currKey}>SVEs</span>
                    <strong className={styles.currVal}>{formatNumber(balances.SVEs || 0)}</strong>
                  </div>
                  <div className={`${styles.balanceChip} ${styles.tokensChip}`} title="Daily Tokens Balance">
                    <span className={styles.currKey}>Tokens</span>
                    <strong className={styles.currVal}>{formatNumber(balances.Tokens || 0)}</strong>
                  </div>
                  <button
                    type="button"
                    className={styles.refreshBtn}
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    title="Refresh wallet balances"
                    aria-label="Refresh wallet balances"
                  >
                    <RefreshCw size={12} className={isRefreshing ? styles.spinning : ''} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Persona Switcher Dropdown */}
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              ref={triggerRef}
              type="button"
              className={`${styles.switcherBtn} ${dropdownOpen ? styles.switcherBtnActive : ''}`}
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              aria-label="Switch Demo Profile"
            >
              <User size={14} className={styles.userIcon} />
              <span className={styles.switcherText}>Switch Profile</span>
              <ChevronDown size={13} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} />
            </button>

            {dropdownOpen && (
              <div className={styles.dropdownMenu} role="menu" aria-label="Demo Profile Selector">
                {/* Dropdown Header */}
                <div className={styles.dropdownHeader}>
                  <div className={styles.headerTextGroup}>
                    <span className={styles.headerEyebrow}>SWITCH PROFILE</span>
                    <p className={styles.headerSub}>Choose an account for this demo session</p>
                  </div>
                </div>

                {/* Profile List */}
                <div className={styles.profileList} role="group" aria-label="Available Profiles">
                  {demoUsers.map((du) => {
                    const isCurrent = user?.userId === du.userId;
                    const avatarChar = du.name ? du.name.charAt(0).toUpperCase() : 'U';

                    return (
                      <button
                        key={du.userId}
                        type="button"
                        role="menuitem"
                        className={`${styles.profileItem} ${isCurrent ? styles.activeProfileItem : ''}`}
                        onClick={() => handleUserChange(du.userId)}
                        aria-current={isCurrent ? 'true' : undefined}
                      >
                        <div className={styles.profileAvatar}>
                          {avatarChar}
                        </div>
                        <div className={styles.profileDetails}>
                          <div className={styles.profileNameRow}>
                            <span className={styles.profileName} title={du.name}>
                              {du.name}
                            </span>
                            <span className={styles.profileTierBadge}>
                              Tier {du.tier}
                            </span>
                            {isCurrent && (
                              <Check size={14} className={styles.checkIcon} aria-hidden="true" />
                            )}
                          </div>
                          <div className={styles.profileBalancesRow}>
                            <span>{formatNumber(du.balances?.VEs || 0)} VEs</span>
                            <span className={styles.dotSeparator}>•</span>
                            <span>{formatNumber(du.balances?.SVEs || 0)} SVEs</span>
                            <span className={styles.dotSeparator}>•</span>
                            <span>{formatNumber(du.balances?.Tokens || 0)} Tokens</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.dropdownDivider} />

                {/* Bottom Action: Guest Toggle */}
                {isAuthenticated ? (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.guestActionBtn}
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                  >
                    <div className={styles.guestIconBox}>
                      <LogOut size={13} />
                    </div>
                    <div className={styles.guestTextCol}>
                      <span className={styles.guestActionTitle}>Switch to Unauthenticated Guest</span>
                      <span className={styles.guestActionSub}>Browse without an active session</span>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.guestActionBtn}
                    onClick={() => handleUserChange('user_alex')}
                  >
                    <div className={styles.guestIconBox}>
                      <Sparkles size={13} />
                    </div>
                    <div className={styles.guestTextCol}>
                      <span className={styles.guestActionTitle}>Sign in as Alex Rivera</span>
                      <span className={styles.guestActionSub}>VIP Tier 2 demo account</span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBar;
