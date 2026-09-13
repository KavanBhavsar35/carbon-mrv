'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Clock, ChevronRight } from 'lucide-react';

export type LifecycleStage =
  | 'evidence'
  | 'claim'
  | 'ml'
  | 'auditor'
  | 'issuance'
  | 'ownership'
  | 'retirement'
  | 'certificate'
  | 'verification';

interface StageDefinition {
  id: LifecycleStage;
  label: string;
  sublabel: string;
  href: string;
}

const STAGES: StageDefinition[] = [
  { id: 'evidence', label: 'MRV Evidence', sublabel: 'Satellite/Drone', href: '/projects/MRV-2026-001#evidence' },
  { id: 'claim', label: 'Carbon Claim', sublabel: '120.0 tCO₂e', href: '/projects/MRV-2026-001#claim' },
  { id: 'ml', label: 'ML Verification', sublabel: 'LOW Risk', href: '/projects/MRV-2026-001#ml' },
  { id: 'auditor', label: 'Auditor Approval', sublabel: '2/3 Quorum', href: '/auditor/claims/CL-1024' },
  { id: 'issuance', label: 'ERC-1155 Issuance', sublabel: 'Token #1', href: '/credits/CC-001' },
  { id: 'ownership', label: 'Credit Ownership', sublabel: 'Institutional', href: '/credits/CC-001#ownership' },
  { id: 'retirement', label: 'Partial Retirement', sublabel: '25.0 tCO₂e', href: '/credits/CC-001#retirement' },
  { id: 'certificate', label: 'Retirement Cert', sublabel: 'RC-2026-00421', href: '/retirements/RC-2026-00421' },
  { id: 'verification', label: 'Public Verification', sublabel: 'Zero-Auth Proof', href: '/verify/RC-2026-00421' },
];

interface LifecycleTimelineProps {
  currentStage: LifecycleStage;
  className?: string;
  compact?: boolean;
}

export function LifecycleTimeline({ currentStage, className = '', compact = false }: LifecycleTimelineProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className={`w-full bg-white dark:bg-[#0c1410] border border-emerald-200 dark:border-emerald-950/70 rounded-2xl p-4 md:p-5 shadow-xl text-neutral-900 dark:text-neutral-100 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-emerald-100 dark:border-emerald-950/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
            Verifiable Carbon Credit Lifecycle
          </span>
        </div>
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
          Stage {currentIndex + 1} of {STAGES.length}: <span className="text-emerald-700 dark:text-emerald-300 font-medium">{STAGES[currentIndex]?.label}</span>
        </div>
      </div>

      {/* Horizontal Scrollable Stages Container */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex items-center min-w-[760px] gap-1 justify-between">
          {STAGES.map((stage, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;

            return (
              <React.Fragment key={stage.id}>
                <Link
                  href={stage.href}
                  className={`group flex flex-col items-center text-center p-2 rounded-xl transition-all duration-200 min-w-[76px] ${
                    isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/60 shadow-lg shadow-emerald-100 dark:shadow-emerald-950/50'
                      : isPassed
                      ? 'bg-slate-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                      : 'bg-white dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-900 text-neutral-400 dark:text-neutral-500 hover:border-neutral-200 dark:hover:border-neutral-800'
                  }`}
                >
                  {/* Status Indicator Bubble */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-neutral-950 ring-4 ring-emerald-200 dark:ring-emerald-500/20'
                        : isPassed
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-white dark:bg-neutral-950" />
                    ) : (
                      <Clock className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`mt-2 text-[11px] font-semibold leading-tight line-clamp-1 ${
                      isCurrent
                        ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                        : isPassed
                        ? 'text-neutral-900 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-white'
                        : 'text-neutral-500 dark:text-neutral-500'
                    }`}
                  >
                    {stage.label}
                  </span>

                  {/* Sublabel */}
                  <span
                    className={`text-[9px] font-mono leading-tight mt-0.5 line-clamp-1 ${
                      isCurrent
                        ? 'text-emerald-600 dark:text-emerald-400/90'
                        : isPassed
                        ? 'text-neutral-500 dark:text-neutral-400'
                        : 'text-neutral-400 dark:text-neutral-600'
                    }`}
                  >
                    {stage.sublabel}
                  </span>
                </Link>

                {idx < STAGES.length - 1 && (
                  <div className="flex items-center px-0.5 text-neutral-700">
                    <ChevronRight className={`w-3.5 h-3.5 ${isPassed ? 'text-emerald-300 dark:text-emerald-700/70' : 'text-neutral-200 dark:text-neutral-800'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
