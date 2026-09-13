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
      className={`bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-emerald-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white font-sans">{title}</h3>
            <p className="text-xs font-mono text-neutral-400">{evidence.observationDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-700/50 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SHA-256 verified</span>
        </div>
      </div>

      {/* Metrics Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        <div className="p-4 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Baseline Area
          </span>
          <div className="mt-1 text-2xl font-bold font-sans text-neutral-200">
            {evidence.baselineAreaHa}{' '}
            <span className="text-xs font-normal text-neutral-400 font-mono">ha</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Historical benchmark
          </span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Observed Area
          </span>
          <div className="mt-1 text-2xl font-bold font-sans text-emerald-300">
            {evidence.currentAreaHa}{' '}
            <span className="text-xs font-normal text-neutral-400 font-mono">ha</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono mt-1 block">
            Latest observation
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
            Net Change
          </span>
          <div className="mt-1 text-2xl font-bold font-sans text-emerald-400">
            +{evidence.changePct}%
          </div>
          <span className="text-[10px] text-emerald-300/80 font-mono mt-1 block">
            Canopy regeneration
          </span>
        </div>
      </div>

      {/* Sensor Specs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono text-neutral-400 py-3 px-4 rounded-xl bg-neutral-950/40 border border-emerald-950/30">
        <div>
          <span className="text-neutral-500 text-[10px] uppercase block">Constellation</span>
          <span className="text-neutral-300 text-[11px] font-medium">{evidence.sensor}</span>
        </div>
        <div>
          <span className="text-neutral-500 text-[10px] uppercase block">Ground Resolution</span>
          <span className="text-neutral-300 text-[11px] font-medium">{evidence.resolution}</span>
        </div>
        <div>
          <span className="text-neutral-500 text-[10px] uppercase block">Cloud Obscuration</span>
          <span className="text-emerald-400 text-[11px] font-medium">{evidence.cloudCover}</span>
        </div>
      </div>

      {/* Cryptographic Proof Hash */}
      <div className="mt-4 pt-4 border-t border-emerald-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-neutral-400">
          <Hash className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span className="text-[11px] font-mono truncate max-w-xs sm:max-w-md text-neutral-400">
            {evidence.integrityHash}
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
          Cryptographically Anchored
        </span>
      </div>
    </div>
  );
}
