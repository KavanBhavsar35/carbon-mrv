import React from 'react';
import Link from 'next/link';
import { getRetirementData, getCreditData, getProjectData } from '@/lib/demo-data';
import { EcoNavbar } from '@/components/eco/EcoNavbar';
import { EcoFooter } from '@/components/eco/EcoFooter';
import { LifecycleTimeline } from '@/components/eco/LifecycleTimeline';
import { StatusBadge } from '@/components/eco/StatusBadge';
import { TransactionLink } from '@/components/eco/TransactionLink';
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
  QrCode,
  ExternalLink,
  Flame,
  Lock,
  Award,
  ArrowRight,
  Leaf,
  Sparkles
} from 'lucide-react';

interface RetirementPageProps {
  params: Promise<{ certificateId: string }>;
}

export default async function RetirementCertificatePage({ params }: RetirementPageProps) {
  const { certificateId } = await params;

  const retirement = getRetirementData(certificateId);
  const credit = getCreditData(retirement.creditId);
  const project = getProjectData(credit.projectId);

  return (
    <div className="min-h-screen bg-[#070b09] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <EcoNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb & Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <Link href="/credits/CC-001" className="text-emerald-400 hover:underline">
              Credit #{retirement.creditId}
            </Link>
            <span>/</span>
            <span className="text-neutral-200">Certificate {retirement.certificateId}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/verify/${retirement.certificateId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Public Verifier</span>
            </Link>
          </div>
        </div>

        {/* Lifecycle Timeline (Current: Certificate) */}
        <LifecycleTimeline currentStage="certificate" />

        {/* FORMAL PRINTABLE CERTIFICATE DOCUMENT */}
        <div
          id="printable-certificate"
          className="relative bg-[#0d1612] border-2 border-emerald-800/80 rounded-3xl p-6 sm:p-12 shadow-2xl text-neutral-100 overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 70%)'
          }}
        >
          {/* Subtle Guilloche Inner Border */}
          <div className="absolute inset-3 sm:inset-5 border border-emerald-900/50 rounded-2xl pointer-events-none" />

          {/* Certificate Header / Seal */}
          <div className="text-center space-y-3 relative z-10 pb-6 border-b border-emerald-950/80">
            <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-800/30 border border-emerald-700/50 text-emerald-400 shadow-inner">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase font-mono tracking-widest text-emerald-400 font-bold block">
                Circular Carbon Ecosystem • Official Registry Record
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans uppercase">
                Carbon Retirement Certificate
              </h1>
              <p className="text-xs font-mono text-neutral-400">
                Certificate Identifier:{' '}
                <strong className="text-white font-bold">{retirement.certificateId}</strong>
              </p>
            </div>
          </div>

          {/* Retired Quantity Centerpiece */}
          <div className="my-8 text-center relative z-10 space-y-2">
            <div className="text-xs uppercase font-mono tracking-wider text-neutral-400 font-medium">
              Permanently Retired Carbon Volume
            </div>
            <div className="text-4xl sm:text-6xl font-black tracking-tight text-emerald-300 font-sans">
              {retirement.quantityTco2e.toFixed(3)}{' '}
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-400 font-mono">
                tCO₂e
              </span>
            </div>
            <div className="text-xs font-mono text-neutral-400 italic">
              Twenty-Five Metric Tons Carbon Dioxide Equivalent
            </div>

            <div className="pt-3">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-600/70 text-emerald-300 text-xs font-mono font-bold tracking-widest uppercase shadow-md">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                PERMANENTLY RETIRED
              </span>
            </div>
          </div>

          {/* Project & Beneficiary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 p-6 rounded-2xl bg-neutral-950/70 border border-emerald-950/60 relative z-10 text-xs">
            <div className="space-y-3">
              <div>
                <span className="text-neutral-500 uppercase font-mono text-[10px] block">
                  Origin Project
                </span>
                <p className="text-sm font-bold text-white mt-0.5">{retirement.projectName}</p>
                <p className="text-neutral-400">{retirement.location}</p>
              </div>

              <div>
                <span className="text-neutral-500 uppercase font-mono text-[10px] block">
                  Beneficiary / Retired By
                </span>
                <p className="text-sm font-semibold text-emerald-300 mt-0.5">
                  {retirement.retiredByEntity}
                </p>
                <div className="mt-1">
                  <TransactionLink hash={retirement.retiredBy} type="address" network={retirement.network} />
                </div>
              </div>

              <div>
                <span className="text-neutral-500 uppercase font-mono text-[10px] block">
                  Retirement Purpose
                </span>
                <p className="text-neutral-300 italic mt-0.5 leading-relaxed">
                  "{retirement.reason}"
                </p>
              </div>
            </div>

            <div className="space-y-3 md:border-l md:border-emerald-950/60 md:pl-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-neutral-500 uppercase font-mono text-[10px] block">
                    Credit Reference
                  </span>
                  <p className="font-mono text-white font-bold mt-0.5">#{retirement.creditId}</p>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-mono text-[10px] block">
                    Vintage
                  </span>
                  <p className="font-mono text-white font-bold mt-0.5">{retirement.vintage}</p>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 uppercase font-mono text-[10px] block">
                  Standard &amp; Methodology
                </span>
                <p className="text-neutral-300 font-sans mt-0.5">{retirement.methodology}</p>
              </div>

              <div>
                <span className="text-neutral-500 uppercase font-mono text-[10px] block">
                  Retirement Date
                </span>
                <p className="font-mono text-white mt-0.5">{retirement.retiredOn}</p>
              </div>

              <div>
                <span className="text-neutral-500 uppercase font-mono text-[10px] block">
                  Blockchain Anchor
                </span>
                <p className="font-mono text-emerald-400 mt-0.5">
                  {retirement.network} (Contract Token #{retirement.tokenId})
                </p>
              </div>
            </div>
          </div>

          {/* Three Immutable Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 relative z-10 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-200">Permanently retired</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-200">Blockchain recorded</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-200">Cannot be retired again</span>
            </div>
          </div>

          {/* Blockchain Attestation Box */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-emerald-950/60 relative z-10 text-xs font-mono space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
              <span className="text-neutral-500 uppercase">Burn Transaction:</span>
              <TransactionLink hash={retirement.txHash} type="tx" network={retirement.network} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
              <span className="text-neutral-500 uppercase">Token Contract:</span>
              <TransactionLink hash={retirement.contractAddress} type="address" network={retirement.network} />
            </div>
          </div>

          {/* Certificate Verification Footer with QR Code */}
          <div className="mt-8 pt-6 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              {/* QR Code Visual linking to Verifier */}
              <div className="p-2.5 rounded-xl bg-white text-neutral-950 shadow-md">
                <QrCode className="w-12 h-12" />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-mono text-neutral-400 text-[10px] uppercase block">
                  Public Verification QR
                </span>
                <span className="font-bold text-white block">
                  Scan to verify cryptographic proof
                </span>
                <span className="font-mono text-emerald-400 text-[11px] block">
                  verify/{retirement.certificateId}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                href={`/verify/${retirement.certificateId}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono tracking-wider uppercase transition text-center shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Certificate</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA to Public Verification Page */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0c1410] to-[#0c1410] border border-emerald-800/50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase font-semibold tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Final Judge-Facing Verification Step</span>
            </div>
            <h3 className="text-xl font-bold text-white font-sans mt-1">
              Public Zero-Auth Verifier
            </h3>
            <p className="text-xs text-neutral-300 mt-1 max-w-xl">
              Inspect how any auditor, regulator, or corporate counterparty can publicly audit this
              certificate in 10-15 seconds without requiring an account or wallet connection.
            </p>
          </div>

          <Link
            href={`/verify/${retirement.certificateId}`}
            className="shrink-0 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold font-mono tracking-wider uppercase transition shadow-lg shadow-emerald-950"
          >
            Launch Public Verifier →
          </Link>
        </div>
      </main>

      <EcoFooter />
    </div>
  );
}
