'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  score?: number;
  wickets?: number;
  overs?: number;
}

interface LiveScoreCardProps {
  matchId: string;
  team1: Team;
  team2: Team;
  status: 'live' | 'upcoming' | 'completed';
  currentInning?: number;
  target?: number;
  result?: string;
  venue?: string;
  matchType?: string;
  className?: string;
}

export function LiveScoreCard({
  matchId,
  team1,
  team2,
  status,
  currentInning,
  target,
  result,
  venue,
  matchType,
  className,
}: LiveScoreCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800',
        'border border-gray-700/50 shadow-xl',
        className
      )}
      role="region"
      aria-label={`Live score: ${team1.name} vs ${team2.name}`}
    >
      {/* Live Indicator */}
      {status === 'live' && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <motion.span
            className="h-2 w-2 rounded-full bg-red-500"
            animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
            Live
          </span>
        </div>
      )}

      {/* Match Type Badge */}
      {matchType && (
        <div className="absolute top-4 left-4">
          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            {matchType}
          </span>
        </div>
      )}

      {/* Teams Container */}
      <div className="p-6 pt-12">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Team 1 */}
          <TeamScore team={team1} isChasing={currentInning === 2 && team1.score !== undefined} />

          {/* VS Divider */}
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-gray-500">VS</span>
            {target && currentInning === 2 && (
              <span className="mt-1 text-xs text-gray-400">
                Target: {target}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <TeamScore team={team2} isChasing={currentInning === 1 && team2.score !== undefined} align="right" />
        </div>

        {/* Result or Required Runs */}
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center text-sm font-medium text-green-400"
          >
            {result}
          </motion.div>
        ) : target && currentInning === 2 && team2.score !== undefined ? (
          <RequiredRuns target={target} currentScore={team2.score} overs={team2.overs || 0} />
        ) : null}

        {/* Venue */}
        {venue && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {venue}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamScore({ 
  team, 
  isChasing, 
  align = 'left' 
}: { 
  team: Team; 
  isChasing?: boolean;
  align?: 'left' | 'right';
}) {
  return (
    <div className={cn('flex flex-col', align === 'right' && 'items-end')}>
      {/* Team Logo & Name */}
      <div className={cn('flex items-center gap-3', align === 'right' && 'flex-row-reverse')}>
        {team.logoUrl ? (
          <img 
            src={team.logoUrl} 
            alt={team.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-600"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-sm font-bold text-white">
            {team.shortName?.slice(0, 2) || team.name.slice(0, 2)}
          </div>
        )}
        <div className={cn(align === 'right' && 'text-right')}>
          <h3 className="font-semibold text-white">{team.shortName || team.name}</h3>
          {isChasing && (
            <span className="text-xs text-yellow-400">Batting</span>
          )}
        </div>
      </div>

      {/* Score */}
      {team.score !== undefined && (
        <div className={cn('mt-3', align === 'right' && 'text-right')}>
          <span className="text-3xl font-bold text-white">
            {team.score}
            {team.wickets !== undefined && (
              <span className="text-xl text-gray-400">/{team.wickets}</span>
            )}
          </span>
          {team.overs !== undefined && (
            <span className="ml-2 text-sm text-gray-400">
              ({team.overs} ov)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function RequiredRuns({ 
  target, 
  currentScore, 
  overs 
}: { 
  target: number; 
  currentScore: number;
  overs: number;
}) {
  const required = target - currentScore;
  const oversRemaining = 20 - overs; // Assuming T20
  const requiredRate = oversRemaining > 0 ? (required / oversRemaining).toFixed(2) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-4 flex items-center justify-center gap-4 rounded-lg bg-gray-800/50 p-3"
    >
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-400">{required}</div>
        <div className="text-xs text-gray-400">Runs needed</div>
      </div>
      <div className="h-8 w-px bg-gray-700" />
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-400">{requiredRate}</div>
        <div className="text-xs text-gray-400">Req. RR</div>
      </div>
      <div className="h-8 w-px bg-gray-700" />
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{oversRemaining.toFixed(1)}</div>
        <div className="text-xs text-gray-400">Overs left</div>
      </div>
    </motion.div>
  );
}

export default LiveScoreCard;
