import { Gift, ShieldCheck, Coins, Trophy } from 'lucide-react';
import styles from './HowToParticipate.module.css';

const STEPS = [
  {
    step: '01',
    icon: Gift,
    title: 'Choose a Giveaway',
    description:
      'Browse active prize pools including flagship smartphones, smartwatches, and retail shopping vouchers.',
  },
  {
    step: '02',
    icon: ShieldCheck,
    title: 'Check Eligibility',
    description:
      'Review pool tier requirements and entry rules. Most giveaway pools are open to all active VELOOP members.',
  },
  {
    step: '03',
    icon: Coins,
    title: 'Use Reward Balance',
    description:
      'Enter the draw using your earned VEs, SVEs, or Tokens balance with zero real-money cost.',
  },
  {
    step: '04',
    icon: Trophy,
    title: 'Winner Draw & Claim',
    description:
      'Winners are randomly drawn when the countdown concludes. Claim physical doorstep delivery or instant e-codes.',
  },
];

export const HowToParticipate = () => {
  return (
    <section id="how-it-works" className={styles.section} aria-label="How To Participate Guide">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>Simple 4-Step Process</span>
          <h2 className={styles.title}>How to Participate</h2>
          <p className={styles.subtitle}>
            Enter high-value reward draws in seconds using your accumulated VELOOP reward credits.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {STEPS.map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={item.step} className={styles.stepCard}>
                <span className={styles.stepNumber}>{item.step}</span>
                <div className={styles.iconWrapper}>
                  <IconComponent size={22} />
                </div>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDescription}>{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowToParticipate;
