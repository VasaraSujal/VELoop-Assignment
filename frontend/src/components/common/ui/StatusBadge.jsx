import styles from './StatusBadge.module.css';

const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Live Now',
    variant: 'active',
    pulse: true,
  },
  UPCOMING: {
    label: 'Upcoming',
    variant: 'upcoming',
    pulse: false,
  },
  ENDED: {
    label: 'Closed',
    variant: 'ended',
    pulse: false,
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'completed',
    pulse: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'cancelled',
    pulse: false,
  },
  DRAFT: {
    label: 'Draft',
    variant: 'draft',
    pulse: false,
  },
};

/**
 * Specialized badge for authoritative giveaway pool statuses.
 * 
 * @param {Object} props
 * @param {string} props.status - e.g. 'ACTIVE', 'UPCOMING', 'ENDED', 'COMPLETED'
 * @param {'sm'|'md'} [props.size='md']
 * @param {boolean} [props.pulse] - Explicit pulse override
 * @param {string} [props.customLabel] - Optional custom label
 * @param {string} [props.className]
 */
export const StatusBadge = ({
  status,
  size = 'md',
  pulse,
  customLabel,
  className = '',
  ...rest
}) => {
  const normalizedStatus = (status || 'UNKNOWN').toUpperCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    variant: 'default',
    pulse: false,
  };

  const shouldPulse = pulse !== undefined ? pulse : config.pulse;
  const sizeClass = styles[size] || styles.md;
  const variantClass = styles[config.variant] || styles.default;

  return (
    <span
      className={`${styles.statusBadge} ${variantClass} ${sizeClass} ${className}`}
      role="status"
      aria-label={`Status: ${customLabel || config.label}`}
      {...rest}
    >
      <span
        className={`${styles.dot} ${shouldPulse ? styles.pulseDot : ''}`}
        aria-hidden="true"
      />
      <span className={styles.label}>{customLabel || config.label}</span>
    </span>
  );
};

export default StatusBadge;
