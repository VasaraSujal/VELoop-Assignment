import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

/**
 * Reusable EmptyState container when lists or queries return 0 items.
 */
export const EmptyState = ({
  icon = null,
  title = 'No items found',
  description = 'There are currently no records available in this section.',
  action = null,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${styles.emptyState} ${className}`} role="status" {...rest}>
      <div className={styles.iconWrapper} aria-hidden="true">
        {icon || <Inbox size={32} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actionWrapper}>{action}</div>}
    </div>
  );
};

export default EmptyState;
