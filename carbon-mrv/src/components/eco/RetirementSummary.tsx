import React from 'react';
import { Flame, ShieldCheck, ArrowDownRight, Layers } from 'lucide-react';

interface RetirementSummaryProps {
  projectName: string;
  creditId: string;
  vintage: number;
  issuedQuantity: number;
  previouslyRetired: number;
  thisRetirement: number;
  remaining: number;
  className?: string;
}

export function RetirementSummary({
  projectName,
  creditId,
  vintage,
  issuedQuantity,
  previouslyRetired,
  thisRetirement,
  remaining,
  className = ''
}: RetirementSummaryProps) {
  return (
    <div
      className={`bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl text-neutral-100 ${className}`}
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-950/60">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
            Offset Accounting Ledger
          </span>
          <h3 className="text-lg font-bold text-white font-sans mt-0.5">
            Retirement Balance Reconciliation
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono">
            Credit #{creditId}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-semibold">
            Vintage {vintage}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block">
            Issued Quantity
          </span>
          <div className="mt-1 text-xl font-bold font-sans text-neutral-200">
            {issuedQuantity.toLocaleString()}{' '}
            <span className="text-xs font-normal text-neutral-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Original batch total
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block">
            Previously Retired
          </span>
          <div className="mt-1 text-xl font-bold font-sans text-neutral-300">
            {previouslyRetired.toLocaleString()}{' '}
            <span className="text-xs font-normal text-neutral-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Prior certificates
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold block">
              This Retirement
            </span>
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 text-2xl font-black font-sans text-emerald-300">
            {thisRetirement.toFixed(3)}{' '}
            <span className="text-xs font-normal text-emerald-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block font-semibold">
            Permanently burned
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block">
            Remaining Available
          </span>
          <div className="mt-1 text-xl font-bold font-sans text-neutral-200">
            {remaining.toLocaleString()}{' '}
            <span className="text-xs font-normal text-neutral-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Unretired active supply
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-950/40 text-xs text-neutral-400 font-sans flex items-center justify-between">
        <span>Project: <strong className="text-white font-semibold">{projectName}</strong></span>
        <span className="font-mono text-emerald-400 text-[11px]">Strict Non-Double-Count Guarantee</span>
      </div>
    </div>
  );
}
