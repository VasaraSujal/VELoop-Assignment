import { UserCheck, Ticket, Clock, Trophy, ShieldAlert } from 'lucide-react';
import styles from './RulesSection.module.css';

const RULE_GROUPS = [
  {
    icon: UserCheck,
    title: 'Eligibility Requirements',
    rules: [
      'Participants must hold a valid, registered VELOOP member account in good standing.',
      'Giveaway-specific eligibility requirements, when applicable, are shown with the relevant pool.',
    ],
  },
  {
    icon: Ticket,
    title: 'Participation & Entry Rules',
    rules: [
      'Standard giveaway pools enforce a limit of one entry per participant.',
      'Required entry fee (in VEs, SVEs, or Tokens) is deducted immediately upon joining.',
      'Your available balance must meet or exceed the entry fee before participating.',
    ],
  },
  {
    icon: Clock,
    title: 'Pool Lifecycle & Timelines',
    rules: [
      'Upcoming pools are visible for preview but do not accept entries until the start date.',
      'Active pools accept entries until the closing countdown reaches zero.',
      'Concluded pools no longer accept entries; winner draws occur after the pool ends.',
    ],
  },
  {
    icon: Trophy,
    title: 'Winner Selection & Claim Process',
    rules: [
      'Winners are announced publicly with privacy-masked account identifiers.',
      'Physical items require shipping address submission; digital gift cards require voucher code claim confirmation.',
    ],
  },
  {
    icon: ShieldAlert,
    title: 'Fair Play & Account Integrity',
    rules: [
      'Multiple accounts, automated scripts, or abusive activity are strictly prohibited.',
      'Accounts flagged for manipulation or policy violations will be restricted from prize fulfillment.',
    ],
  },
];

/**
 * Production-ready Rules & Eligibility component with 2-column desktop layout and scannable rule categories.
 */
export const RulesSection = () => {
  return (
    <section id="rules" className={styles.section} aria-label="Giveaway Rules and Eligibility Guidelines">
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* Left Column: Heading & Context */}
          <div className={styles.stickyHeader}>
            <span className={styles.badge}>Fair Play Guidelines</span>
            <h2 className={styles.title}>Rules &amp; Eligibility</h2>
            <p className={styles.subtitle}>
              Clear, transparent rules governing pool participation, entry requirements, draw timing, and prize claims.
            </p>

            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Important Reminders</h3>
              <ul className={styles.summaryList}>
                <li>One entry per user per giveaway pool</li>
                <li>Zero real-money fees — entries use reward balances</li>
                <li>Masked public winner transparency on all draws</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Stacked Rule Categories */}
          <div className={styles.rulesStack}>
            {RULE_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className={styles.ruleGroup}>
                  <div className={styles.groupHeader}>
                    <div className={styles.iconWrapper}>
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <h3 className={styles.groupTitle}>{group.title}</h3>
                  </div>

                  <ul className={styles.bulletList}>
                    {group.rules.map((rule, idx) => (
                      <li key={idx} className={styles.bulletItem}>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RulesSection;
