import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { VerificationCheckItem } from '@/lib/demo-data';

interface VerificationCheckProps {
  check: VerificationCheckItem;
  className?: string;
}

export function VerificationCheck({ check, className = '' }: VerificationCheckProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
        check.verified
          ? 'bg-emerald-950/25 border-emerald-800/40 text-neutral-200'
          : 'bg-red-950/20 border-red-800/30 text-neutral-300'
      } ${className}`}
    >
      <div className="mt-0.5 shrink-0">
        {check.verified ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
      </div>

      <div className="text-xs">
        <div className="font-semibold text-white font-sans flex items-center gap-2">
          <span>{check.name}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            CRYPTOGRAPHICALLY ATTESTED
          </span>
        </div>
        <p className="mt-1 text-neutral-400 leading-relaxed font-sans">
          {check.detail}
        </p>
      </div>
    </div>
  );
}
