import React from 'react';
import Link from 'next/link';
import { getCreditData, getProjectData } from '@/lib/demo-data';
import { EcoNavbar } from '@/components/eco/EcoNavbar';
import { EcoFooter } from '@/components/eco/EcoFooter';
import { LifecycleTimeline } from '@/components/eco/LifecycleTimeline';
import { StatusBadge } from '@/components/eco/StatusBadge';
import { CreditBalance } from '@/components/eco/CreditBalance';
import { BlockchainRecord } from '@/components/eco/BlockchainRecord';
import { TransactionLink } from '@/components/eco/TransactionLink';
import {
  ShieldCheck,
  Flame,
  ArrowRight,
  ExternalLink,
  Layers,
  FileCheck,
  Sparkles,
  TreeDeciduous,
  Satellite,
  UserCheck
} from 'lucide-react';

interface CreditProvenancePageProps {
  params: Promise<{ id: string }>;
}

export default async function CreditProvenancePage({ params }: CreditProvenancePageProps) {
  const { id } = await params;

  const credit = getCreditData(id);

  const provenanceSteps = [
    {
      title: 'Project Inception',
      sublabel: 'Mangrove Restoration — Gujarat',
      desc: '42.7 ha registered coastal parcel under Gujarat Coastal Ecology Commission',
      icon: TreeDeciduous,
      href: `/projects/${credit.projectId}#project`,
      status: 'VERIFIED'
    },
    {
      title: 'MRV Evidence',
      sublabel: 'Satellite & Drone Orthomosaics',
      desc: '3.0m ground resolution, +21.57% net growth, SHA-256 integrity hash attested',
      icon: Satellite,
      href: `/projects/${credit.projectId}#evidence`,
      status: 'VERIFIED'
    },
    {
      title: 'Carbon Claim & ML',
      sublabel: '120.0 tCO₂e Conservative Claim',
      desc: 'UNet bi-temporal model confirmed 125.7 tCO₂e; low anomaly risk score (0.08)',
      icon: FileCheck,
      href: `/projects/${credit.projectId}#ml`,
      status: 'VERIFIED'
    },
    {
      title: 'Auditor Approval',
      sublabel: '2/3 Multi-Party Quorum',
      desc: 'Independent certifications by Bureau Veritas & DNV GL satisfying smart contract threshold',
      icon: UserCheck,
      href: `/auditor/claims/CL-1024`,
      status: 'APPROVED'
    },
    {
      title: 'ERC-1155 Issuance',
      sublabel: 'Production Token #1 Minted',
      desc: '1,000 tCO₂e issued on Ethereum Sepolia with 15% automatic buffer reserve lock',
      icon: Layers,
      href: `#blockchain-record`,
      status: 'ACTIVE'
    },
    {
      title: 'Ownership & Custody',
      sublabel: 'Institutional Wallets',
      desc: 'Custody held by project generator, transferred to verified corporate buyer',
      icon: ShieldCheck,
      href: `#history`,
      status: 'TRANSFERRED'
    },
    {
      title: 'Partial Retirement',
      sublabel: '25.0 tCO₂e Offset',
      desc: 'Permanently burned to null address; generated auditable Certificate RC-2026-00421',
      icon: Flame,
      href: `/retirements/RC-2026-00421`,
      status: 'RETIRED'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b09] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950 transition-colors">
      <EcoNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Link href="/credits/CC-001" className="text-emerald-700 dark:text-emerald-400 hover:underline">
              Carbon Credits
            </Link>
            <span>/</span>
            <span className="text-neutral-900 dark:text-neutral-200">Credit #{credit.creditId}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-500 dark:text-neutral-400">Token Standard:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">ERC-1155 Semi-Fungible</span>
          </div>
        </div>

        {/* Credit Header */}
        <div className="relative rounded-3xl bg-white dark:bg-[#0c1410] border border-emerald-200 dark:border-emerald-950/70 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                  CARBON CREDIT
                </span>
                <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                  Credit #{credit.creditId}
                </span>
                <StatusBadge status="ACTIVE" variant="ACTIVE" />
                <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                  Vintage {credit.vintage}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                {credit.projectName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                <div>
                  <span className="text-neutral-500">Origin Project:</span>{' '}
                  <Link
                    href={`/projects/${credit.projectId}`}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    {credit.projectId}
                  </Link>
                </div>
                <span className="text-neutral-400 dark:text-neutral-600">•</span>
                <div>
                  <span className="text-neutral-500">Token ID:</span> #{credit.tokenId}
                </div>
                <span className="text-neutral-400 dark:text-neutral-600">•</span>
                <div>
                  <span className="text-neutral-500">Methodology:</span> {credit.methodology}
                </div>
              </div>
            </div>

            {/* Quick Action Button to Retirement Certificate */}
            <div className="shrink-0 space-y-2">
              <Link
                href="/retirements/RC-2026-00421"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 dark:shadow-emerald-950 transition group"
              >
                <span>View Retirement Certificate</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 text-right">
                Offset: 25.000 tCO₂e Retired
              </div>
            </div>
          </div>
        </div>

        {/* Reusable Lifecycle Timeline (Current: Issuance / Ownership) */}
        <LifecycleTimeline currentStage="issuance" />

        {/* Credit Balance Distribution Card */}
        <section>
          <CreditBalance
            issued={credit.issuedTco2e}
            available={credit.availableTco2e}
            retired={credit.retiredTco2e}
            reserve={credit.reserveTco2e}
            vintage={credit.vintage}
            methodology={credit.methodology}
            tokenId={credit.tokenId}
          />
        </section>

        {/* PROVENANCE CHAIN — THE VISUAL CENTERPIECE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                End-to-End Traceability
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-sans mt-0.5">
                Complete Carbon Credit Provenance Chain
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              Auditable from Seed to Burn
            </span>
          </div>

          <div className="bg-white dark:bg-[#0c1410] border border-emerald-200 dark:border-emerald-950/70 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-emerald-200 dark:before:bg-emerald-900/60 before:h-full">
              {provenanceSteps.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div key={idx} className="relative flex items-start gap-4 group">
                    {/* Circle Node */}
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 z-10 shadow-md group-hover:scale-105 group-hover:border-emerald-500 transition-all">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Step Card Content */}
                    <div className="flex-1 p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/50 border border-emerald-100 dark:border-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                            0{idx + 1}.
                          </span>
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-sans">
                            {step.title}
                          </h3>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            ({step.sublabel})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={step.status} size="sm" />
                          <Link
                            href={step.href}
                            className="text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition p-1"
                            title="Inspect stage"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>

                      <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BLOCKCHAIN RECORD */}
        <section id="blockchain-record" className="space-y-4">
          <BlockchainRecord
            network={credit.blockchain.network}
            contractAddress={credit.blockchain.contractAddress}
            tokenId={credit.tokenId}
            txHash={credit.blockchain.mintTxHash}
            blockNumber={credit.blockchain.blockNumber}
            status={credit.blockchain.statusText}
            explorerUrl={credit.blockchain.explorerUrl}
          />
        </section>

        {/* OWNERSHIP & TRANSACTION HISTORY (AUDIT TRAIL) */}
        <section id="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                Custodial Audit Log
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-sans mt-0.5">
                Ownership &amp; Transfer History
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              Immutable Ledger Events
            </span>
          </div>

          <div className="bg-white dark:bg-[#0c1410] border border-emerald-200 dark:border-emerald-950/70 rounded-2xl p-6 shadow-xl space-y-4">
            {credit.history.map((event, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-emerald-100 dark:border-emerald-950/40 space-y-2 hover:border-emerald-300 dark:hover:border-emerald-800/40 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        event.step === 'PARTIALLY_RETIRED'
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : event.step === 'ISSUED'
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : 'bg-amber-500 dark:bg-amber-400'
                      }`}
                    />
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white font-sans">
                      {event.title}
                    </h4>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {event.amount} tCO₂e
                    </span>
                  </div>

                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {event.date}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 pt-1">
                  <div>
                    <span className="text-neutral-500 uppercase text-[10px] block">From:</span>
                    <span className="truncate block text-neutral-800 dark:text-neutral-300">{event.from}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase text-[10px] block">To:</span>
                    <span className="truncate block text-neutral-800 dark:text-neutral-300">{event.to}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-900 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 text-[11px]">Tx Hash:</span>
                    <TransactionLink hash={event.txHash} network="sepolia" />
                  </div>

                  {event.certificateId && (
                    <Link
                      href={`/retirements/${event.certificateId}`}
                      className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <span>Certificate #{event.certificateId}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA to Retirement Certificate */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-white dark:from-emerald-950/80 dark:via-[#0c1410] dark:to-[#0c1410] border border-emerald-200 dark:border-emerald-800/50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-mono uppercase font-semibold tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Next Demo Lifecycle Step</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-sans mt-1">
              Inspect Formal Carbon Retirement Certificate
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-xl">
              25.000 tCO₂e was permanently retired by VanaDhara Global Holdings for Scope 1 &amp; 2 ESG compliance.
              Inspect the official certificate and public verification QR proof.
            </p>
          </div>

          <Link
            href="/retirements/RC-2026-00421"
            className="shrink-0 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold font-mono tracking-wider uppercase transition shadow-lg shadow-emerald-950"
          >
            Open Certificate #RC-2026-00421 →
          </Link>
        </div>
      </main>

      <EcoFooter />
    </div>
  );
}
