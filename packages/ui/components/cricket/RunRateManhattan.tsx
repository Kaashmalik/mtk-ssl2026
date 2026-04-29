'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface OverData {
  over: number;
  runs: number;
  wickets: number;
  team: string;
  teamColor: string;
}

interface RunRateManhattanProps {
  overs: OverData[];
  targetOver?: number;
  currentRunRate?: number;
  requiredRunRate?: number;
  className?: string;
}

/**
 * Manhattan Run Rate Chart - Shows runs per over as vertical bars.
 * Green bars = scoring overs, Red bars = low-scoring overs.
 * Star/W mark indicates wickets fallen in that over.
 */
export function RunRateManhattan({
  overs,
  targetOver,
  currentRunRate,
  requiredRunRate,
  className,
}: RunRateManhattanProps) {
  const shouldReduceMotion = useReducedMotion();

  const maxRuns = useMemo(() => Math.max(...overs.map((o) => o.runs), 6), [overs]);
  const teams = useMemo(() => Array.from(new Map(overs.map((o) => [o.team, o.teamColor])).entries()), [overs]);

  const barHeight = (runs: number) => (runs / maxRuns) * 100;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-xl',
        className,
      )}
      role="img"
      aria-label="Runs per over Manhattan chart"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Manhattan Chart
        </h3>
        <div className="flex items-center gap-4">
          {teams.map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rate indicators */}
      {(currentRunRate !== undefined || requiredRunRate !== undefined) && (
        <div className="mb-3 flex gap-4 text-xs">
          {currentRunRate !== undefined && (
            <span className="text-green-400">
              CRR: {currentRunRate.toFixed(2)}
            </span>
          )}
          {requiredRunRate !== undefined && (
            <span className="text-amber-400">
              RRR: {requiredRunRate.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="relative h-48">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <div
            key={pct}
            className="absolute left-0 right-0 border-t border-gray-700/30"
            style={{ top: `${100 - pct}%` }}
          >
            <span className="absolute -top-2 right-0 text-[10px] text-gray-600">
              {Math.round((pct / 100) * maxRuns)}
            </span>
          </div>
        ))}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-0.5 overflow-x-auto px-2 pt-6">
          {overs.map((over, index) => {
            const height = barHeight(over.runs);
            const isBoundaryOver = over.runs >= 15;
            const isMaiden = over.runs === 0;

            return (
              <div key={index} className="flex flex-1 flex-col items-center gap-0.5">
                <div className="relative w-full">
                  {/* Wicket indicator */}
                  {over.wickets > 0 && (
                    <motion.div
                      initial={shouldReduceMotion ? {} : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-xs font-bold text-red-400"
                    >
                      {over.wickets > 1 ? `${over.wickets}W` : 'W'}
                    </motion.div>
                  )}
                  {/* Bar */}
                  <motion.div
                    initial={shouldReduceMotion ? {} : { height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.4, delay: index * 0.02, ease: 'easeOut' }}
                    className={cn(
                      'w-full min-w-[8px] rounded-t-sm',
                      isBoundaryOver && 'bg-gradient-to-t from-green-600 to-green-400',
                      isMaiden && 'bg-red-600/60',
                      !isBoundaryOver && !isMaiden && 'bg-gray-600',
                    )}
                    style={!isBoundaryOver && !isMaiden ? { backgroundColor: over.teamColor + '80' } : undefined}
                  />
                </div>
                {/* Over number */}
                <span className="text-[9px] text-gray-600">{over.over}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target line */}
      {targetOver !== undefined && (
        <div
          className="absolute bottom-8 left-6 right-6 border-t-2 border-dashed border-amber-500/50"
          style={{ top: `${100 - barHeight(Math.round(currentRunRate || 6))}%` }}
        >
          <span className="absolute -top-4 right-0 text-[10px] text-amber-400">Target Par</span>
        </div>
      )}
    </div>
  );
}

export default RunRateManhattan;
