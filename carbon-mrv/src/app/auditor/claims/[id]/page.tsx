import React from 'react';
import Link from 'next/link';
import { getClaimData, getProjectData } from '@/lib/demo-data';
import { EcoNavbar } from '@/components/eco/EcoNavbar';
import { EcoFooter } from '@/components/eco/EcoFooter';
import { LifecycleTimeline } from '@/components/eco/LifecycleTimeline';
import { StatusBadge } from '@/components/eco/StatusBadge';
import { AuditorQuorum } from '@/components/eco/AuditorQuorum';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trees,
  Layers,
  Scale,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface AuditorReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditorClaimReviewPage({ params }: AuditorReviewPageProps) {
  const { id } = await params;

  const claim = getClaimData(id);
  const project = getProjectData(claim.projectId);

  return (
    <div className="min-h-screen bg-[#070b09] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <EcoNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <Link href="/projects/MRV-2026-001" className="text-emerald-400 hover:underline">
              Projects
            </Link>
            <span>/</span>
            <Link href="/auditor/claims/CL-1024" className="text-neutral-200 hover:underline">
              Auditor Governance
            </Link>
            <span>/</span>
            <span className="text-emerald-300">Claim #{claim.claimId}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Protocol:</span>
            <span className="text-emerald-400 font-semibold font-mono">
              2-of-3 Independent Auditor Quorum
            </span>
          </div>
        </div>

        {/* Claim Review Header */}
        <div className="relative rounded-3xl bg-[#0c1410] border border-emerald-950/70 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-700/60">
                  CLAIM REVIEW
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  Claim #{claim.claimId}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Methodology: {claim.methodology}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {claim.projectName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500">Claimed Volume:</span>
                  <strong className="text-emerald-300 text-sm font-bold">
                    {claim.claimedTco2e} tCO₂e
                  </strong>
                </div>
                <span className="text-neutral-600">•</span>
                <div>
                  <span className="text-neutral-500">Location:</span> {claim.location}
                </div>
                <span className="text-neutral-600">•</span>
                <Link
                  href={`/projects/${claim.projectId}`}
                  className="text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1"
                >
                  <span>View Project Evidence ({claim.projectId})</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Quorum Summary Pill */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-emerald-950/60 lg:text-right shrink-0 space-y-1">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Auditor Consensus
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-300">
                {claim.approvalsCurrent} / {claim.quorumTotal} APPROVALS
              </div>
              <div className="text-[11px] font-mono text-emerald-400">
                ✓ Quorum Reached (2 of 3 required)
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Timeline (Current: Auditor) */}
        <LifecycleTimeline currentStage="auditor" />

        {/* Auditor Consensus Quorum Component */}
        <section>
          <AuditorQuorum claim={claim} />
        </section>

        {/* Section Grid: Project, Evidence, ML Analysis, Carbon Methodology, Claim Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. PROJECT SUMMARY */}
          <div className="bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/60">
              <div className="flex items-center gap-2">
                <Trees className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  1. Project Context
                </h3>
              </div>
              <StatusBadge status="VERIFIED" variant="VERIFIED" size="sm" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Project Name:</span>
                <span className="font-semibold text-white">{project.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Project ID:</span>
                <span className="font-mono text-neutral-200">{project.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Location:</span>
                <span className="text-neutral-200">{project.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Ecosystem Classification:</span>
                <span className="text-emerald-400">{project.ecosystem}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Registered Surface Area:</span>
                <span className="font-mono text-neutral-200">{project.totalAreaHa} hectares</span>
              </div>
            </div>
          </div>

          {/* 2. EVIDENCE SUMMARY */}
          <div className="bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  2. MRV Evidence
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                SHA-256 Validated
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Observation Date:</span>
                <span className="font-mono text-neutral-200">{project.evidence.observationDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Baseline Area:</span>
                <span className="font-mono text-neutral-200">{project.evidence.baselineAreaHa} ha</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Current Observed Area:</span>
                <span className="font-mono text-emerald-300">{project.evidence.currentAreaHa} ha</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Regeneration Delta:</span>
                <span className="font-mono font-bold text-emerald-400">+{project.evidence.changePct}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Digest Anchoring:</span>
                <span className="font-mono text-[11px] text-neutral-400 truncate max-w-[200px]" title={project.evidence.integrityHash}>
                  {project.evidence.integrityHash.slice(0, 16)}...
                </span>
              </div>
            </div>
          </div>

          {/* 3. ML ANALYSIS */}
          <div className="bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/60">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  3. ML Analysis
                </h3>
              </div>
              <StatusBadge status="LOW RISK" variant="LOW_RISK" size="sm" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Model Architecture:</span>
                <span className="font-mono text-neutral-200">{project.mlVerification.modelVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Observed Carbon Biomass:</span>
                <span className="font-mono text-emerald-300">{project.mlVerification.observedCarbon} tCO₂e</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Claimed Carbon:</span>
                <span className="font-mono text-neutral-200">{project.mlVerification.submittedClaim} tCO₂e</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Biophysical Deviation:</span>
                <span className="font-mono text-emerald-400">{project.mlVerification.deviation}% (Conservative)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Inference Confidence:</span>
                <span className="font-mono text-emerald-400">{project.mlVerification.confidence}%</span>
              </div>
            </div>
          </div>

          {/* 4. CARBON METHODOLOGY & CLAIM DETAILS */}
          <div className="bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/60">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  4. Methodology &amp; Governance
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">IPCC Tier-2</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Standard Framework:</span>
                <span className="text-neutral-200">Wetland GHG Inventory Guidance</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Buffer Reserve Deduct:</span>
                <span className="font-mono text-amber-400">15.0% Non-Permanence Reserve</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Anti-Self-Approval:</span>
                <span className="text-emerald-400 font-mono">Enforced (Registry vs Auditor)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Generator Wallet:</span>
                <span className="font-mono text-neutral-400">0x7099...79C8</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Smart Contract Ready:</span>
                <span className="text-emerald-400 font-mono">ProductionCarbonCredit1155</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Timeline */}
        <section className="bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-950/60 mb-6">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
                Sequential Verification Trail
              </span>
              <h3 className="text-xl font-bold text-white font-sans mt-0.5">
                Audit Process Timeline
              </h3>
            </div>
            <div className="text-xs font-mono text-neutral-400">
              Cryptographic Audit Log
            </div>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-emerald-950/80 before:h-full">
            {claim.timeline.map((item, index) => (
              <div key={index} className="relative flex items-start gap-4">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    item.completed
                      ? 'bg-emerald-500 text-neutral-950 ring-4 ring-emerald-500/20'
                      : item.current
                      ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/20'
                      : 'bg-neutral-900 text-neutral-500 border border-neutral-700'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : item.current ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-neutral-600" />
                  )}
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-sm font-semibold text-white font-sans">
                      {item.title}
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-400">
                      {item.date}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Navigation CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0c1410] to-[#0c1410] border border-emerald-800/50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase font-semibold tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Next Demo Lifecycle Step</span>
            </div>
            <h3 className="text-xl font-bold text-white font-sans mt-1">
              Inspect Issued Carbon Credit &amp; On-Chain Provenance
            </h3>
            <p className="text-xs text-neutral-300 mt-1 max-w-xl">
              Since 2 of 3 auditors approved Claim #CL-1024, the batch was certified and minted as
              ERC-1155 Token #1 with 15% automatic allocation to the non-permanence buffer pool.
            </p>
          </div>

          <Link
            href="/credits/CC-001"
            className="shrink-0 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold font-mono tracking-wider uppercase transition shadow-lg shadow-emerald-950"
          >
            View Credit #CC-001 Provenance →
          </Link>
        </div>
      </main>

      <EcoFooter />
    </div>
  );
}
