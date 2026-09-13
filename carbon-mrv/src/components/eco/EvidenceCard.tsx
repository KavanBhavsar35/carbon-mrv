import React from 'react';
import { ShieldCheck, Satellite, ExternalLink, Hash } from 'lucide-react';
import { EvidenceRecord } from '@/lib/demo-data';

interface EvidenceCardProps {
  evidence: EvidenceRecord;
  title?: string;
  className?: string;
}

export function EvidenceCard({
  evidence,
  title = 'Satellite Observation',
  className = ''
}: EvidenceCardProps) {
  return (
    <div
      className={`group bg-gradient-to-br from-white to-slate-50 dark:from-[#0c1410] dark:to-[#0a120e] border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-2xl hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20 ${className}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[40px] group-hover:bg-emerald-400/20 dark:group-hover:bg-emerald-400/10 transition-colors duration-500" />
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-emerald-100 dark:border-emerald-900/50 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 shadow-inner">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white font-sans">{title}</h3>
            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400">{evidence.observationDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>SHA-256 verified</span>
        </div>
      </div>

      {/* Metrics Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 relative z-10">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/50 border border-emerald-100 dark:border-emerald-900/30 transition hover:border-emerald-300 dark:hover:border-emerald-700/50">
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Baseline Area
          </span>
          <div className="mt-1.5 text-2xl font-bold font-sans text-neutral-900 dark:text-neutral-200">
            {evidence.baselineAreaHa}{' '}
            <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400 font-mono">ha</span>
          </div>
          <span className="text-[10px] text-neutral-600 dark:text-neutral-500 font-mono mt-1 block">
            Historical benchmark
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/50 border border-emerald-100 dark:border-emerald-900/30 transition hover:border-emerald-300 dark:hover:border-emerald-700/50">
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Observed Area
          </span>
          <div className="mt-1.5 text-2xl font-bold font-sans text-emerald-600 dark:text-emerald-300">
            {evidence.currentAreaHa}{' '}
            <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400 font-mono">ha</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 font-mono mt-1 block">
            Latest observation
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/50 shadow-inner transform transition hover:scale-105">
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Net Change
          </span>
          <div className="mt-1.5 text-2xl font-bold font-sans text-emerald-600 dark:text-emerald-400 drop-shadow-sm">
            +{evidence.changePct}%
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-mono mt-1 block">
            Canopy regeneration
          </span>
        </div>
      </div>

      {/* Sensor Specs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono text-neutral-600 dark:text-neutral-400 py-3 px-4 rounded-xl bg-slate-50 dark:bg-neutral-950/40 border border-emerald-100 dark:border-emerald-950/30">
        <div>
          <span className="text-neutral-500 dark:text-neutral-500 text-[10px] uppercase block">Constellation</span>
          <span className="text-neutral-900 dark:text-neutral-300 text-[11px] font-medium">{evidence.sensor}</span>
        </div>
        <div>
          <span className="text-neutral-500 dark:text-neutral-500 text-[10px] uppercase block">Ground Resolution</span>
          <span className="text-neutral-900 dark:text-neutral-300 text-[11px] font-medium">{evidence.resolution}</span>
        </div>
        <div>
          <span className="text-neutral-500 dark:text-neutral-500 text-[10px] uppercase block">Cloud Obscuration</span>
          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">{evidence.cloudCover}</span>
        </div>
      </div>

      {/* Cryptographic Proof Hash */}
      <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
          <Hash className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
          <span className="text-[11px] font-mono truncate max-w-xs sm:max-w-md text-neutral-500 dark:text-neutral-400">
            {evidence.integrityHash}
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 shrink-0">
          Cryptographically Anchored
        </span>
      </div>
    </div>
  );
}
