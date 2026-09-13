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
      className={`bg-[#0c1410] border border-emerald-950/60 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-emerald-800/60 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs uppercase font-mono tracking-wider text-neutral-400 font-medium">
          {title}
        </span>
        {icon && <div className="text-emerald-400/80">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white font-sans">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-neutral-400 font-mono">
            {unit}
          </span>
        )}
      </div>

      {(delta || subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-emerald-950/40 text-xs">
          {delta && (
            <span
              className={`inline-flex items-center font-mono font-medium ${
                deltaType === 'positive'
                  ? 'text-emerald-400'
                  : deltaType === 'negative'
                  ? 'text-amber-400'
                  : 'text-neutral-400'
              }`}
            >
              {delta}
            </span>
          )}
          {subtitle && (
            <span className="text-neutral-500 font-sans truncate">{subtitle}</span>
          )}
          {badge && <div className="ml-auto">{badge}</div>}
        </div>
      )}
    </div>
  );
}
