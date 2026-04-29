'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BallEvent {
  id: string;
  over: number;
  ball: number;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  isWide: boolean;
  isNoBall: boolean;
  isFour: boolean;
  isSix: boolean;
  batsmanName: string;
  bowlerName: string;
  timestamp: string;
}

interface BallTimelineProps {
  events: BallEvent[];
  highlightLast?: number;
  className?: string;
}

function getBallBadge(event: BallEvent): { text: string; className: string; icon?: string } {
  if (event.isWicket) return { text: 'W', className: 'bg-red-600 text-white ring-2 ring-red-400', icon: '' };
  if (event.isSix) return { text: '6', className: 'bg-amber-500 text-white ring-2 ring-amber-300', icon: '' };
  if (event.isFour) return { text: '4', className: 'bg-green-600 text-white ring-2 ring-green-400', icon: '' };
  if (event.isWide || event.isNoBall) return { text: `${event.runs}${event.isWide ? 'wd' : 'nb'}`, className: 'bg-yellow-600/80 text-white' };
  if (event.runs === 0) return { text: '0', className: 'bg-gray-700 text-gray-400' };
  return { text: String(event.runs), className: 'bg-gray-700 text-white' };
}

export function BallTimeline({ events, highlightLast = 6, className }: BallTimelineProps) {
  const shouldReduceMotion = useReducedMotion();
  const sorted = [...events].sort((a, b) => a.over * 100 + a.ball - (b.over * 100 + b.ball));
  const reversed = [...sorted].reverse();

  return (
    <div className={cn('rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900 to-gray-800 p-4 shadow-xl', className)} role="log" aria-live="polite" aria-label="Ball by ball timeline">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Ball-by-Ball</h3>
        <span className="text-xs text-gray-500">{events.length} balls</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {reversed.map((event, idx) => {
            const badge = getBallBadge(event);
            const isHighlight = idx < highlightLast;
            return (
              <motion.div
                key={event.id}
                layout
                initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  isHighlight ? 'bg-gray-800/80' : 'bg-transparent',
                )}
              >
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', badge.className)}>
                  {badge.text}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-white">{event.batsmanName}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-gray-400">{event.bowlerName}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Over {event.over}.{event.ball}
                    {event.isWicket && event.wicketType && (
                      <span className="ml-1 text-red-400">- {event.wicketType}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs tabular-nums text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default BallTimeline;
