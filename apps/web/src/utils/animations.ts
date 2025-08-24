import { animate, createTimeline } from 'animejs';

// Animation utilities for consistent and optimized animations
export const animationUtils = {
  // Card entrance animation
  cardEntrance: (element: HTMLElement, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px) scale(0.95)';
    
    return animate(element, {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      duration: 800,
      delay,
      easing: 'easeOutExpo'
    });
  },

  // Fade in animation
  fadeIn: (element: HTMLElement, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    
    return animate(element, {
      opacity: [0, 1],
      duration: 600,
      delay,
      easing: 'easeOutQuad'
    });
  },

  // Slide in from left
  slideInLeft: (element: HTMLElement, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateX(-50px)';
    
    return animate(element, {
      opacity: [0, 1],
      translateX: [-50, 0],
      duration: 700,
      delay,
      easing: 'easeOutCubic'
    });
  },

  // Scale in animation
  scaleIn: (element: HTMLElement, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    
    return animate(element, {
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 500,
      delay,
      easing: 'easeOutBack'
    });
  },

  // Staggered animation for multiple elements
  staggerAnimation: (elements: NodeListOf<HTMLElement> | HTMLElement[], animationType: 'fadeIn' | 'slideInLeft' | 'cardEntrance' = 'fadeIn', staggerDelay = 150) => {
    elements.forEach((element, index) => {
      const delay = index * staggerDelay;
      
      switch (animationType) {
        case 'fadeIn':
          animationUtils.fadeIn(element, delay);
          break;
        case 'slideInLeft':
          animationUtils.slideInLeft(element, delay);
          break;
        case 'cardEntrance':
          animationUtils.cardEntrance(element, delay);
          break;
      }
    });
  },

  // Create animation scope
  createScope: createTimeline,

  // Loading spinner animation
  loadingSpinner: (element: HTMLElement) => {
    if (!element) return;
    
    return animate(element, {
      rotate: 360,
      duration: 1000,
      loop: true,
      easing: 'linear'
    });
  },

  // Pulse animation
  pulse: (element: HTMLElement) => {
    if (!element) return;
    
    return animate(element, {
      scale: [1, 1.05, 1],
      duration: 2000,
      loop: true,
      easing: 'easeInOutSine'
    });
  },

  // Enhanced floating animation with more sophisticated movement
  float: (element: HTMLElement, config = {}) => {
    if (!element) return;
    
    const defaults = {
      translateY: [-15, 15, -15],
      translateX: [-5, 5, -5],
      rotate: [-2, 2, -2],
      duration: 4000 + Math.random() * 2000,
      loop: true,
      easing: 'easeInOutSine',
      delay: Math.random() * 1000
    };
    
    const settings = { ...defaults, ...config };
    
    return animate(element, settings);
  },

  // Hero text animation with typewriter effect
  heroTextReveal: (element: HTMLElement, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    
    return animate(element, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 1200,
      delay,
      easing: 'easeOutExpo'
    });
  },

  // Advanced card entrance with bounce
  advancedCardEntrance: (element: HTMLElement, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(50px) scale(0.9)';
    
    return animate(element, {
      opacity: [0, 1],
      translateY: [50, -10, 0],
      scale: [0.9, 1.02, 1],
      duration: 1000,
      delay,
      easing: 'easeOutBounce'
    });
  },

  // Magnetic hover effect
  magneticHover: (element: HTMLElement) => {
    if (!element) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      animate(element, {
        translateX: x * 0.1,
        translateY: y * 0.1,
        duration: 300,
        easing: 'easeOutQuad'
      });
    };
    
    const handleMouseLeave = () => {
      animate(element, {
        translateX: 0,
        translateY: 0,
        duration: 500,
        easing: 'easeOutElastic'
      });
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  },

  // Parallax scroll effect
  parallaxScroll: (elements: HTMLElement[], speed = 0.5) => {
    if (!elements.length) return;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      elements.forEach((element, index) => {
        const rate = scrollY * speed * (index + 1) * 0.1;
        element.style.transform = `translateY(${rate}px)`;
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  },

  // Animated counter for statistics
  animatedCounter: (element: HTMLElement, targetValue: number, duration = 2000, delay = 0) => {
    if (!element) return;
    
    const startValue = 0;
    const isPercent = element.textContent?.includes('%');
    const suffix = element.textContent?.replace(/[\d.]/g, '') || '';
    
    // Simple animation without anime.js for compatibility
    let currentValue = startValue;
    const increment = (targetValue - startValue) / (duration / 16); // 60fps
    
    const updateCounter = () => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
      }
      
      const displayValue = isPercent || suffix.includes('%') 
        ? currentValue.toFixed(1) 
        : Math.round(currentValue);
      element.textContent = displayValue + suffix;
      element.style.opacity = '1';
      
      if (currentValue < targetValue) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    setTimeout(() => {
      requestAnimationFrame(updateCounter);
    }, delay);
  },

  // Stats card entrance with stagger and counter animation
  statsCardEntrance: (element: HTMLElement, delay = 0, targetValue?: number) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(40px) scale(0.9)';
    
    // Card entrance animation
    const cardAnimation = animate(element, {
      opacity: [0, 1],
      translateY: [40, 0],
      scale: [0.9, 1.02, 1],
      duration: 800,
      delay,
      easing: 'easeOutBack'
    });
    
    // Animate the number if targetValue is provided
    if (targetValue !== undefined) {
      const numberElement = element.querySelector('[data-animate-number]') as HTMLElement;
      if (numberElement) {
        setTimeout(() => {
          animationUtils.animatedCounter(numberElement, targetValue, 1500, 200);
        }, delay + 400);
      }
    }
    
    return cardAnimation;
  },

  // Glowing pulse effect for status indicators
  statusPulse: (element: HTMLElement, color = '#10b981') => {
    if (!element) return;
    
    return animate(element, {
      boxShadow: [
        `0 0 0 0 ${color}00`,
        `0 0 0 10px ${color}40`,
        `0 0 0 20px ${color}00`
      ],
      duration: 2000,
      loop: true,
      easing: 'easeInOutSine'
    });
  },

  // Progress bar fill animation
  progressFill: (element: HTMLElement, percentage: number, delay = 0) => {
    if (!element) return;
    
    element.style.width = '0%';
    
    return animate(element, {
      width: `${percentage}%`,
      duration: 1500,
      delay,
      easing: 'easeOutExpo'
    });
  },

  // Metric value update animation
  metricUpdate: (element: HTMLElement, newValue: string, isPositive = true) => {
    if (!element) return;
    
    // First animation: scale down and fade
    const firstAnimation = animate(element, {
      scale: [1, 0.8],
      opacity: [1, 0.3],
      duration: 200,
      easing: 'easeInQuad'
    });

    // Second animation: scale up and change content
    setTimeout(() => {
      element.textContent = newValue;
      element.style.color = isPositive ? '#10b981' : '#ef4444';
      animate(element, {
        scale: [0.8, 1.1, 1],
        opacity: [0.3, 1],
        duration: 400,
        easing: 'easeOutBack'
      });
    }, 200);
    
    return firstAnimation;
  }
};

