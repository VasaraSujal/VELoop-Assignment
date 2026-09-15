import { ArrowRight, Sparkles, Gift } from 'lucide-react';
import { Button } from '../common/ui/Button.jsx';
import { useScrollReveal } from '../../utils/useScrollReveal.js';
import styles from './FinalCTA.module.css';

/**
 * Pre-Footer High-Impact CTA Banner with scroll reveal
 */
export const FinalCTA = () => {
  const [sectionRef, isVisible] = useScrollReveal({ threshold: 0.1 });

  return (
    <section
      ref={sectionRef}
      className={`${styles.ctaSection} ${isVisible ? styles.sectionVisible : ''}`}
      aria-label="Ready to Enter"
    >
      <div className={styles.container}>
        <div className={styles.ctaCard}>
          <div className={styles.backgroundGlow} aria-hidden="true" />
          
          <div className={styles.content}>
            <div className={styles.badge}>
              <Sparkles size={13} className={styles.badgeIcon} aria-hidden="true" />
              <span>Ready to Enter?</span>
            </div>

            <h2 className={styles.title}>
              Explore Active VELOOP Giveaways
            </h2>

            <p className={styles.subtitle}>
              Use your available reward balance to join exclusive hardware and gift card prize pools.
            </p>

            <div className={styles.actions}>
              <a href="#active-giveaways" className={styles.ctaLink}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Gift size={18} />}
                  iconRight={<ArrowRight size={18} />}
                >
                  Explore Giveaways
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
