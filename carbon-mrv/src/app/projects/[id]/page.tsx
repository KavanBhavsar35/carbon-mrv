import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getProjectData } from '@/lib/demo-data';
import { EcoNavbar } from '@/components/eco/EcoNavbar';
import { EcoFooter } from '@/components/eco/EcoFooter';
import { LifecycleTimeline } from '@/components/eco/LifecycleTimeline';
import { StatusBadge } from '@/components/eco/StatusBadge';
import { MetricCard } from '@/components/eco/MetricCard';
import { EvidenceCard } from '@/components/eco/EvidenceCard';
import { RiskIndicator } from '@/components/eco/RiskIndicator';
import {
  MapPin,
  Trees,
  TrendingUp,
  Scale,
  ShieldAlert,
  FileCheck,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;

  // Attempt database query first, fallback gracefully to unified demo project
  let project = getProjectData(id);

  try {
    const dbParcel = await prisma.landParcel.findFirst({
      where: {
        OR: [
          { id },
          { parcelName: { contains: id } }
        ]
      },
      include: {
        estimates: true,
        credits: true
      }
    });

    if (dbParcel) {
      const estimate = dbParcel.estimates[0];
      project = {
        ...project,
        id: dbParcel.id,
        name: dbParcel.parcelName,
        location: `${dbParcel.district || 'Gujarat'}, ${dbParcel.state || 'India'}`,
        ecosystem: dbParcel.ecosystemType || project.ecosystem,
        totalAreaHa: dbParcel.totalAreaHa || project.totalAreaHa,
        claimedCarbonTco2e: dbParcel.claimedCredits || project.claimedCarbonTco2e,
        estimatedCarbonTco2e: estimate?.estimatedCredits || project.estimatedCarbonTco2e,
        status: dbParcel.status === 'APPROVED' ? 'VERIFIED' : 'PENDING'
      };
    }
  } catch {
    // Database fallback active
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b09] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950 transition-colors">
      <EcoNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-white dark:bg-neutral-950/40 border border-emerald-200 dark:border-emerald-900/30 text-xs font-mono text-neutral-600 dark:text-neutral-400 shadow-sm">
          <div className="flex items-center gap-2">
            <Link href="/projects/MRV-2026-001" className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline transition-colors">
              Registry Projects
            </Link>
            <span className="text-emerald-300 dark:text-emerald-900">/</span>
            <span className="text-neutral-900 dark:text-neutral-200 font-semibold">{project.id}</span>
          </div>

          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900/60 px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400">Registry Origin:</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              MRV Evidence Anchored
            </span>
          </div>
        </div>

        {/* Project Header */}
        <div className="relative rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-[#0c1410] dark:to-[#070b09] border border-emerald-300 dark:border-emerald-800/50 p-6 sm:p-10 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-400/15 transition-colors duration-1000" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={project.status} variant="VERIFIED" size="lg" />
                <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700/60 shadow-inner tracking-wider">
                  Project {project.id}
                </span>
                <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900/50 px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-800">
                  Ecosystem: {project.ecosystem}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-emerald-700 dark:from-white dark:to-emerald-100/70">
                {project.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-950/50 w-fit px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-900">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold text-neutral-900 dark:text-white">{project.location}</span>
                </div>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Observation: Aug 2026</span>
                </div>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500">Methodology:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">IPCC Tier-2</span>
                </div>
              </div>
            </div>

            {/* Quick Link to Auditor Review */}
            <div className="lg:text-right shrink-0 p-5 rounded-2xl bg-white dark:bg-neutral-950/60 border border-emerald-200 dark:border-emerald-900/30 backdrop-blur-sm shadow-xl transition hover:border-emerald-400 dark:hover:border-emerald-700/50">
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                Current Lifecycle State
              </div>
              <Link
                href={`/auditor/claims/${project.claim.claimId}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/40 transition-all duration-300 group/btn"
              >
                <span>Proceed to Auditor Review</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Reusable Lifecycle Timeline (Stage 1-3 Active) */}
        <LifecycleTimeline currentStage="evidence" />

        {/* High-Level Metrics Grid */}
        <div>
          <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold mb-3">
            Primary MRV Metrics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Project Area"
              value={project.totalAreaHa}
              unit="ha"
              delta="+8.2 ha"
              subtitle="Registered canopy boundary"
              icon={<Trees className="w-4 h-4" />}
            />

            <MetricCard
              title="Observed Change"
              value={`+${project.observedChangePct}%`}
              delta="Bi-temporal growth"
              deltaType="positive"
              subtitle="12 Aug 2026 vs Baseline"
              icon={<TrendingUp className="w-4 h-4" />}
            />

            <MetricCard
              title="Estimated Carbon"
              value={project.estimatedCarbonTco2e}
              unit="tCO₂e"
              delta="UNet Biomass Model"
              subtitle="Confidence: 94.2%"
              icon={<Scale className="w-4 h-4" />}
            />

            <MetricCard
              title="Claimed Carbon"
              value={project.claimedCarbonTco2e}
              unit="tCO₂e"
              delta="-4.5% conservative"
              subtitle="Below estimated max"
              icon={<FileCheck className="w-4 h-4" />}
            />

            <MetricCard
              title="Anomaly Risk"
              value={project.risk}
              delta="Score: 0.08"
              subtitle="Zero over-claim risk"
              badge={<StatusBadge status="LOW RISK" variant="LOW_RISK" size="sm" />}
              icon={<ShieldAlert className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Section 1: MRV Evidence */}
        <section id="evidence" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              MRV Evidence &amp; Integrity Verification
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              SHA-256 Digest Anchored
            </span>
          </div>

          <EvidenceCard evidence={project.evidence} title="Satellite & Drone Orthomosaic Observation" />
        </section>

        {/* Section 2: ML Verification */}
        <section id="ml" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              Machine Learning Biophysical Estimation
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              UNet Bitemporal Algorithm v2.4
            </span>
          </div>

          <RiskIndicator ml={project.mlVerification} />
        </section>

        {/* Section 3: Carbon Claim Details */}
        <section id="claim" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              Carbon Claim Submission
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              Claim ID #{project.claim.claimId}
            </span>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#0c1410] dark:to-[#070b09] border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-400/15 dark:group-hover:bg-emerald-500/10 transition-colors duration-700" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/50 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Claim ID
                </span>
                <span className="mt-1.5 text-xl font-mono font-bold text-neutral-900 dark:text-white block">
                  #{project.claim.claimId}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
                  Submitted {project.claim.submittedAt}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/50 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Claimed Quantity
                </span>
                <div className="mt-1.5 text-3xl font-bold font-sans text-emerald-600 dark:text-emerald-300">
                  {project.claim.claimedQuantity}{' '}
                  <span className="text-sm font-normal text-emerald-600/70 dark:text-neutral-400 font-mono">tCO₂e</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400/80 font-mono mt-1 block">
                  Conservative offset volume
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/50 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Methodology Framework
                </span>
                <span className="mt-1.5 text-base font-semibold text-neutral-900 dark:text-neutral-200 block">
                  {project.claim.methodology}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
                  IPCC Wetlands Supplement
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/50 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Current Status
                </span>
                <div className="mt-2">
                  <StatusBadge status={project.claim.status} variant="VERIFIED" />
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-2 block flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Consensus Quorum Reached
                </span>
              </div>
            </div>

            {/* Generator Info */}
            <div className="mt-6 pt-5 border-t border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs relative z-10">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-950/60 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500 font-mono">Project Generator:</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{project.claim.generatorName}</span>
                <span className="text-neutral-500 font-mono bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded text-[10px]">({project.claim.generatorWallet.slice(0, 8)}...{project.claim.generatorWallet.slice(-6)})</span>
              </div>

              <Link
                href={`/auditor/claims/${project.claim.claimId}`}
                className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 font-semibold font-mono transition group"
              >
                <span>View Auditor Consensus (2/3 Approvals)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom Call to Action */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-white dark:from-emerald-950/80 dark:via-[#0c1410] dark:to-[#0c1410] border border-emerald-200 dark:border-emerald-800/50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-mono uppercase font-semibold tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Next Demo Lifecycle Step</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-sans mt-1">
              Verify Auditor Multi-Sig Consensus
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-xl">
              Confirm how independent auditors (Bureau Veritas, DNV GL, TÜV SÜD) verified satellite
              observations and satisfied the 2-of-3 threshold for on-chain ERC-1155 minting.
            </p>
          </div>

          <Link
            href={`/auditor/claims/${project.claim.claimId}`}
            className="shrink-0 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold font-mono tracking-wider uppercase transition shadow-lg shadow-emerald-950"
          >
            Review Claim #CL-1024 →
          </Link>
        </div>
      </main>

      <EcoFooter />
    </div>
  );
}
