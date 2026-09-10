import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ShieldCheck, ChevronDown, RefreshCw, Sparkles, Check, UserCircle, LogOut } from 'lucide-react';
import { formatNumber } from '../../utils/currencyFormatter.js';
import { Badge } from './ui/Badge.jsx';
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleUserChange = async (targetUserId) => {
    setDropdownOpen(false);
    await login(targetUserId);
  };

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
          <span className={styles.envTag}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.envLabel}>Demo Profile</span>
          </span>

          {loading ? (
            <Skeleton variant="text" width={140} height={18} />
          ) : isAuthenticated ? (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Account Active'}</span>
              <span className={styles.userTier}>Tier {user?.tier || 1}</span>
              {user?.isKycVerified && (
                <span className={styles.kycVerified} title="Verified Member Account">
                  <ShieldCheck size={13} />
                  <span>Verified</span>
                </span>
              )}
            </div>
          ) : (
            <span className={styles.guestText}>Viewing as Guest</span>
          )}
        </div>

        {/* Right: Quick Balances & Switcher */}
        <div className={styles.rightSection}>
          {isAuthenticated && (
            <div className={styles.balancesGroup} aria-label="Wallet Balances">
              {loading ? (
                <Skeleton variant="text" width={180} height={20} />
              ) : (
                <>
                  <span className={`${styles.balanceItem} ${styles.vesItem}`} title="VEs Core Balance">
                    <span className={styles.currKey}>VEs</span>
                    <span className={styles.currVal}>{formatNumber(balances.VEs || 0)}</span>
                  </span>
                  <span className={`${styles.balanceItem} ${styles.svesItem}`} title="SVEs Super-Tier Balance">
                    <span className={styles.currKey}>SVEs</span>
                    <span className={styles.currVal}>{formatNumber(balances.SVEs || 0)}</span>
                  </span>
                  <span className={`${styles.balanceItem} ${styles.tokensItem}`} title="Daily Tokens Balance">
                    <span className={styles.currKey}>Tokens</span>
                    <span className={styles.currVal}>{formatNumber(balances.Tokens || 0)}</span>
                  </span>
                  <button
                    type="button"
                    className={styles.refreshBtn}
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    title="Refresh live wallet balances"
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
              type="button"
              className={styles.switcherBtn}
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              aria-label="Switch Demo Profile"
            >
              <UserCircle size={14} />
              <span>Switch Profile</span>
              <ChevronDown size={12} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} />
            </button>

            {dropdownOpen && (
              <div className={styles.dropdownMenu} role="menu" aria-label="Demo Profile Selector">
                <div className={styles.dropdownHeader}>
                  <span>Select Test Persona</span>
                  <Badge variant="primary" size="sm">Evaluation Mode</Badge>
                </div>

                <div className={styles.profileList}>
                  {demoUsers.map((du) => {
                    const isCurrent = user?.userId === du.userId;
                    return (
                      <button
                        key={du.userId}
                        type="button"
                        role="menuitem"
                        className={`${styles.profileItem} ${isCurrent ? styles.activeProfileItem : ''}`}
                        onClick={() => handleUserChange(du.userId)}
                      >
                        <div className={styles.profileAvatar}>
                          {du.name ? du.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className={styles.profileDetails}>
                          <div className={styles.profileNameRow}>
                            <span className={styles.profileName}>{du.name}</span>
                            <span className={styles.profileTierBadge}>Tier {du.tier}</span>
                            {isCurrent && <Check size={14} className={styles.checkIcon} />}
                          </div>
                          <div className={styles.profileBalancesRow}>
                            <span>{formatNumber(du.balances?.VEs || 0)} VEs</span> •{' '}
                            <span>{formatNumber(du.balances?.SVEs || 0)} SVEs</span> •{' '}
                            <span>{formatNumber(du.balances?.Tokens || 0)} Tokens</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.dropdownDivider} />

                {isAuthenticated ? (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.logoutBtn}
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={13} />
                    <span>Switch to Unauthenticated Guest</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.loginQuickBtn}
                    onClick={() => handleUserChange('user_alex')}
                  >
                    <Sparkles size={13} />
                    <span>Log in as Alex Rivera (VIP Tier 2)</span>
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
