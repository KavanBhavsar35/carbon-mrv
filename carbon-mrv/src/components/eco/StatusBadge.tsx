import React from 'react';

export type StatusVariant =
  | 'VERIFIED'
  | 'ACTIVE'
  | 'PENDING'
  | 'REJECTED'
  | 'RETIRED'
  | 'LOW_RISK'
  | 'MEDIUM_RISK'
  | 'HIGH_RISK';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({
  status,
  variant,
  size = 'md',
  className = ''
}: StatusBadgeProps) {
  // Normalize variant from string if not explicitly passed
  const normalized = (variant || status.toUpperCase().replace(/\s+/g, '_')) as StatusVariant;

  const getStyles = () => {
    switch (normalized) {
      case 'VERIFIED':
      case 'ACTIVE':
        return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 ring-1 ring-emerald-200 dark:ring-emerald-500/20';
      case 'LOW_RISK':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
      case 'PENDING':
      case 'MEDIUM_RISK':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200 dark:ring-amber-500/20';
      case 'REJECTED':
      case 'HIGH_RISK':
        return 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700/60 ring-1 ring-red-200 dark:ring-red-500/20';
      case 'RETIRED':
        return 'bg-emerald-50 dark:bg-[#15231c] text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-600/70 font-mono tracking-wider';
      default:
        return 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-[10px]';
      case 'lg':
        return 'px-3.5 py-1.5 text-xs';
      default:
        return 'px-2.5 py-1 text-[11px]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold font-mono uppercase tracking-wider rounded-full border shadow-sm ${getStyles()} ${getSize()} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          normalized === 'VERIFIED' || normalized === 'ACTIVE' || normalized === 'LOW_RISK'
            ? 'bg-emerald-400'
            : normalized === 'PENDING' || normalized === 'MEDIUM_RISK'
            ? 'bg-amber-400'
            : normalized === 'REJECTED' || normalized === 'HIGH_RISK'
            ? 'bg-red-400'
            : 'bg-emerald-300'
        }`}
      />
      {status}
    </span>
  );
}
