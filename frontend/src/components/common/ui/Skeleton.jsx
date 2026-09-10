import styles from './Skeleton.module.css';

/**
 * Reusable Shimmer Skeleton component to prevent layout shifts during data fetching.
 * 
 * @param {Object} props
 * @param {'text'|'rect'|'circle'|'card'} [props.variant='rect']
 * @param {string|number} [props.width]
 * @param {string|number} [props.height]
 * @param {string} [props.borderRadius]
 * @param {number} [props.count=1] - Render multiple lines of skeleton
 * @param {string} [props.className]
 */
export const Skeleton = ({
  variant = 'rect',
  width,
  height,
  borderRadius,
  count = 1,
  theme = 'light',
  className = '',
  style = {},
  ...rest
}) => {
  const inlineStyle = {
    ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...(borderRadius ? { borderRadius } : {}),
    ...style,
  };

  const variantClass = styles[variant] || styles.rect;
  const themeClass = theme === 'dark' ? styles.dark : styles.light;

  if (count > 1) {
    return (
      <div className={styles.group}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${styles.skeleton} ${themeClass} ${variantClass} ${className}`}
            style={inlineStyle}
            aria-hidden="true"
            {...rest}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeleton} ${themeClass} ${variantClass} ${className}`}
      style={inlineStyle}
      aria-hidden="true"
      {...rest}
    />
  );
};

export default Skeleton;
