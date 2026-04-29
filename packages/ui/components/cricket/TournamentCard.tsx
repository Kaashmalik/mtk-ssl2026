'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TournamentCardProps {
  id: string;
  name: string;
  format: 'knockout' | 'league' | 'hybrid' | 'round_robin';
  status: 'draft' | 'registration' | 'live' | 'completed';
  startDate: string;
  endDate: string;
  teamsCount: number;
  maxTeams: number;
  matchesPlayed?: number;
  totalMatches?: number;
  bannerUrl?: string;
  entryFee?: number;
  prizePool?: number;
  onClick?: () => void;
  className?: string;
}

export function TournamentCard({
  id,
  name,
  format,
  status,
  startDate,
  endDate,
  teamsCount,
  maxTeams,
  matchesPlayed,
  totalMatches,
  bannerUrl,
  entryFee,
  prizePool,
  onClick,
  className,
}: TournamentCardProps) {
  const formatLabels = {
    knockout: 'Knockout',
    league: 'League',
    hybrid: 'Hybrid',
    round_robin: 'Round Robin',
  };

  const statusStyles = {
    draft: 'bg-gray-500/20 text-gray-400',
    registration: 'bg-blue-500/20 text-blue-400',
    live: 'bg-red-500/20 text-red-400',
    completed: 'bg-green-500/20 text-green-400',
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={onClick}
      className={cn(
        'group cursor-pointer overflow-hidden rounded-xl bg-gray-900',
        'border border-gray-700/50 shadow-lg transition-all hover:shadow-xl',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`Tournament: ${name}`}
    >
      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-green-600 to-green-800" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute right-3 top-3">
          <span className={cn('rounded-full px-2 py-1 text-xs font-medium', statusStyles[status])}>
            {status === 'live' && (
              <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
            )}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {/* Format Badge */}
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white">
            {formatLabels[format]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white line-clamp-1">{name}</h3>
        
        {/* Dates */}
        <p className="mt-1 text-sm text-gray-400">
          {formatDate(startDate)} - {formatDate(endDate)}
        </p>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Teams</span>
            <span className="font-medium text-white">{teamsCount}/{maxTeams}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
              initial={{ width: 0 }}
              animate={{ width: `${(teamsCount / maxTeams) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Matches Progress (if live) */}
        {matchesPlayed !== undefined && totalMatches !== undefined && status === 'live' && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Matches</span>
              <span className="font-medium text-white">{matchesPlayed}/{totalMatches}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: `${(matchesPlayed / totalMatches) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Entry Fee & Prize */}
        {(entryFee !== undefined || prizePool !== undefined) && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-700/50 pt-4">
            {entryFee !== undefined && (
              <div>
                <span className="text-xs text-gray-400">Entry Fee</span>
                <p className="font-bold text-white">PKR {entryFee.toLocaleString()}</p>
              </div>
            )}
            {prizePool !== undefined && (
              <div className="text-right">
                <span className="text-xs text-gray-400">Prize Pool</span>
                <p className="font-bold text-green-400">PKR {prizePool.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default TournamentCard;
