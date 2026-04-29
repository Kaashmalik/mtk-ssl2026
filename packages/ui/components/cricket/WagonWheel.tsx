'use client';

import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Shot {
  id: string;
  runs: number;
  angle: number;
  distance: number;
  batsmanName: string;
  over: number;
  ball: number;
  isFour: boolean;
  isSix: boolean;
  isWicket: boolean;
}

interface WagonWheelProps {
  shots: Shot[];
  batsmanFilter?: string;
  showFilter?: boolean;
  className?: string;
}

export function WagonWheel({ shots, batsmanFilter, showFilter = true, className }: WagonWheelProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState<'all' | '4' | '6' | 'wicket'>('all');
  const [hoveredShot, setHoveredShot] = useState<Shot | null>(null);

  const filteredShots = useMemo(() => {
    let result = batsmanFilter ? shots.filter((s) => s.batsmanName === batsmanFilter) : shots;
    if (activeFilter === '4') result = result.filter((s) => s.isFour);
    if (activeFilter === '6') result = result.filter((s) => s.isSix);
    if (activeFilter === 'wicket') result = result.filter((s) => s.isWicket);
    return result;
  }, [shots, batsmanFilter, activeFilter]);

  const cx = 200, cy = 200, maxR = 180;

  const polarToCartesian = (angle: number, distance: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    const r = (distance / 100) * maxR;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900 to-gray-800 p-4 shadow-xl', className)} role="img" aria-label="Wagon wheel shot placement">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Wagon Wheel</h3>
        {showFilter && (
          <div className="flex gap-1">
            {(['all', '4', '6', 'wicket'] as const).map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={cn('rounded-full px-2 py-0.5 text-xs font-medium transition-colors', activeFilter === f ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500 hover:bg-gray-700')}
                aria-pressed={activeFilter === f}>
                {f === 'all' ? 'All' : f === '4' ? '4s' : f === '6' ? '6s' : 'W'}
              </button>
            ))}
          </div>
        )}
      </div>

      <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-sm" aria-hidden="true">
        <defs><radialGradient id="fieldGradient" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#166534"/><stop offset="40%" stopColor="#15803d"/><stop offset="70%" stopColor="#166534"/><stop offset="100%" stopColor="#14532d"/></radialGradient></defs>
        <circle cx={cx} cy={cy} r={maxR} fill="url(#fieldGradient)" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.3" />
        <circle cx={cx} cy={cy} r={maxR * 0.85} fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.2" />
        <circle cx={cx} cy={cy} r={maxR * 0.5} fill="none" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.15" />
        <rect x={cx - 8} y={cy - 25} width="16" height="50" rx="2" fill="#854d0e" opacity="0.8" />
        {['Third Man','Point','Cover','Mid Off','Straight','Mid On','Mid Wicket','Square Leg','Fine Leg'].map((name, i) => {
          const a = (i * 45 + 22.5) % 360;
          const p = polarToCartesian(a, 95);
          return <text key={name} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" fontSize="8" opacity="0.6">{name}</text>;
        })}
        {[0,45,90,135,180,225,270,315].map((a) => {
          const e = polarToCartesian(a, 100);
          return <line key={a} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="#22c55e" strokeWidth="0.5" strokeOpacity="0.1" />;
        })}
        {filteredShots.map((shot, i) => {
          const pos = polarToCartesian(shot.angle, shot.distance);
          const size = shot.isSix ? 8 : shot.isFour ? 6 : 4;
          const color = shot.isWicket ? '#ef4444' : shot.isSix ? '#f59e0b' : shot.isFour ? '#22c55e' : '#9ca3af';
          return (
            <motion.g key={shot.id} initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, duration: 0.3 }}
              onMouseEnter={() => setHoveredShot(shot)} onMouseLeave={() => setHoveredShot(null)} style={{ cursor: 'pointer' }}>
              <line x1={cx} y1={cy} x2={pos.x} y2={pos.y} stroke={color} strokeWidth="1" strokeOpacity="0.4" />
              <circle cx={pos.x} cy={pos.y} r={size} fill={color} opacity="0.8" />
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={size > 5 ? '6' : '5'} fontWeight="bold">{shot.isWicket ? 'W' : shot.runs}</text>
            </motion.g>
          );
        })}
      </svg>

      {hoveredShot && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-4 left-4 right-4 rounded-lg bg-gray-800/95 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between"><span className="font-semibold text-white">{hoveredShot.batsmanName}</span><span className="text-xs text-gray-400">Over {hoveredShot.over}.{hoveredShot.ball}</span></div>
          <div className="mt-1 text-sm text-gray-300">{hoveredShot.isWicket ? 'WICKET!' : `${hoveredShot.runs} run${hoveredShot.runs !== 1 ? 's' : ''}`}{hoveredShot.isFour && ' - FOUR!'}{hoveredShot.isSix && ' - SIX!'}</div>
        </motion.div>
      )}

      <div className="mt-4 flex items-center justify-around text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /><span>4s: {shots.filter((s) => s.isFour).length}</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" /><span>6s: {shots.filter((s) => s.isSix).length}</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500" /><span>W: {shots.filter((s) => s.isWicket).length}</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-500" /><span>Total: {shots.length}</span></div>
      </div>
    </div>
  );
}

export default WagonWheel;
