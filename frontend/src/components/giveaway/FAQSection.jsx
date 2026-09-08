import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FAQSection.module.css';

const FAQS = [
  {
    id: 'faq-1',
    question: 'How do I enter a giveaway pool on VELOOP?',
    answer:
      'Browse through our active giveaway pools, click "View Details", and review the pool requirements. If you have the required entry fee in VEs, SVEs, or Tokens, you can confirm your entry with a single click.',
  },
  {
    id: 'faq-2',
    question: 'What is the difference between VEs, SVEs, and Tokens?',
    answer:
      'VEs (Veloop Points) are primary reward points earned from everyday platform activities. SVEs (Super-VEs) are exclusive tier credits reserved for premium giveaways. Tokens are micro-credits earned from daily gamification tasks, ideal for frequent micro-voucher pools.',
  },
  {
    id: 'faq-3',
    question: 'Can I enter a giveaway pool more than once?',
    answer:
      'Entry limits depend on individual pool rules. Flagship physical giveaways generally enforce a fair one-ticket-per-user limit to ensure equal probability. Selected micro-voucher pools may allow multiple entries.',
  },
  {
    id: 'faq-4',
    question: 'How are winners selected?',
    answer:
      'Once a giveaway countdown concludes, the platform executes an automated cryptographic random draw algorithm (CSPRNG) across all verified entries. The drawn winners are published immediately to the public winner roster with privacy masking.',
  },
  {
    id: 'faq-5',
    question: 'What happens when a giveaway ends?',
    answer:
      'When the pool timer reaches zero, entry submissions close immediately. Winner selection runs automatically, and verified winners receive in-app notifications and email alerts with instructions to claim their prizes.',
  },
  {
    id: 'faq-6',
    question: 'How do winners claim physical or digital prizes?',
    answer:
      'Winners of physical prizes (like smartphones or watches) submit their delivery address through the claim form for tracked courier shipment. Winners of digital Amazon gift cards receive instant voucher codes directly in their VELOOP claim dashboard.',
  },
];

export const FAQSection = () => {
  const [openId, setOpenId] = useState('faq-1');

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className={styles.section} aria-label="Frequently Asked Questions">
      <div className={styles.header}>
        <span className={styles.badge}>Need Help?</span>
        <h2 className={styles.title}>Frequently Asked Questions</h2>
        <p className={styles.subtitle}>
          Everything you need to know about VELOOP reward pools, entries, and prize fulfillment.
        </p>
      </div>

      <div className={styles.accordionList}>
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`${styles.accordionItem} ${isOpen ? styles.accordionItemActive : ''}`}
            >
              <button
                type="button"
                className={styles.accordionButton}
                onClick={() => toggle(faq.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <span className={styles.questionText}>{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
                />
              </button>

              {isOpen && (
                <div id={`faq-answer-${faq.id}`} className={styles.answerBox} role="region">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQSection;
