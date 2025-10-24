'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface NumberTickerProps {
  value: string;
  duration?: number;
  className?: string;
}

export function NumberTicker({ value, duration = 2, className = '' }: NumberTickerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState(value);

  // Extract numeric value and suffix/prefix
  const parseValue = (val: string) => {
    const match = val.match(/^([0-9,]+)([K%x+]*)$/);
    if (!match) return { number: 0, suffix: '' };
    
    let number = parseInt(match[1].replace(/,/g, ''), 10);
    const suffix = match[2] || '';
    
    // Handle K suffix (multiply by 1000)
    if (suffix.includes('K')) {
      number = number * 1000;
    }
    
    return { number, suffix };
  };

  const { number: targetNumber, suffix } = parseValue(value);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentNumber = Math.floor(targetNumber * easeOutCubic);

      // Format number with commas if it's large enough
      let formattedNumber = currentNumber.toLocaleString();
      
      // Handle K suffix display
      if (suffix.includes('K')) {
        const kValue = Math.floor(currentNumber / 1000);
        formattedNumber = kValue.toString();
      }
      
      setDisplayValue(`${formattedNumber}${suffix}`);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInView, targetNumber, suffix, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {displayValue}
    </motion.span>
  );
}
