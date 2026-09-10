import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gift, Menu, X, ArrowRight, Trophy, HelpCircle, Layers, Sparkles, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatNumber } from '../../utils/currencyFormatter.js';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import styles from './Header.module.css';

/**
 * Main Primary Navigation Header with integrated responsive drawer and account summary.
 */
export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, balances, isAuthenticated, demoUsers, login, logout } = useAuth();
  const drawerRef = useRef(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open and support Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Helper to construct hash URLs whether on homepage or subpage
  const getNavHref = (hash) => {
    return location.pathname === '/' ? hash : `/${hash}`;
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.navContainer}>
        {/* Left: Brand Logo */}
        <Link
          to="/"
          className={styles.brand}
          aria-label="VELOOP Rewards - Return to Homepage"
          onClick={closeMobileMenu}
        >
          <div className={styles.logoIconBox}>
            <Gift size={18} className={styles.logoGiftIcon} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandMain}>VELOP</span>
            <span className={styles.brandSub}>Rewards</span>
          </div>
          <span className={styles.brandBadge}>Giveaways</span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <a href={getNavHref('#active-giveaways')} className={styles.navLink}>
            <span>Giveaways</span>
          </a>
          <a href={getNavHref('#how-it-works')} className={styles.navLink}>
            <span>How It Works</span>
          </a>
          <a href={getNavHref('#winners')} className={styles.navLink}>
            <span>Winners</span>
          </a>
          <a href={getNavHref('#faq')} className={styles.navLink}>
            <span>FAQ</span>
          </a>
        </nav>

        {/* Right: Actions & CTA */}
        <div className={styles.rightActions}>
          <a href={getNavHref('#active-giveaways')} className={styles.desktopCtaWrapper}>
            <Button
              variant="primary"
              size="md"
              iconRight={<ArrowRight size={16} />}
            >
              Explore Giveaways
            </Button>
          </a>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Mobile Navigation Drawer */}
      <div
        id="mobile-navigation-drawer"
        ref={drawerRef}
        className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerBrand}>
            <div className={styles.logoIconBox}>
              <Gift size={16} />
            </div>
            <span className={styles.drawerBrandText}>VELOP Rewards</span>
          </div>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Account Summary Box */}
        <div className={styles.mobileAccountCard}>
          <div className={styles.mobileAccountHeader}>
            <div className={styles.mobileAvatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className={styles.mobileAccountInfo}>
              <span className={styles.mobileAccountName}>
                {isAuthenticated ? user.name : 'Guest User'}
              </span>
              <span className={styles.mobileAccountTier}>
                {isAuthenticated ? `VIP Tier ${user.tier || 1}` : 'Unauthenticated'}
              </span>
            </div>
            <Badge variant={isAuthenticated ? 'success' : 'neutral'} size="sm">
              {isAuthenticated ? 'Active' : 'Guest'}
            </Badge>
          </div>

          {isAuthenticated ? (
            <div className={styles.mobileBalancesGrid}>
              <div className={`${styles.mobileBalanceBox} ${styles.vesBox}`}>
                <span className={styles.mbLabel}>VEs</span>
                <span className={styles.mbVal}>{formatNumber(balances.VEs || 0)}</span>
              </div>
              <div className={`${styles.mobileBalanceBox} ${styles.svesBox}`}>
                <span className={styles.mbLabel}>SVEs</span>
                <span className={styles.mbVal}>{formatNumber(balances.SVEs || 0)}</span>
              </div>
              <div className={`${styles.mobileBalanceBox} ${styles.tokensBox}`}>
                <span className={styles.mbLabel}>Tokens</span>
                <span className={styles.mbVal}>{formatNumber(balances.Tokens || 0)}</span>
              </div>
            </div>
          ) : (
            <div className={styles.mobileGuestPrompt}>
              <span>Select a test profile below to enter giveaways with demo balances.</span>
            </div>
          )}

          {/* Quick Persona Selector */}
          <div className={styles.mobilePersonaSelector}>
            <label htmlFor="mobile-profile-select" className={styles.personaSelectLabel}>
              Switch Demo Profile:
            </label>
            <select
              id="mobile-profile-select"
              className={styles.personaSelectInput}
              value={user?.userId || ''}
              onChange={(e) => {
                if (e.target.value === 'guest') {
                  logout();
                } else {
                  login(e.target.value);
                }
              }}
            >
              {demoUsers.map((du) => (
                <option key={du.userId} value={du.userId}>
                  {du.name} (Tier {du.tier} • {du.balances?.VEs} VEs)
                </option>
              ))}
              <option value="guest">Guest (Unauthenticated)</option>
            </select>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        <nav className={styles.mobileNavLinks} aria-label="Mobile Menu Links">
          <a
            href={getNavHref('#active-giveaways')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <Layers size={18} className={styles.linkIcon} />
            <span>Active Giveaways</span>
          </a>
          <a
            href={getNavHref('#how-it-works')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <Sparkles size={18} className={styles.linkIcon} />
            <span>How It Works</span>
          </a>
          <a
            href={getNavHref('#winners')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <Trophy size={18} className={styles.linkIcon} />
            <span>Winner Roster</span>
          </a>
          <a
            href={getNavHref('#faq')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <HelpCircle size={18} className={styles.linkIcon} />
            <span>FAQ & Rules</span>
          </a>
        </nav>

        {/* Mobile Primary CTA */}
        <div className={styles.mobileDrawerFooter}>
          <a
            href={getNavHref('#active-giveaways')}
            onClick={closeMobileMenu}
            className={styles.mobileCtaLink}
          >
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconRight={<ArrowRight size={18} />}
            >
              Explore Giveaways
            </Button>
          </a>

          {isAuthenticated ? (
            <button
              type="button"
              className={styles.mobileLogoutBtn}
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
            >
              <LogOut size={14} />
              <span>Switch to Unauthenticated Guest</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.mobileLoginBtn}
              onClick={() => {
                closeMobileMenu();
                login('user_alex');
              }}
            >
              <UserCircle size={14} />
              <span>Log in as Alex Rivera (VIP Tier 2)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
