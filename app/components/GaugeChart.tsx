'use client';

import { useEffect, useId } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

interface GaugeChartProps {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  format?: (value: number) => string;
}

const SIZES = {
  sm: { px: 80, stroke: 6, fontSize: 14, labelSize: 8, iconSize: 12 },
  md: { px: 120, stroke: 8, fontSize: 20, labelSize: 10, iconSize: 16 },
  lg: { px: 160, stroke: 10, fontSize: 28, labelSize: 12, iconSize: 20 },
};

const COLOR_MAP: Record<string, { start: string; end: string; glow: string }> = {
  'accent-cyan': { start: '#00d4ff', end: '#0088aa', glow: 'rgba(0,212,255,0.4)' },
  'accent-green': { start: '#00e676', end: '#009944', glow: 'rgba(0,230,118,0.4)' },
  'accent-purple': { start: '#7b61ff', end: '#4c3daa', glow: 'rgba(123,97,255,0.4)' },
  'accent-orange': { start: '#ff8800', end: '#cc6600', glow: 'rgba(255,136,0,0.4)' },
  'accent-red': { start: '#ff4466', end: '#cc2244', glow: 'rgba(255,68,102,0.4)' },
};

export function GaugeChart({
  value,
  max = 100,
  label,
  sublabel,
  color = 'accent-cyan',
  size = 'md',
  icon,
  format,
}: GaugeChartProps) {
  const id = useId();
  const config = SIZES[size];
  const colors = COLOR_MAP[color] || COLOR_MAP['accent-cyan'];
  
  const radius = (config.px - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const dashOffset = circumference - (percentage / 100) * circumference;

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 20 });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  const center = config.px / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: config.px, height: config.px }}>
        <svg
          width={config.px}
          height={config.px}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={`gauge-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} stopOpacity="0.3" />
            </linearGradient>
            <filter id={`gauge-glow-${id}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(42,53,72,0.5)"
            strokeWidth={config.stroke}
          />

          {/* Filled arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#gauge-grad-${id})`}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            filter={`url(#gauge-glow-${id})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <span style={{ fontSize: config.iconSize }}>{icon}</span>}
          <GaugeNumber
            spring={spring}
            format={format}
            fontSize={config.fontSize}
            color={colors.start}
          />
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</div>
        {sublabel && <div className="text-[10px] text-gray-600">{sublabel}</div>}
      </div>
    </div>
  );
}

function GaugeNumber({
  spring,
  format,
  fontSize,
  color,
}: {
  spring: any;
  format?: (value: number) => string;
  fontSize: number;
  color: string;
}) {
  const displayValue = useTransform(spring, (v: number) => {
    if (format) return format(v);
    return v < 10 ? v.toFixed(1) : Math.round(v).toString();
  });

  return (
    <motion.span
      className="font-mono font-bold"
      style={{ fontSize, color }}
    >
      {displayValue}
    </motion.span>
  );
}
