import { Scale, ShieldCheck, PackageCheck, FileCheck } from 'lucide-react';
import styles from './TrustSection.module.css';

const TRUST_PRINCIPLES = [
  {
    icon: Scale,
    title: 'Fair & Transparent',
    description:
      'Giveaway rules, closing times, and participation requirements are clearly published for every pool.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Participation',
    description:
      'Authentication, balance validation, and anti-fraud controls help protect participation.',
  },
  {
    icon: PackageCheck,
    title: 'Clear Prize & Claim Process',
    description:
      'Prize details, winner announcements, and required fulfillment information are clearly presented.',
  },
  {
    icon: FileCheck,
    title: 'Auditable Giveaway Activity',
    description:
      'Participation, entry deductions, and winner draws are recorded by the platform for operational traceability.',
  },
];

/**
 * Production-ready Trust & Security section featuring a strategic dark navy anchor panel and 4 factual trust principles.
 */
export const TrustSection = () => {
  return (
    <section id="trust" className={styles.section} aria-label="Trust & Security Principles">
      <div className={styles.container}>
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <span className={styles.badge}>Platform Integrity</span>
            <h2 className={styles.title}>Built on Trust &amp; Transparency</h2>
            <p className={styles.subtitle}>
              Our rewards platform is designed around account safety, clear winner selection, and a straightforward prize claim process.
            </p>
          </div>

          {/* 4 Trust Principles Grid */}
          <div className={styles.grid}>
            {TRUST_PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              return (
                <div key={principle.title} className={styles.featureCard}>
                  <div className={styles.iconWrapper}>
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className={styles.featureTitle}>{principle.title}</h3>
                  <p className={styles.featureText}>{principle.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
