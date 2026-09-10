import { Search, Wallet, Ticket, Trophy } from 'lucide-react';
import styles from './HowToParticipate.module.css';

const STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Explore Giveaways',
    description:
      'Browse active reward pools and review the prize, entry fee, eligibility, and closing time.',
  },
  {
    step: '02',
    icon: Wallet,
    title: 'Check Your Balance',
    description:
      'Use your available VELOOP reward balance to determine whether you can enter the giveaway.',
  },
  {
    step: '03',
    icon: Ticket,
    title: 'Join the Giveaway',
    description:
      'Confirm the entry fee and submit your participation before the pool countdown ends.',
  },
  {
    step: '04',
    icon: Trophy,
    title: 'Winner Draw & Claim',
    description:
      'When the giveaway concludes, winners are selected and eligible winners can submit required claim information.',
  },
];

/**
 * Production-ready How It Works / Participation Journey component with 4-step horizontal desktop progression.
 */
export const HowToParticipate = () => {
  return (
    <section id="how-it-works" className={styles.section} aria-label="How To Participate Guide">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.badge}>Step-by-Step Guide</span>
          <h2 className={styles.title}>How It Works</h2>
          <p className={styles.subtitle}>
            Explore reward pools, use your available VELOOP balance, and follow the giveaway process from entry to claim.
          </p>
        </div>

        {/* 4-Step Horizontal Progression Grid */}
        <div className={styles.stepsGrid}>
          {STEPS.map((item, idx) => {
            const IconComponent = item.icon;
            const isLast = idx === STEPS.length - 1;

            return (
              <div key={item.step} className={styles.stepCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.stepNumber}>{item.step}</span>
                  <div className={styles.iconWrapper}>
                    <IconComponent size={20} aria-hidden="true" />
                  </div>
                </div>

                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDescription}>{item.description}</p>

                {!isLast && <div className={styles.stepConnector} aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowToParticipate;
