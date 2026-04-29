import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and merges Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number with commas for display
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Calculates strike rate (runs per 100 balls)
 */
export function calculateStrikeRate(runs: number, balls: number): string {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
}

/**
 * Calculates economy rate (runs per over)
 */
export function calculateEconomyRate(runs: number, overs: number): string {
  if (overs === 0) return '0.00';
  return (runs / overs).toFixed(2);
}

/**
 * Calculates batting average
 */
export function calculateAverage(runs: number, innings: number, notOuts: number): string {
  const dismissals = innings - notOuts;
  if (dismissals === 0) return runs > 0 ? 'N/A' : '0.00';
  return (runs / dismissals).toFixed(2);
}

/**
 * Formats overs in cricket notation (e.g., 4.3 means 4 overs and 3 balls)
 */
export function formatOvers(overs: number): string {
  const completeOvers = Math.floor(overs);
  const balls = Math.round((overs - completeOvers) * 10);
  
  if (balls === 6) {
    return `${completeOvers + 1}.0`;
  }
  
  return `${completeOvers}.${balls}`;
}

/**
 * Calculates run rate
 */
export function calculateRunRate(runs: number, overs: number): string {
  if (overs === 0) return '0.00';
  return (runs / overs).toFixed(2);
}

/**
 * Calculates required run rate
 */
export function calculateRequiredRunRate(
  target: number,
  currentScore: number,
  oversRemaining: number
): string {
  if (oversRemaining <= 0) return 'N/A';
  const runsNeeded = target - currentScore;
  return (runsNeeded / oversRemaining).toFixed(2);
}

/**
 * Formats time for display (e.g., "2h 30m ago")
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return then.toLocaleDateString();
}

/**
 * Generates initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncates text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
