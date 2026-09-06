import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Menu, X, ArrowRight } from 'lucide-react';
import styles from './Header.module.css';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        {/* Brand */}
        <Link to="/" className={styles.brand} aria-label="VELOOP Rewards Home" onClick={closeMobileMenu}>
          <Gift size={24} color="var(--color-primary)" />
          <span>VELOOP Rewards</span>
          <span className={styles.brandBadge}>Giveaways</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <a href="#active-giveaways" className={styles.navLink}>
            Active Pools
          </a>
          <a href="#how-it-works" className={styles.navLink}>
            How It Works
          </a>
          <a href="#winners" className={styles.navLink}>
            Winners
          </a>
          <a href="#faq" className={styles.navLink}>
            FAQ
          </a>
          <a href="#active-giveaways" className={styles.ctaBtn}>
            <span>Explore Giveaways</span>
            <ArrowRight size={15} />
          </a>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav className={styles.mobileDrawer} aria-label="Mobile Navigation">
          <a href="#active-giveaways" className={styles.mobileNavLink} onClick={closeMobileMenu}>
            Active Giveaways
          </a>
          <a href="#how-it-works" className={styles.mobileNavLink} onClick={closeMobileMenu}>
            How It Works
          </a>
          <a href="#winners" className={styles.mobileNavLink} onClick={closeMobileMenu}>
            Winners Log
          </a>
          <a href="#faq" className={styles.mobileNavLink} onClick={closeMobileMenu}>
            FAQ
          </a>
          <a
            href="#active-giveaways"
            className={styles.ctaBtn}
            onClick={closeMobileMenu}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            <span>Explore Giveaways</span>
            <ArrowRight size={16} />
          </a>
        </nav>
      )}
    </header>
  );
};

export default Header;
