import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  delta,
  deltaType = 'positive',
  subtitle,
  badge,
  icon,
  className = ''
}: MetricCardProps) {
  return (
    <div
      className={`group bg-gradient-to-br from-white to-slate-50 dark:from-[#0c1410] dark:to-[#0a120e] border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20 ${className}`}
    >
      {/* Subtle hover highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[30px] group-hover:bg-emerald-400/20 dark:group-hover:bg-emerald-400/10 transition-colors duration-500" />
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs uppercase font-mono tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
          {title}
        </span>
        {icon && <div className="text-emerald-600 dark:text-emerald-400/80">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-sans">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 font-mono">
            {unit}
          </span>
        )}
      </div>

      {(delta || subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-950/40 text-xs">
          {delta && (
            <span
              className={`inline-flex items-center font-mono font-medium ${
                deltaType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : deltaType === 'negative'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {delta}
            </span>
          )}
          {subtitle && (
            <span className="text-neutral-600 dark:text-neutral-500 font-sans truncate">{subtitle}</span>
          )}
          {badge && <div className="ml-auto">{badge}</div>}
        </div>
      )}
    </div>
  );
}
