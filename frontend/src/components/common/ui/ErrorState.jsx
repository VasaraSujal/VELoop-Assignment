import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';
import styles from './ErrorState.module.css';

/**
 * Reusable ErrorState container when an API request or operation fails.
 */
export const ErrorState = ({
  icon = null,
  title = 'Something went wrong',
  message = 'We encountered an error while loading this information. Please try again.',
  onRetry = null,
  retryLabel = 'Try Again',
  action = null,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${styles.errorState} ${className}`} role="alert" {...rest}>
      <div className={styles.iconWrapper} aria-hidden="true">
        {icon || <AlertCircle size={28} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {(action || onRetry) && (
        <div className={styles.actionWrapper}>
          {onRetry && !action && (
            <Button
              variant="secondary"
              size="md"
              onClick={onRetry}
              icon={<RefreshCw size={15} />}
            >
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
};

export default ErrorState;
