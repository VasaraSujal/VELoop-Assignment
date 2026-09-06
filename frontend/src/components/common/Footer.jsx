import { Gift } from 'lucide-react';
import styles from './Footer.module.css';

export const Footer = () => {
  return (
    <footer className={styles.footer} aria-label="Page Footer">
      <div className={styles.container}>
        {/* Brand & Overview */}
        <div className={styles.brandCol}>
          <div className={styles.brandLink}>
            <Gift size={24} color="var(--color-primary-light)" />
            <span>VELOOP Rewards</span>
          </div>
          <p className={styles.brandText}>
            The premium gamified giveaway platform for VELOOP members. Enter verified prize pools using your earned loyalty balances.
          </p>
        </div>

        {/* Quick Navigation */}
        <div>
          <h4 className={styles.colTitle}>Giveaway Pools</h4>
          <ul className={styles.linkList}>
            <li>
              <a href="#active-giveaways" className={styles.footerLink}>
                Flagship Electronics
              </a>
            </li>
            <li>
              <a href="#active-giveaways" className={styles.footerLink}>
                Amazon Pay Vouchers
              </a>
            </li>
            <li>
              <a href="#active-giveaways" className={styles.footerLink}>
                Micro-Token Pools
              </a>
            </li>
            <li>
              <a href="#how-it-works" className={styles.footerLink}>
                Participation Guide
              </a>
            </li>
          </ul>
        </div>

        {/* Transparency & Rules */}
        <div>
          <h4 className={styles.colTitle}>Fair Play & Trust</h4>
          <ul className={styles.linkList}>
            <li>
              <a href="#winners" className={styles.footerLink}>
                Verified Winners Roster
              </a>
            </li>
            <li>
              <a href="#how-it-works" className={styles.footerLink}>
                Provably Fair Draws
              </a>
            </li>
            <li>
              <a href="#faq" className={styles.footerLink}>
                Eligibility Rules
              </a>
            </li>
            <li>
              <a href="#faq" className={styles.footerLink}>
                Prize Claim Support
              </a>
            </li>
          </ul>
        </div>

        {/* Reward Currencies */}
        <div>
          <h4 className={styles.colTitle}>Reward Balances</h4>
          <ul className={styles.linkList}>
            <li>
              <span className={styles.footerLink} style={{ color: '#a5b4fc' }}>
                VEs • Core Loyalty Points
              </span>
            </li>
            <li>
              <span className={styles.footerLink} style={{ color: '#fde68a' }}>
                SVEs • Super-Tier Credits
              </span>
            </li>
            <li>
              <span className={styles.footerLink} style={{ color: '#a7f3d0' }}>
                Tokens • Daily Activity Units
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomRow}>
        <span className={styles.demoBadge}>
          Phase 1 Active • Displayed prize pools and winners are mock demonstration datasets
        </span>
        <span className={styles.copyright}>
          © 2026 VELOOP Rewards. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
