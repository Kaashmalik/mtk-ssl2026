'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ScoreButtonProps {
  runs: number | 'W' | 'Wd' | 'Nb' | 'B' | 'Lb';
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'boundary' | 'wicket' | 'extra';
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600',
  boundary: 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white border-green-500',
  wicket: 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-red-500',
  extra: 'bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-black border-yellow-500',
};

const sizeStyles = {
  sm: 'h-12 w-12 text-lg',
  md: 'h-16 w-16 text-2xl',
  lg: 'h-20 w-20 text-3xl',
};

export function ScoreButton({
  runs,
  onClick,
  disabled = false,
  selected = false,
  size = 'md',
  variant = 'default',
  className,
}: ScoreButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  const getVariant = (): keyof typeof variantStyles => {
    if (variant !== 'default') return variant;
    if (runs === 'W') return 'wicket';
    if (runs === 4 || runs === 6) return 'boundary';
    if (typeof runs === 'string' && ['Wd', 'Nb', 'B', 'Lb'].includes(runs)) return 'extra';
    return 'default';
  };

  const displayText = typeof runs === 'number' ? runs : runs;

  return (
    <motion.button
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center justify-center rounded-xl border-2 font-bold',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation', // Better touch handling
        sizeStyles[size],
        variantStyles[getVariant()],
        selected && 'ring-2 ring-white ring-offset-2 ring-offset-gray-900',
        className
      )}
      style={{ minWidth: '44px', minHeight: '44px' }} // WCAG touch target
      aria-label={`Score ${runs} ${typeof runs === 'number' ? 'runs' : ''}`}
      data-testid="scoring-button"
    >
      {displayText}

      {/* Boundary indicator for 4 and 6 */}
      {(runs === 4 || runs === 6) && (
        <motion.span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-green-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {runs === 6 ? '🎆' : '4️⃣'}
        </motion.span>
      )}
    </motion.button>
  );
}

interface ScoreGridProps {
  onScore: (runs: number) => void;
  onWicket: () => void;
  onExtra: (type: 'wide' | 'no_ball' | 'bye' | 'leg_bye') => void;
  disabled?: boolean;
  className?: string;
}

export function ScoreGrid({ onScore, onWicket, onExtra, disabled, className }: ScoreGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main runs */}
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((runs) => (
          <ScoreButton
            key={runs}
            runs={runs}
            onClick={() => onScore(runs)}
            disabled={disabled}
            size="lg"
          />
        ))}
      </div>

      {/* Boundaries */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreButton
          runs={4}
          onClick={() => onScore(4)}
          disabled={disabled}
          size="lg"
          variant="boundary"
        />
        <ScoreButton
          runs={6}
          onClick={() => onScore(6)}
          disabled={disabled}
          size="lg"
          variant="boundary"
        />
      </div>

      {/* Wicket */}
      <ScoreButton
        runs="W"
        onClick={onWicket}
        disabled={disabled}
        size="lg"
        variant="wicket"
        className="w-full"
      />

      {/* Extras */}
      <div className="grid grid-cols-4 gap-3">
        <ScoreButton
          runs="Wd"
          onClick={() => onExtra('wide')}
          disabled={disabled}
          size="sm"
          variant="extra"
        />
        <ScoreButton
          runs="Nb"
          onClick={() => onExtra('no_ball')}
          disabled={disabled}
          size="sm"
          variant="extra"
        />
        <ScoreButton
          runs="B"
          onClick={() => onExtra('bye')}
          disabled={disabled}
          size="sm"
          variant="extra"
        />
        <ScoreButton
          runs="Lb"
          onClick={() => onExtra('leg_bye')}
          disabled={disabled}
          size="sm"
          variant="extra"
        />
      </div>
    </div>
  );
}

export default ScoreButton;
