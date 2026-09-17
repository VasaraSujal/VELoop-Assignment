import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  Trophy,
  HelpCircle,
  Layers,
  Sparkles,
  UserCircle,
  LogOut,
  ShieldCheck,
  FileText,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatNumber } from '../../utils/currencyFormatter.js';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import styles from './Header.module.css';

/**
 * Main Primary Navigation Header with integrated full-viewport portal drawer and account summary.
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

  // Portal-based Mobile Navigation Drawer for 100% viewport coverage
  const mobileDrawerContent = (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.drawerBackdrop} ${mobileMenuOpen ? styles.backdropOpen : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div
        id="mobile-navigation-drawer"
        ref={drawerRef}
        className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!mobileMenuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerBrand}>
            <div className={styles.logoIconBox}>
              <img
                src="/assets/prizes/Animation-VELoop-xJgvrjNN.gif"
                alt="VELOOP Logo"
                className={styles.logoImg}
              />
            </div>
            <div className={styles.drawerBrandTextWrap}>
              <span className={styles.drawerBrandText}>VELoop Rewards</span>
              <span className={styles.drawerBrandBadge}>Giveaways</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={20} />
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
              value={user?.userId || 'guest'}
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

        {/* Mobile Navigation Links - Displays ALL Sections */}
        <div className={styles.navSectionLabel}>EXPLORE SECTIONS</div>
        <nav className={styles.mobileNavLinks} aria-label="Mobile Menu Links">
          <a
            href={getNavHref('#active-giveaways')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <div className={styles.linkIconWrap}>
              <Layers size={18} className={styles.linkIcon} />
            </div>
            <div className={styles.linkTextGroup}>
              <span className={styles.linkTitle}>Active Giveaways</span>
              <span className={styles.linkDesc}>Browse open reward pools</span>
            </div>
          </a>

          <a
            href={getNavHref('#leaderboard')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <div className={styles.linkIconWrap}>
              <Trophy size={18} className={styles.linkIcon} />
            </div>
            <div className={styles.linkTextGroup}>
              <span className={styles.linkTitle}>Leaderboard</span>
              <span className={styles.linkDesc}>Top participants &amp; draws</span>
            </div>
          </a>

          <a
            href={getNavHref('#winners')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <div className={styles.linkIconWrap}>
              <Award size={18} className={styles.linkIcon} />
            </div>
            <div className={styles.linkTextGroup}>
              <span className={styles.linkTitle}>Winner Roster</span>
              <span className={styles.linkDesc}>Verified winners &amp; draw history</span>
            </div>
          </a>

          <a
            href={getNavHref('#how-it-works')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <div className={styles.linkIconWrap}>
              <Sparkles size={18} className={styles.linkIcon} />
            </div>
            <div className={styles.linkTextGroup}>
              <span className={styles.linkTitle}>How It Works</span>
              <span className={styles.linkDesc}>4-step participation guide</span>
            </div>
          </a>

          <a
            href={getNavHref('#trust')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <div className={styles.linkIconWrap}>
              <ShieldCheck size={18} className={styles.linkIcon} />
            </div>
            <div className={styles.linkTextGroup}>
              <span className={styles.linkTitle}>Trust &amp; Platform Integrity</span>
              <span className={styles.linkDesc}>Fairness, audit trails &amp; zero cost</span>
            </div>
          </a>

          <a
            href={getNavHref('#rules')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <div className={styles.linkIconWrap}>
              <FileText size={18} className={styles.linkIcon} />
            </div>
            <div className={styles.linkTextGroup}>
              <span className={styles.linkTitle}>Rules &amp; Eligibility</span>
              <span className={styles.linkDesc}>Terms, tier requirements &amp; draw rules</span>
            </div>
          </a>

          <a
            href={getNavHref('#faq')}
            className={styles.mobileLink}
            onClick={closeMobileMenu}
          >
            <div className={styles.linkIconWrap}>
              <HelpCircle size={18} className={styles.linkIcon} />
            </div>
            <div className={styles.linkTextGroup}>
              <span className={styles.linkTitle}>Frequently Asked Questions</span>
              <span className={styles.linkDesc}>Answers &amp; claim process help</span>
            </div>
          </a>
        </nav>

        {/* Mobile Primary CTA & Auth Actions */}
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
              <LogOut size={15} />
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
              <UserCircle size={15} />
              <span>Quick Login as Alex Rivera (VIP Tier 2)</span>
            </button>
          )}
        </div>
      </div>
    </>
  );

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
            <img
              src="/assets/prizes/Animation-VELoop-xJgvrjNN.gif"
              alt="VELOOP Logo"
              className={styles.logoImg}
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandMain}>VELoop</span>
            <span className={styles.brandSub}>Rewards</span>
          </div>
          <span className={styles.brandBadge}>Giveaways</span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <a href={getNavHref('#active-giveaways')} className={styles.navLink}>
            <span>Giveaways</span>
          </a>
          <a href={getNavHref('#leaderboard')} className={styles.navLink}>
            <span>Leaderboard</span>
          </a>
          <a href={getNavHref('#how-it-works')} className={styles.navLink}>
            <span>How It Works</span>
          </a>
          <a href={getNavHref('#winners')} className={styles.navLink}>
            <span>Winners</span>
          </a>
          <a href={getNavHref('#rules')} className={styles.navLink}>
            <span>Rules</span>
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

      {/* Render Mobile Navigation Drawer directly to body via portal */}
      {typeof document !== 'undefined' && createPortal(mobileDrawerContent, document.body)}
    </header>
  );
};

export default Header;

