/**
 * Modern Animations System per AgriAI
 * Sistema completo di animazioni moderne con microinterazioni e page transitions
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// === ANIMATION VARIANTS ===
export const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

export const slideInVariants: Variants = {
  hidden: { x: -100, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: { 
    x: 100, 
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

export const scaleInVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "backOut"
    }
  },
  exit: { 
    scale: 0.9, 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const cardHoverVariants: Variants = {
  initial: { 
    y: 0, 
    scale: 1,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
  },
  hover: { 
    y: -8, 
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

export const buttonPressVariants: Variants = {
  initial: { scale: 1 },
  press: { 
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  },
  release: { 
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

export const pageTransitionVariants: Variants = {
  initial: { 
    opacity: 0,
    x: 20
  },
  animate: { 
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// === ANIMATION COMPONENTS ===

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  initial?: string;
  animate?: string;
  exit?: string;
  delay?: number;
  duration?: number;
  stagger?: boolean;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  className,
  variants = fadeInVariants,
  initial = "hidden",
  animate = "visible",
  exit = "exit",
  delay = 0,
  duration,
  stagger = false,
}) => {
  const containerVariants = stagger ? staggerContainerVariants : variants;
  
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={{
        delay,
        duration,
      }}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  press?: boolean;
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  hover = true,
  press = true,
  delay = 0,
}) => {
  return (
    <motion.div
      className={className}
      variants={cardHoverVariants}
      initial="initial"
      whileHover={hover ? "hover" : undefined}
      whileTap={press ? "tap" : undefined}
      transition={{
        delay,
        duration: 0.3,
      }}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  delay?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  onClick,
  disabled = false,
  loading = false,
  delay = 0,
}) => {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      variants={buttonPressVariants}
      initial="initial"
      whileTap="press"
      transition={{
        delay,
        duration: 0.2,
      }}
    >
      {children}
    </motion.button>
  );
};

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => {
  return (
    <motion.div
      className={className}
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

// === LOADING ANIMATIONS ===

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    muted: 'border-muted-foreground',
  };

  return (
    <motion.div
      className={cn(
        'border-2 border-t-transparent rounded-full',
        sizeClasses[size],
        colorClasses[color as keyof typeof colorClasses],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

interface LoadingDotsProps {
  count?: number;
  delay?: number;
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  count = 3,
  delay = 0.2,
  className,
}) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// === MICROINTERACTIONS ===

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  className,
  color = 'rgba(255, 255, 255, 0.3)',
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (event: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: color,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  className,
  speed = 0.5,
}) => {
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * speed;
        setOffset(rate);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <motion.div
        style={{ y: offset }}
        transition={{ duration: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// === UTILITY HOOKS ===

export const useScrollAnimation = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isInView };
};

export const useHoverAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
};

// === EXPORT ALL ===
export {
  fadeInVariants,
  slideInVariants,
  scaleInVariants,
  staggerContainerVariants,
  cardHoverVariants,
  buttonPressVariants,
  pageTransitionVariants,
}; 