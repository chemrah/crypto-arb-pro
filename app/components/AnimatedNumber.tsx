'use client';

import { useEffect, useRef } from 'react';
import { useSpring, useTransform, motion, useMotionValue } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  colorBySign?: boolean;
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  duration = 800,
  className = '',
  colorBySign = false,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    duration: duration / 1000,
  });
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (displayRef.current) {
        const num = parseFloat(latest.toFixed(decimals));
        displayRef.current.textContent = `${prefix}${num.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}${suffix}`;
      }
    });
    return unsubscribe;
  }, [springValue, prefix, suffix, decimals]);

  const colorClass = colorBySign
    ? value > 0
      ? 'text-accent-green'
      : value < 0
      ? 'text-accent-red'
      : 'text-gray-400'
    : '';

  return (
    <motion.span
      ref={displayRef}
      className={`font-mono tabular-nums ${colorClass} ${className}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}0{suffix}
    </motion.span>
  );
}
