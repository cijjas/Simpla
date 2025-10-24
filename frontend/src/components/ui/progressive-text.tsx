'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ProgressiveTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  direction?: 'left-to-right' | 'right-to-left';
}

export function ProgressiveText({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  stagger = 0.1,
  direction = 'left-to-right'
}: ProgressiveTextProps) {
  // Split text into words for word-by-word animation
  const text = typeof children === 'string' ? children : '';
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      filter: 'blur(10px)',
      x: direction === 'left-to-right' ? -20 : 20,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      x: 0,
      transition: {
        duration,
        ease: 'easeOut',
      },
    },
  };

  // If children is not a string, render as a single animated element
  if (typeof children !== 'string') {
    return (
      <motion.div
        className={className}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div variants={wordVariants}>
          {children}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}


