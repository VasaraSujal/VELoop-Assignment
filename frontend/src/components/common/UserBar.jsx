import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ShieldCheck, UserCheck, ChevronDown, Coins, LogOut, RefreshCw } from 'lucide-react';
import { formatNumber } from '../../utils/currencyFormatter.js';
import styles from './UserBar.module.css';

export const UserBar = () => {
  const { user, balances, demoUsers, login, logout, refreshBalance, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleUserChange = async (targetUserId) => {
    setDropdownOpen(false);
    await login(targetUserId);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <div className={styles.userBar}>
      <div className={styles.container}>
        {/* Left: Environment & Persona status */}
        <div className={styles.personaSection}>
          <span className={styles.devBadge}>DEMO AUTH</span>
          {isAuthenticated ? (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              {user.isKycVerified && (
                <span className={styles.kycTag} title="KYC Account Verified">
                  <ShieldCheck size={13} />
                  KYC Verified
                </span>
              )}
            </div>
          ) : (
            <span className={styles.guestText}>Viewing as Unauthenticated Guest</span>
          )}
        </div>

        {/* Right: Authoritative Live Balances & Switcher */}
        <div className={styles.actionsSection}>
          {isAuthenticated && (
            <div className={styles.balancePills}>
              <div className={`${styles.balancePill} ${styles.ves}`}>
                <span className={styles.currLabel}>VEs:</span>
                <span className={styles.currValue}>{formatNumber(balances.VEs || 0)}</span>
              </div>
              <div className={`${styles.balancePill} ${styles.sves}`}>
                <span className={styles.currLabel}>SVEs:</span>
                <span className={styles.currValue}>{formatNumber(balances.SVEs || 0)}</span>
              </div>
              <div className={`${styles.balancePill} ${styles.tokens}`}>
                <span className={styles.currLabel}>Tokens:</span>
                <span className={styles.currValue}>{formatNumber(balances.Tokens || 0)}</span>
              </div>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={handleManualRefresh}
                title="Refresh live wallet balances from backend"
                aria-label="Refresh balance"
              >
                <RefreshCw size={13} className={isRefreshing ? styles.spinning : ''} />
              </button>
            </div>
          )}

          {/* Switch Demo User Dropdown */}
          <div className={styles.dropdownWrapper}>
            <button
              type="button"
              className={styles.switchBtn}
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
            >
              <UserCheck size={14} />
              <span>Switch Demo Account</span>
              <ChevronDown size={13} />
            </button>

            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>Select Demo Profile</div>
                {demoUsers.map((du) => {
                  const isCurrent = user?.userId === du.userId;
                  return (
                    <button
                      key={du.userId}
                      type="button"
                      className={`${styles.dropdownItem} ${isCurrent ? styles.activeItem : ''}`}
                      onClick={() => handleUserChange(du.userId)}
                    >
                      <div className={styles.itemMain}>
                        <div className={styles.itemTitle}>
                          {du.name}
                          {isCurrent && <span className={styles.currentDot}>• Active</span>}
                        </div>
                        <div className={styles.itemSub}>
                          <span>Tier {du.tier}</span> • <span>{du.balances?.VEs} VEs</span> •{' '}
                          <span>{du.balances?.SVEs} SVEs</span> •{' '}
                          <span>{du.balances?.Tokens} Tokens</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className={styles.dropdownDivider} />

                {isAuthenticated ? (
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Switch to Guest (Unauthenticated)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleUserChange('user_alex')}
                  >
                    <Coins size={14} />
                    <span>Log in as Alex (VIP)</span>
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
