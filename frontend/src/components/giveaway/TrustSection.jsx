import { ShieldCheck, Scale, Truck, FileCheck } from 'lucide-react';
import styles from './TrustSection.module.css';

const TRUST_FEATURES = [
  {
    icon: Scale,
    title: 'Cryptographic Random Selection',
    description:
      'Winner selection runs on CSPRNG cryptographically secure random algorithms ensuring every entry has an equal mathematical probability.',
  },
  {
    icon: ShieldCheck,
    title: 'Anti-Fraud Protection',
    description:
      'Multi-layer rate limiting and velocity controls eliminate bot entries, preserving prize integrity for legitimate VELOOP members.',
  },
  {
    icon: Truck,
    title: 'Doorstep & E-Fulfillment',
    description:
      'Physical items are dispatched via tracked courier partners across India. Digital vouchers are delivered with zero delays.',
  },
  {
    icon: FileCheck,
    title: 'Immutable Audit Trail',
    description:
      'Every balance deduction, ticket entry, and winner verification is recorded in comprehensive platform audit ledgers.',
  },
];

export const TrustSection = () => {
  return (
    <section className={styles.section} aria-label="Trust & Security Principles">
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>Platform Integrity</span>
          <h2 className={styles.title}>Built on Trust & Transparency</h2>
          <p className={styles.subtitle}>
            Our giveaway architecture is engineered around fairness, account safety, and reliable prize fulfillment.
          </p>
        </div>

        <div className={styles.grid}>
          {TRUST_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className={styles.feature}>
                <div className={styles.iconBox}>
                  <Icon size={22} />
                </div>
                <h3 className={styles.featureTitle}>{feat.title}</h3>
                <p className={styles.featureText}>{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
