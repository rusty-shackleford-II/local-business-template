import React, { useRef, useEffect, useState } from 'react';

type AnimationVariant = 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right';

type Props = {
  children: React.ReactNode;
  /** Animation variant. Default: 'fade-up' */
  variant?: AnimationVariant;
  /** Delay in ms before the animation starts once visible. Default: 0 */
  delay?: number;
  /** How much of the element must be visible to trigger (0-1). Default: 0.15 */
  threshold?: number;
  /** Extra CSS class names on the wrapper */
  className?: string;
  /** Whether to disable the animation (e.g. in edit mode) */
  disabled?: boolean;
};

const ScrollReveal: React.FC<Props> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  threshold = 0.15,
  className = '',
  disabled = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (disabled) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [disabled, threshold]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={ref}
      className={`scroll-reveal scroll-reveal--${variant} ${isVisible ? 'scroll-reveal--visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
