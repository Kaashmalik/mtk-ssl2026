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
  isExtra: boolean;
  extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye';
  batsmanName: string;
  bowlerName: string;
  commentary?: string;
}

interface BallByBallProps {
  events: BallEvent[];
  currentOver: number;
  className?: string;
}

export function BallByBall({ events, currentOver, className }: BallByBallProps) {
  const shouldReduceMotion = useReducedMotion();
  
  // Group events by over
  const overEvents = events.filter(e => e.over === currentOver);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Over */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Over {currentOver}
        </h3>
        <div className="text-sm text-gray-400">
          {overEvents.length} balls
        </div>
      </div>

      {/* Ball Circles */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {overEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={shouldReduceMotion ? {} : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 500, 
                damping: 25,
                delay: index * 0.05
              }}
            >
              <BallCircle event={event} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty slots for remaining balls */}
        {Array.from({ length: Math.max(0, 6 - overEvents.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-gray-700"
          />
        ))}
      </div>

      {/* Latest Commentary */}
      {overEvents.length > 0 && overEvents[overEvents.length - 1].commentary && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-gray-800/50 p-3 text-sm text-gray-300"
        >
          <span className="font-medium text-green-400">
            {currentOver}.{overEvents[overEvents.length - 1].ball}
          </span>
          {' '}
          {overEvents[overEvents.length - 1].commentary}
        </motion.div>
      )}
    </div>
  );
}

function BallCircle({ event }: { event: BallEvent }) {
  const getStyles = () => {
    if (event.isWicket) {
      return 'bg-red-500 text-white border-red-400';
    }
    if (event.runs === 6) {
      return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-400';
    }
    if (event.runs === 4) {
      return 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400';
    }
    if (event.isExtra) {
      return 'bg-yellow-500 text-black border-yellow-400';
    }
    if (event.runs === 0) {
      return 'bg-gray-700 text-gray-300 border-gray-600';
    }
    return 'bg-blue-500 text-white border-blue-400';
  };

  const getLabel = () => {
    if (event.isWicket) return 'W';
    if (event.isExtra) {
      const extraRuns = event.runs > 0 ? event.runs : 1;
      return `${extraRuns}${event.extraType?.[0].toUpperCase() || 'E'}`;
    }
    return event.runs.toString();
  };

  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold',
        'transition-transform hover:scale-110',
        getStyles()
      )}
      title={`${event.batsmanName} - ${event.runs} runs`}
    >
      {getLabel()}
    </div>
  );
}

interface OverSummaryProps {
  overs: {
    number: number;
    runs: number;
    wickets: number;
    balls: BallEvent[];
  }[];
  className?: string;
}

export function OverSummary({ overs, className }: OverSummaryProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium text-gray-400">Over Summary</h4>
      <div className="flex flex-wrap gap-2">
        {overs.map((over) => (
          <div
            key={over.number}
            className="flex flex-col items-center rounded-lg bg-gray-800/50 p-2"
          >
            <span className="text-xs text-gray-400">Ov {over.number}</span>
            <span className="text-lg font-bold text-white">{over.runs}</span>
            {over.wickets > 0 && (
              <span className="text-xs text-red-400">{over.wickets}W</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BallByBall;
