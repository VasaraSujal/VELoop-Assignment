import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import styles from './FAQSection.module.css';

const FAQS = [
  {
    id: 'faq-1',
    question: 'How do I enter a giveaway pool on VELOOP?',
    answer:
      'Browse through our active giveaway pools, click "Join Now" or "View Details", review the prize requirements, and confirm your entry using your available VELOOP reward balance.',
  },
  {
    id: 'faq-2',
    question: 'What is the difference between VEs, SVEs, and Tokens?',
    answer:
      'VEs (Veloop Points) are primary reward points earned from everyday activities. SVEs (Super-VEs) are exclusive credits for high-tier reward draws. Tokens are micro-credits earned from daily gamification tasks, ideal for frequent voucher pools.',
  },
  {
    id: 'faq-3',
    question: 'How is the entry fee determined?',
    answer:
      'Each giveaway specifies an entry fee amount and reward currency (VEs, SVEs, or Tokens) configured specifically for that prize pool. Entry fees are deducted from your balance upon joining.',
  },
  {
    id: 'faq-4',
    question: 'Can I join a giveaway pool more than once?',
    answer:
      'Standard giveaway pools enforce a limit of one entry per user to ensure fair participation for all members.',
  },
  {
    id: 'faq-5',
    question: 'What happens when a giveaway ends?',
    answer:
      'When the pool countdown reaches zero, entry submissions close immediately, and the winner draw process takes place for that giveaway.',
  },
  {
    id: 'faq-6',
    question: 'How are winners announced?',
    answer:
      'Winners are announced publicly on the Recent Giveaway Winners showcase and the historical winner roster with privacy-safe masked identifiers.',
  },
  {
    id: 'faq-7',
    question: 'What happens if I win?',
    answer:
      'If you are selected as a winner, your status will update in your account, and you can submit the required prize claim information directly through the platform.',
  },
  {
    id: 'faq-8',
    question: 'What information is required to claim a prize?',
    answer:
      'Physical items (such as smartphones and watches) require your shipping address for fulfillment. Digital Amazon gift cards require voucher code issuance confirmation.',
  },
  {
    id: 'faq-9',
    question: "What happens if I don't have enough balance to join?",
    answer:
      'If your available balance is lower than the required entry fee, you will see a balance reminder. You can participate once you accumulate enough reward credits from platform activity.',
  },
  {
    id: 'faq-10',
    question: 'Can I participate in an upcoming giveaway?',
    answer:
      'Upcoming giveaways are visible for advance preview. You can review the prize, entry fee, and scheduled start date until the pool officially opens for entries.',
  },
];

/**
 * Production-ready FAQ Accordion component with accessible button controls, smooth expand/collapse, and truthful answers.
 */
export const FAQSection = () => {
  const [openId, setOpenId] = useState('faq-1');

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className={styles.section} aria-label="Frequently Asked Questions">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.badge}>
            <HelpCircle size={13} className={styles.badgeIcon} aria-hidden="true" />
            Need Help?
          </span>
          <h2 className={styles.title}>Frequently Asked Questions</h2>
          <p className={styles.subtitle}>
            Everything you need to know about VELOOP reward pools, entries, and prize fulfillment.
          </p>
        </div>

        {/* Accordion List */}
        <div className={styles.accordionList} role="presentation">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            const buttonId = `faq-btn-${faq.id}`;
            const panelId = `faq-panel-${faq.id}`;

            return (
              <div
                key={faq.id}
                className={`${styles.accordionItem} ${isOpen ? styles.accordionItemActive : ''}`}
              >
                <button
                  id={buttonId}
                  type="button"
                  className={styles.accordionButton}
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className={styles.questionText}>{faq.question}</span>
                  <div className={`${styles.iconWrapper} ${isOpen ? styles.iconWrapperActive : ''}`}>
                    <ChevronDown
                      size={18}
                      className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
                      aria-hidden="true"
                    />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={styles.answerBox}
                  >
                    <p className={styles.answerText}>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
