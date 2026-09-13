import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MLVerificationRecord } from '@/lib/demo-data';

interface RiskIndicatorProps {
  ml: MLVerificationRecord;
  className?: string;
}

export function RiskIndicator({ ml, className = '' }: RiskIndicatorProps) {
  const isLow = ml.anomalyRisk === 'LOW';
  const isMedium = ml.anomalyRisk === 'MEDIUM';
  const isHigh = ml.anomalyRisk === 'HIGH';

  return (
    <div
      className={`bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl text-neutral-100 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-950/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
              Machine Learning Biophysical Audit
            </span>
          </div>
          <h3 className="text-lg font-bold text-white font-sans mt-0.5">
            Biomass Estimation &amp; Anomaly Analysis
          </h3>
        </div>

        {/* Risk Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold tracking-wider ${
            isLow
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70 shadow-emerald-950/60 shadow'
              : isMedium
              ? 'bg-amber-950/80 text-amber-300 border-amber-600/70 shadow'
              : 'bg-red-950/80 text-red-300 border-red-600/70 shadow'
          }`}
        >
          {isLow ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : isMedium ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{ml.anomalyRisk} ANOMALY RISK</span>
        </div>
      </div>

      {/* Primary Metrics Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        <div className="p-4 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Observed Biomass Estimate
          </span>
          <div className="mt-1 text-2xl font-bold font-sans text-emerald-300">
            {ml.observedCarbon}{' '}
            <span className="text-xs font-normal text-neutral-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Confidence: {ml.confidence}% ({ml.modelVersion})
          </span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Submitted Claim
          </span>
          <div className="mt-1 text-2xl font-bold font-sans text-neutral-100">
            {ml.submittedClaim}{' '}
            <span className="text-xs font-normal text-neutral-400 font-mono">tCO₂e</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Project generator submission
          </span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Claim Deviation
          </span>
          <div className="mt-1 text-2xl font-bold font-sans text-emerald-400">
            {ml.deviation}%
          </div>
          <span className="text-[10px] text-emerald-300/80 font-mono mt-1 block">
            Conservative claim (within bounds)
          </span>
        </div>
      </div>

      {/* Plain Language Explanation Box */}
      <div className="mt-5 p-4 rounded-xl bg-emerald-950/25 border border-emerald-800/40 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-semibold text-emerald-300">
            {ml.statusText}
          </div>
          <p className="mt-1 text-neutral-300 leading-relaxed">
            The project’s claimed carbon credit quantity (120.0 tCO₂e) is 4.5% below the independent
            satellite ML observation (125.7 tCO₂e). Because the generator claims less than the observed
            biophysical maximum, there is no over-issuance anomaly.
          </p>
        </div>
      </div>
    </div>
  );
}
