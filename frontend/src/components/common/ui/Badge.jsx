import styles from './Badge.module.css';

/**
 * Reusable Badge component for currencies, tags, categories and status indicators.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'|'neutral'|'ves'|'sves'|'tokens'|'navy'} [props.variant='default']
 * @param {'sm'|'md'} [props.size='md']
 * @param {boolean} [props.dot=false] - Optional glowing indicator dot
 * @param {React.ReactNode} [props.icon] - Optional leading icon
 * @param {string} [props.className] - Optional custom CSS class
 */
export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon = null,
  className = '',
  ...rest
}) => {
  const variantClass = styles[variant] || styles.default;
  const sizeClass = styles[size] || styles.md;

  return (
    <span className={`${styles.badge} ${variantClass} ${sizeClass} ${className}`} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {icon && <span className={styles.iconWrapper} aria-hidden="true">{icon}</span>}
      <span className={styles.text}>{children}</span>
    </span>
  );
};

export default Badge;
