import React from 'react';
import { Layers, ShieldCheck, Flame, Lock } from 'lucide-react';

interface CreditBalanceProps {
  issued: number;
  available: number;
  retired: number;
  reserve: number;
  vintage: number;
  methodology: string;
  tokenId: string | number;
  className?: string;
}

export function CreditBalance({
  issued,
  available,
  retired,
  reserve,
  vintage,
  methodology,
  tokenId,
  className = ''
}: CreditBalanceProps) {
  return (
    <div
      className={`bg-white dark:bg-[#0c1410] border border-emerald-200 dark:border-emerald-950/70 rounded-2xl p-6 shadow-xl text-neutral-900 dark:text-neutral-100 ${className}`}
    >
      {/* Top summary row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-100 dark:border-emerald-950/60">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
            Tokenized Balance Distribution
          </span>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-sans mt-0.5">
            Credit Inventory &amp; Reserve Status
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-medium">
            Vintage {vintage}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-semibold">
            Token #{tokenId}
          </span>
        </div>
      </div>

      {/* Primary 4-Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        {/* Total Issued */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-emerald-100 dark:border-emerald-950/40">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 text-[11px] font-mono uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>Total Issued</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-sans text-neutral-900 dark:text-white">
            {issued.toLocaleString()}{' '}
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-neutral-600 dark:text-neutral-500 font-mono mt-1 block">
            100% on-chain batch
          </span>
        </div>

        {/* Available Active Supply */}
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Available</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-sans text-emerald-700 dark:text-emerald-300">
            {available.toLocaleString()}{' '}
            <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 font-mono mt-1 block">
            Eligible for trade/retirement
          </span>
        </div>

        {/* Permanently Retired */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-emerald-100 dark:border-emerald-950/40">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 text-[11px] font-mono uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Retired</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-sans text-neutral-900 dark:text-neutral-200">
            {retired.toLocaleString()}{' '}
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-1 block">
            Burned to null address
          </span>
        </div>

        {/* Risk Buffer Reserve */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-emerald-100 dark:border-emerald-950/40">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px] font-mono uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Reserve (15%)</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-sans text-amber-700 dark:text-amber-300">
            {reserve.toLocaleString()}{' '}
            <span className="text-xs font-normal text-amber-600 dark:text-amber-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-500/80 font-mono mt-1 block">
            Non-permanence pool
          </span>
        </div>
      </div>

      {/* Methodology badge */}
      <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-950/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
        <div>Methodology: <span className="text-neutral-900 dark:text-neutral-200">{methodology}</span></div>
        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Audited unit scale: 1 unit = 0.001 tCO₂e</div>
      </div>
    </div>
  );
}
