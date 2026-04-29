'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface MatchCardProps {
  id: string;
  team1: { name: string; shortName: string; logoUrl?: string };
  team2: { name: string; shortName: string; logoUrl?: string };
  venue: string;
  scheduledDate: string;
  status: 'scheduled' | 'live' | 'completed';
  format: string;
  onClick?: () => void;
  className?: string;
}

export function MatchCard({
  id,
  team1,
  team2,
  venue,
  scheduledDate,
  status,
  format,
  onClick,
  className,
}: MatchCardProps) {
  const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-xl bg-gradient-to-br from-gray-800 to-gray-900',
        'border border-gray-700/50 p-4 shadow-lg transition-shadow hover:shadow-xl',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`Match: ${team1.name} vs ${team2.name}`}
    >
      {/* Status Badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-gray-700/50 px-2 py-0.5 text-xs text-gray-400">
          {format}
        </span>
        <StatusBadge status={status} />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between">
        <TeamDisplay team={team1} />
        <span className="text-lg font-bold text-gray-500">VS</span>
        <TeamDisplay team={team2} align="right" />
      </div>

      {/* Match Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {venue}
        </div>
        <div className="flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formattedDate}
        </div>
      </div>
    </motion.div>
  );
}

function TeamDisplay({ 
  team, 
  align = 'left' 
}: { 
  team: { name: string; shortName: string; logoUrl?: string };
  align?: 'left' | 'right';
}) {
  return (
    <div className={cn('flex items-center gap-2', align === 'right' && 'flex-row-reverse')}>
      {team.logoUrl ? (
        <img 
          src={team.logoUrl} 
          alt={team.name}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
          {team.shortName.slice(0, 2)}
        </div>
      )}
      <span className="font-medium text-white">{team.shortName}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: 'scheduled' | 'live' | 'completed' }) {
  const styles = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    live: 'bg-red-500/20 text-red-400',
    completed: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', styles[status])}>
      {status === 'live' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default MatchCard;
