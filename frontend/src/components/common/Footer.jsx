import { Link, useLocation } from 'react-router-dom';
import { Gift, ShieldCheck } from 'lucide-react';
import styles from './Footer.module.css';

/**
 * Stage I: Production-Ready Branded Footer Component
 * Provides scannable navigation, platform integrity links, reward balance summary,
 * and responsive multi-column layout using Stage A design tokens.
 */
export const Footer = () => {
  const location = useLocation();

  // Helper to construct hash URLs whether on homepage or subpage
  const getNavHref = (hash) => {
    return location.pathname === '/' ? hash : `/${hash}`;
  };

  return (
    <footer className={styles.footer} aria-label="Footer">
      <div className={styles.container}>
        {/* Brand & Overview Column */}
        <div className={styles.brandCol}>
          <Link to="/" className={styles.brandLink} aria-label="VELOOP Rewards - Return to Homepage">
            <div className={styles.logoIconBox}>
              <Gift size={20} className={styles.logoGiftIcon} aria-hidden="true" />
            </div>
            <div className={styles.brandTextWrap}>
              <span className={styles.brandMain}>VELOP</span>
              <span className={styles.brandSub}>Rewards</span>
            </div>
            <span className={styles.brandBadge}>Giveaways</span>
          </Link>
          <p className={styles.brandText}>
            Reward pools, entries, winners, and prize claims in one clear giveaway experience.
          </p>
          <div className={styles.platformBadge}>
            <ShieldCheck size={14} className={styles.platformBadgeIcon} aria-hidden="true" />
            <span>Official Platform Experience</span>
          </div>
        </div>

        {/* Navigation Column 1: Giveaway Pools */}
        <div className={styles.navCol}>
          <h3 className={styles.colTitle}>Giveaway Pools</h3>
          <ul className={styles.linkList}>
            <li>
              <a href={getNavHref('#active-giveaways')} className={styles.footerLink}>
                Active Giveaways
              </a>
            </li>
            <li>
              <a href={getNavHref('#how-it-works')} className={styles.footerLink}>
                How It Works
              </a>
            </li>
            <li>
              <a href={getNavHref('#winners')} className={styles.footerLink}>
                Recent Winners
              </a>
            </li>
            <li>
              <a href={getNavHref('#faq')} className={styles.footerLink}>
                Frequently Asked Questions
              </a>
            </li>
          </ul>
        </div>

        {/* Navigation Column 2: Guidelines & Integrity */}
        <div className={styles.navCol}>
          <h3 className={styles.colTitle}>Guidelines &amp; Integrity</h3>
          <ul className={styles.linkList}>
            <li>
              <a href={getNavHref('#rules')} className={styles.footerLink}>
                Rules &amp; Eligibility
              </a>
            </li>
            <li>
              <a href={getNavHref('#trust')} className={styles.footerLink}>
                Platform Integrity &amp; Trust
              </a>
            </li>
            <li>
              <a href={getNavHref('#rules')} className={styles.footerLink}>
                Single Entry Policy
              </a>
            </li>
            <li>
              <a href={getNavHref('#faq')} className={styles.footerLink}>
                Prize Claim Process
              </a>
            </li>
          </ul>
        </div>

        {/* Navigation Column 3: Reward Balances */}
        <div className={styles.navCol}>
          <h3 className={styles.colTitle}>Reward Balances</h3>
          <ul className={styles.linkList}>
            <li className={styles.currencyItem}>
              <span className={styles.currencyBadgeVes}>VEs</span>
              <span className={styles.currencyLabel}>Core Loyalty Points</span>
            </li>
            <li className={styles.currencyItem}>
              <span className={styles.currencyBadgeSves}>SVEs</span>
              <span className={styles.currencyLabel}>Super Reward Credits</span>
            </li>
            <li className={styles.currencyItem}>
              <span className={styles.currencyBadgeTokens}>Tokens</span>
              <span className={styles.currencyLabel}>Daily Activity Units</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className={styles.bottomRow}>
        <div className={styles.bottomContainer}>
          <span className={styles.copyright}>
            © {new Date().getFullYear()} VELOOP Rewards. All rights reserved.
          </span>
          <span className={styles.bottomTagline}>
            Official VELOOP Rewards Giveaway System
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
