'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface AnimatedTextProps {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  isVisible?: boolean;
}

export const AnimatedText = memo(function AnimatedText({
  children,
  className,
  delay = 0,
  stagger = 0.05,
  isVisible = true,
}: AnimatedTextProps) {
  const words = children.split(' ');

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          variants={{
            hidden: {
              opacity: 0,
              filter: 'blur(10px)',
              x: -20,
            },
            visible: {
              opacity: 1,
              filter: 'blur(0px)',
              x: 0,
              transition: { duration: 0.8, ease: "easeOut" },
            },
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
});
