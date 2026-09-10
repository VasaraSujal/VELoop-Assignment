import { Link } from 'react-router-dom';
import { Sparkles, HelpCircle, Trophy, BookOpen, Compass } from 'lucide-react';
import { Button } from '../../components/common/ui/Button.jsx';
import { Badge } from '../../components/common/ui/Badge.jsx';
import styles from './NotFoundPage.module.css';

export const NotFoundPage = () => {
  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.card}>
        <div className={styles.badgeRow}>
          <Badge variant="navy" size="md" icon={<Compass size={14} />}>
            Error 404
          </Badge>
        </div>

        <div className={styles.codeVisual} aria-hidden="true">
          <span className={styles.codeDigit}>4</span>
          <span className={styles.codeGlow}>0</span>
          <span className={styles.codeDigit}>4</span>
        </div>

        <h1 id="not-found-title" className={styles.title}>
          Page Not Found
        </h1>

        <p className={styles.description}>
          The giveaway pool or resource you are looking for doesn&apos;t exist, has concluded, or may have been moved.
        </p>

        {/* Primary Action CTA */}
        <div className={styles.primaryAction}>
          <Link to="/" className={styles.actionLink}>
            <Button
              variant="primary"
              size="lg"
              iconLeft={<Sparkles size={18} />}
            >
              Explore Giveaways
            </Button>
          </Link>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        {/* Secondary Quick Navigation */}
        <div className={styles.quickNavSection}>
          <span className={styles.quickNavHeading}>Or explore platform sections:</span>
          <div className={styles.quickNavGrid}>
            <a href="/#how-it-works" className={styles.quickNavLink}>
              <Button variant="secondary" size="sm" iconLeft={<BookOpen size={14} />}>
                How It Works
              </Button>
            </a>
            <a href="/#winners" className={styles.quickNavLink}>
              <Button variant="secondary" size="sm" iconLeft={<Trophy size={14} />}>
                Winner Roster
              </Button>
            </a>
            <a href="/#faq" className={styles.quickNavLink}>
              <Button variant="secondary" size="sm" iconLeft={<HelpCircle size={14} />}>
                Platform FAQ
              </Button>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
