import { forwardRef } from 'react';
import styles from './Button.module.css';

/**
 * Reusable accessible Button component with standard variants and loading states.
 */
export const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      icon = null,
      iconRight = null,
      type = 'button',
      className = '',
      as: Component = 'button',
      ...rest
    },
    ref
  ) => {
    const isButtonTag = Component === 'button';
    const isDisabled = disabled || isLoading;

    const variantClass = styles[variant] || styles.primary;
    const sizeClass = styles[size] || styles.md;
    const widthClass = fullWidth ? styles.fullWidth : '';
    const loadingClass = isLoading ? styles.loading : '';

    return (
      <Component
        ref={ref}
        type={isButtonTag ? type : undefined}
        disabled={isButtonTag ? isDisabled : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-busy={isLoading ? 'true' : undefined}
        className={`${styles.button} ${variantClass} ${sizeClass} ${widthClass} ${loadingClass} ${className}`}
        {...rest}
      >
        {isLoading && (
          <span className={styles.spinnerWrapper} aria-hidden="true">
            <span className={styles.spinner} />
          </span>
        )}
        {!isLoading && icon && <span className={styles.iconLeft} aria-hidden="true">{icon}</span>}
        <span className={styles.label}>{children}</span>
        {!isLoading && iconRight && <span className={styles.iconRight} aria-hidden="true">{iconRight}</span>}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export default Button;
