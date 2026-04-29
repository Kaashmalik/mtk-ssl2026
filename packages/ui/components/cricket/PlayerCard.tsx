'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn, calculateStrikeRate, calculateAverage } from '../../lib/utils';

interface PlayerStats {
  matches: number;
  runs: number;
  balls: number;
  wickets: number;
  overs: number;
  highScore: number;
  fifties: number;
  hundreds: number;
  notOuts: number;
  innings: number;
}

interface PlayerCardProps {
  id: string;
  name: string;
  photoUrl?: string;
  role: 'batsman' | 'bowler' | 'all_rounder' | 'wicket_keeper';
  teamName?: string;
  stats?: PlayerStats;
  isTopPerformer?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PlayerCard({
  id,
  name,
  photoUrl,
  role,
  teamName,
  stats,
  isTopPerformer,
  onClick,
  className,
}: PlayerCardProps) {
  const roleLabels = {
    batsman: '🏏 Batsman',
    bowler: '🎯 Bowler',
    all_rounder: '⭐ All-Rounder',
    wicket_keeper: '🧤 Wicket Keeper',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900',
        'border border-gray-700/50 p-4 shadow-lg transition-shadow hover:shadow-xl',
        isTopPerformer && 'ring-2 ring-yellow-500/50',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`Player: ${name}`}
    >
      {/* Top Performer Badge */}
      {isTopPerformer && (
        <div className="absolute -right-8 top-4 rotate-45 bg-yellow-500 px-10 py-1 text-xs font-bold text-black">
          TOP
        </div>
      )}

      {/* Player Info */}
      <div className="flex items-center gap-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-green-500/50"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-xl font-bold text-white">
            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
        
        <div>
          <h3 className="font-semibold text-white">{name}</h3>
          <p className="text-sm text-gray-400">{roleLabels[role]}</p>
          {teamName && (
            <p className="text-xs text-gray-500">{teamName}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-700/50 pt-4">
          <StatItem 
            label="Matches" 
            value={stats.matches.toString()} 
          />
          <StatItem 
            label="Runs" 
            value={stats.runs.toString()} 
          />
          <StatItem 
            label="Avg" 
            value={calculateAverage(stats.runs, stats.innings, stats.notOuts)} 
          />
          {role !== 'bowler' && (
            <>
              <StatItem 
                label="SR" 
                value={calculateStrikeRate(stats.runs, stats.balls)} 
              />
              <StatItem 
                label="50s/100s" 
                value={`${stats.fifties}/${stats.hundreds}`} 
              />
              <StatItem 
                label="HS" 
                value={`${stats.highScore}${stats.notOuts > 0 ? '*' : ''}`} 
              />
            </>
          )}
          {(role === 'bowler' || role === 'all_rounder') && (
            <>
              <StatItem 
                label="Wickets" 
                value={stats.wickets.toString()} 
              />
              <StatItem 
                label="Overs" 
                value={stats.overs.toFixed(1)} 
              />
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

export default PlayerCard;
