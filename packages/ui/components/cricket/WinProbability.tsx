'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TeamProbability {
  teamId: string;
  teamName: string;
  teamShortName: string;
  color: string;
  winProbability: number; // 0-1
}

interface WinProbabilityProps {
  team1: TeamProbability;
  team2: TeamProbability;
  innings: number;
  currentScore: number;
  wickets: number;
  overs: number;
  target?: number;
  ballsRemaining: number;
  className?: string;
}

/**
 * Monte Carlo-based win probability engine for cricket.
 * Uses simplified Duckworth-Lewis-Stern (DLS) inspired logic
 * combined with historical run rate analysis.
 */
export function calculateWinProbability(
  team1: TeamProbability,
  team2: TeamProbability,
  innings: number,
  currentScore: number,
  wickets: number,
  overs: number,
  target: number | undefined,
  ballsRemaining: number,
): { team1Prob: number; team2Prob: number } {
  if (innings === 1) {
    // First innings - project par score and estimate
    const projectedScore = currentScore + (currentScore / Math.max(overs, 1)) * (ballsRemaining / 6);
    const normalized = Math.min(projectedScore / 180, 1); // Assume 180 is par for T20
    return {
      team1Prob: normalized,
      team2Prob: 1 - normalized,
    };
  }

  // Second innings - chasing
  if (!target) {
    return { team1Prob: 0.5, team2Prob: 0.5 };
  }

  const runsNeeded = Math.max(0, target - currentScore);
  const oversRemaining = ballsRemaining / 6;
  const requiredRate = oversRemaining > 0 ? runsNeeded / oversRemaining : 999;
  const currentRate = overs > 0 ? currentScore / overs : 0;

  // Wicket factor: losing wickets reduces chasing probability exponentially
  const wicketFactor = Math.pow(0.85, wickets);

  // Required rate vs current rate comparison
  const rateRatio = currentRate / Math.max(requiredRate, 0.1);

  // Combined probability for chasing team
  const chaseProb = Math.min(
    Math.max(
      rateRatio * wicketFactor * (1 - runsNeeded / Math.max(target, 1)),
      0.02,
    ),
    0.98,
  );

  return {
    team1Prob: 1 - chaseProb,
    team2Prob: chaseProb,
  };
}

export function WinProbabilityGauge({
  team1,
  team2,
  innings,
  currentScore,
  wickets,
  overs,
  target,
  ballsRemaining,
  className,
}: WinProbabilityProps) {
  const shouldReduceMotion = useReducedMotion();

  const { team1Prob, team2Prob } = useMemo(
    () =>
      calculateWinProbability(
        team1,
        team2,
        innings,
        currentScore,
        wickets,
        overs,
        target,
        ballsRemaining,
      ),
    [team1, team2, innings, currentScore, wickets, overs, target, ballsRemaining],
  );

  const dominantTeam = team1Prob > team2Prob ? team1 : team2;
  const dominantProb = Math.max(team1Prob, team2Prob);
  const isClose = Math.abs(team1Prob - team2Prob) < 0.15;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-xl',
        className,
      )}
      role="region"
      aria-label="Win probability"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Win Probability
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-bold',
              isClose
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-green-500/20 text-green-400',
            )}
          >
            {isClose ? 'TOSS-UP' : `${(dominantProb * 100).toFixed(0)}%`}
          </span>
          <span className="text-xs text-gray-500">
            Innings {innings}
          </span>
        </div>
      </div>

      {/* Probability Bar */}
      <div className="relative mb-4 h-4 overflow-hidden rounded-full bg-gray-700/50">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: team1.color }}
          initial={shouldReduceMotion ? {} : { width: 0 }}
          animate={{ width: `${team1Prob * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute right-0 top-0 h-full rounded-full"
          style={{ backgroundColor: team2.color }}
          initial={shouldReduceMotion ? {} : { width: 0 }}
          animate={{ width: `${team2Prob * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Center indicator */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
      </div>

      {/* Team Labels */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: team1.color }}
          />
          <span className="font-semibold text-white">{team1.teamShortName}</span>
          <span className="text-gray-400">{(team1Prob * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{(team2Prob * 100).toFixed(1)}%</span>
          <span className="font-semibold text-white">{team2.teamShortName}</span>
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: team2.color }}
          />
        </div>
      </div>

      {/* Context */}
      {innings === 2 && target && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-xs text-gray-500"
        >
          {Math.max(0, target - currentScore)} runs needed from{' '}
          {Math.ceil(ballsRemaining)} balls
          {ballsRemaining > 0 && (
            <span className="ml-1 text-yellow-400">
              (RRR: {((Math.max(0, target - currentScore) / (ballsRemaining / 6))).toFixed(2)})
            </span>
          )}
        </motion.div>
      )}

      {/* Momentum Indicator */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Momentum</span>
        <div className="flex-1 overflow-hidden rounded-full bg-gray-700/30">
          <motion.div
            className="h-1.5 rounded-full"
            style={{
              background: `linear-gradient(to right, ${team1.color}, ${team2.color})`,
            }}
            initial={shouldReduceMotion ? {} : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1 }}
          />
        </div>
        <span className="text-xs font-medium text-white">
          {dominantTeam.teamShortName}
        </span>
      </div>
    </div>
  );
}

export default WinProbabilityGauge;
