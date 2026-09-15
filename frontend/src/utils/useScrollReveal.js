import { useState, useEffect, useRef } from 'react';

/**
 * Lightweight hook to trigger a smooth once-per-section scroll reveal.
 * Respects prefers-reduced-motion and provides an immediate fallback when IntersectionObserver is not available.
 */
export const useScrollReveal = (options = {}) => {
  const { threshold = 0.08, rootMargin = '0px 0px -30px 0px' } = options;
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Respect user's prefers-reduced-motion preference immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    // Fallback if IntersectionObserver is unsupported
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element); // Reveal once only
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin]);

  return [ref, isVisible];
};

export default useScrollReveal;
