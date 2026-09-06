import styles from './RulesSection.module.css';

const RULES = [
  {
    num: '01',
    title: 'Eligibility & Membership',
    text: 'Participants must be registered VELOOP account holders. Physical delivery prizes (such as smartphones) require Tier 1+ KYC verification.',
  },
  {
    num: '02',
    title: 'Entry Deductions & Currency',
    text: 'Entry fees in VEs, SVEs, or Tokens are deducted from your balance upon pool entry. Entries are non-refundable once the pool activates.',
  },
  {
    num: '03',
    title: 'Draw Process & Prize Claims',
    text: 'When the timer hits zero, winners are drawn within 24 hours. Winners have 14 days to submit shipping details or claim their e-voucher code.',
  },
];

export const RulesSection = () => {
  return (
    <section className={styles.section} aria-label="Giveaway Rules and Eligibility">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>Fair Play Guidelines</span>
          <h2 className={styles.title}>Rules & Eligibility</h2>
          <p className={styles.subtitle}>
            Key terms governing entry participation, winner selection, and prize fulfillment.
          </p>
        </div>

        <div className={styles.rulesGrid}>
          {RULES.map((rule) => (
            <div key={rule.num} className={styles.ruleCard}>
              <span className={styles.ruleNumber}>Rule {rule.num}</span>
              <h3 className={styles.ruleTitle}>{rule.title}</h3>
              <p className={styles.ruleText}>{rule.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RulesSection;