// Additional simplified animations for AuthPage
export const animations = {
  // Slide in from different directions
  slideIn: (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down', duration = 800, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    
    let initialTransform = '';
    switch (direction) {
      case 'left':
        initialTransform = 'translateX(-50px)';
        break;
      case 'right':
        initialTransform = 'translateX(50px)';
        break;
      case 'up':
        initialTransform = 'translateY(30px)';
        break;
      case 'down':
        initialTransform = 'translateY(-30px)';
        break;
    }
    
    element.style.transform = initialTransform;
    
    return animate(element, {
      opacity: [0, 1],
      translateX: direction === 'left' ? [-50, 0] : direction === 'right' ? [50, 0] : 0,
      translateY: direction === 'up' ? [30, 0] : direction === 'down' ? [-30, 0] : 0,
      duration,
      delay,
      easing: 'easeOutExpo'
    });
  },

  // Floating animation for background decorations
  floating: (element: HTMLElement, duration = 4000, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    
    // First fade in
    animate(element, {
      opacity: [0, 0.6],
      duration: 1000,
      delay,
      easing: 'easeOutQuad'
    });
    
    // Then start floating
    setTimeout(() => {
      animate(element, {
        translateY: [-20, 20, -20],
        translateX: [-10, 10, -10],
        duration: duration + Math.random() * 2000,
        loop: true,
        easing: 'easeInOutSine'
      });
    }, delay + 1000);
  },

  // Enhanced fadeIn with custom options
  fadeIn: (element: HTMLElement, duration = 600, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    
    return animate(element, {
      opacity: [0, 1],
      duration,
      delay,
      easing: 'easeOutQuad'
    });
  },

  // Scale in with bounce
  scaleIn: (element: HTMLElement, duration = 600, delay = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    
    return animate(element, {
      opacity: [0, 1],
      scale: [0.8, 1.05, 1],
      duration,
      delay,
      easing: 'easeOutBack'
    });
  }
};

export default animationUtils;