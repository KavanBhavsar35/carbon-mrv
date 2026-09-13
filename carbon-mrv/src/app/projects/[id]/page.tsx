import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
    <div className="min-h-screen bg-[#070b09] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <EcoNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <Link href="/projects/MRV-2026-001" className="text-emerald-400 hover:underline">
              Registry Projects
            </Link>
            <span>/</span>
            <span className="text-neutral-200">{project.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Registry Origin:</span>
            <span className="text-emerald-300 font-semibold">MRV Evidence Anchored</span>
          </div>
        </div>

        {/* Project Header */}
        <div className="relative rounded-3xl bg-[#0c1410] border border-emerald-950/70 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={project.status} variant="VERIFIED" size="lg" />
                <span className="text-xs font-mono text-emerald-400/90 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-800/40">
                  Project {project.id}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  Ecosystem: {project.ecosystem}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {project.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{project.location}</span>
                </div>
                <span className="text-neutral-600">•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Observation Epoch: Aug 2026</span>
                </div>
                <span className="text-neutral-600">•</span>
                <span className="text-emerald-400">Methodology: IPCC Tier-2</span>
              </div>
            </div>

            {/* Quick Link to Auditor Review */}
            <div className="lg:text-right shrink-0">
              <div className="text-[11px] font-mono text-neutral-400 mb-1.5">
                Current Lifecycle State
              </div>
              <Link
                href={`/auditor/claims/${project.claim.claimId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition group"
              >
                <span>Proceed to Auditor Review</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Reusable Lifecycle Timeline (Stage 1-3 Active) */}
        <LifecycleTimeline currentStage="evidence" />

        {/* High-Level Metrics Grid */}
        <div>
          <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold mb-3">
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
            <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
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
            <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
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
            <h2 className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
              Carbon Claim Submission
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              Claim ID #{project.claim.claimId}
            </span>
          </div>

          <div className="bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Claim ID
                </span>
                <span className="mt-1 text-lg font-mono font-bold text-white block">
                  #{project.claim.claimId}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono mt-0.5 block">
                  Submitted {project.claim.submittedAt}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Claimed Quantity
                </span>
                <div className="mt-1 text-2xl font-bold font-sans text-emerald-300">
                  {project.claim.claimedQuantity}{' '}
                  <span className="text-xs font-normal text-neutral-400 font-mono">tCO₂e</span>
                </div>
                <span className="text-[11px] text-emerald-400/80 font-mono mt-0.5 block">
                  Conservative offset volume
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Methodology Framework
                </span>
                <span className="mt-1 text-sm font-semibold text-neutral-200 block">
                  {project.claim.methodology}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono mt-0.5 block">
                  IPCC Wetlands Supplement
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Current Status
                </span>
                <div className="mt-1.5">
                  <StatusBadge status={project.claim.status} variant="VERIFIED" />
                </div>
                <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                  Consensus Quorum Reached
                </span>
              </div>
            </div>

            {/* Generator Info */}
            <div className="mt-6 pt-5 border-t border-emerald-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="text-neutral-500 font-mono">Project Generator:</span>
                <span className="font-semibold text-white">{project.claim.generatorName}</span>
                <span className="text-neutral-500 font-mono">({project.claim.generatorWallet.slice(0, 8)}...{project.claim.generatorWallet.slice(-6)})</span>
              </div>

              <Link
                href={`/auditor/claims/${project.claim.claimId}`}
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold font-mono transition"
              >
                <span>View Auditor Consensus (2/3 Approvals)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom Call to Action */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0c1410] to-[#0c1410] border border-emerald-800/50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase font-semibold tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Next Demo Lifecycle Step</span>
            </div>
            <h3 className="text-xl font-bold text-white font-sans mt-1">
              Verify Auditor Multi-Sig Consensus
            </h3>
            <p className="text-xs text-neutral-300 mt-1 max-w-xl">
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
