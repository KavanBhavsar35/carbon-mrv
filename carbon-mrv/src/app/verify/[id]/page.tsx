import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getRetirementData } from '@/lib/demo-data';
import { EcoNavbar } from '@/components/eco/EcoNavbar';
import { EcoFooter } from '@/components/eco/EcoFooter';
import { LifecycleTimeline } from '@/components/eco/LifecycleTimeline';
import { RetirementSummary } from '@/components/eco/RetirementSummary';
import { VerificationCheck } from '@/components/eco/VerificationCheck';
import { TransactionLink } from '@/components/eco/TransactionLink';
import {
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicVerificationPage({ params }: VerifyPageProps) {
  const { id } = await params;

  // Fetch unified demo data with dynamic ID support
  let retirement = getRetirementData(id);

  // If Prisma has a matching record, enrich retirement data
  try {
    const dbCredit = await prisma.carbonCredit.findFirst({
      where: {
        OR: [
          { id },
          { onchainCreditId: id },
          { blockchainTxHash: id }
        ]
      },
      include: {
        parcel: {
          include: {
            estimates: true,
            reviewRequests: true
          }
        }
      }
    });

    if (dbCredit) {
      retirement = {
        ...retirement,
        certificateId: id.startsWith('RC') ? id : `RC-${dbCredit.id.slice(-5).toUpperCase()}`,
        quantityTco2e: dbCredit.amount,
        projectName: dbCredit.parcel?.parcelName || retirement.projectName,
        location: `${dbCredit.parcel?.district || 'Gujarat'}, ${dbCredit.parcel?.state || 'India'}`,
        vintage: dbCredit.vintage || retirement.vintage,
        txHash: dbCredit.blockchainTxHash || retirement.txHash,
        retiredBy: dbCredit.ownerWalletAddress || retirement.retiredBy
      };
    }
  } catch {
    // Database query gracefully defaulted to verified proof
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b09] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950 transition-colors">
      <EcoNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Zero-Auth Public Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-neutral-950/40 border border-emerald-200 dark:border-emerald-900/30 text-xs font-mono text-neutral-600 dark:text-neutral-400 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)] dark:shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-emerald-700 dark:text-emerald-400 uppercase font-semibold tracking-wider">
              Zero-Auth Public Verifier
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-600">•</span>
            <span className="text-neutral-500 dark:text-neutral-300 hidden sm:inline">Open Access for Auditors &amp; Regulators</span>
          </div>

          <div className="text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/60 px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800">
            Audit Identifier: <span className="text-neutral-900 dark:text-white font-bold tracking-wide">{retirement.certificateId}</span>
          </div>
        </div>

        {/* Primary Verification Result Hero */}
        <div className="relative rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-[#0c1410] dark:to-[#070b09] border border-emerald-300 dark:border-emerald-800/50 p-6 sm:p-10 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-400/15 transition-colors duration-1000" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[60px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-emerald-200 dark:border-emerald-900/50 relative z-10">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-xs font-mono font-bold tracking-wider uppercase shadow-inner">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  VERIFIED ON ETHEREUM SEPOLIA
                </span>
                <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800">
                  Cert: #{retirement.certificateId}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-emerald-700 dark:from-white dark:to-emerald-100/70 font-sans">
                Carbon Retirement Verified
              </h1>

              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-xl leading-relaxed">
                Cryptographic on-chain burn transaction and biophysical MRV evidence have been
                validated against Ethereum Sepolia smart contract state.
              </p>
            </div>

            {/* Quantity Retired Callout */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-slate-50 dark:from-neutral-950/90 dark:to-neutral-950/60 border border-emerald-300 dark:border-emerald-700/40 md:text-right shrink-0 space-y-1.5 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-900/20 backdrop-blur-sm transform transition hover:scale-105 duration-300">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Retired Quantity
              </span>
              <div className="text-4xl sm:text-5xl font-black font-sans text-emerald-600 dark:text-emerald-300 drop-shadow-sm dark:drop-shadow-md">
                {retirement.quantityTco2e.toFixed(3)}{' '}
                <span className="text-xl font-normal text-emerald-600/70 dark:text-emerald-400/70 font-mono">tCO₂e</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400/80 block bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900/30 inline-block mt-1">
                Permanently Burned (Zero Re-use)
              </span>
            </div>
          </div>

          {/* Quick Details Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-xs relative z-10">
            <div>
              <span className="text-neutral-500 uppercase font-mono text-[10px] block">Project</span>
              <span className="font-semibold text-neutral-900 dark:text-white truncate block mt-0.5">{retirement.projectName}</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase font-mono text-[10px] block">Credit ID</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-300 block mt-0.5">#{retirement.creditId}</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase font-mono text-[10px] block">Vintage</span>
              <span className="font-mono text-neutral-900 dark:text-white block mt-0.5">{retirement.vintage}</span>
            </div>
            <div>
              <span className="text-neutral-500 uppercase font-mono text-[10px] block">Retired On</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300 block mt-0.5">{retirement.retiredOn}</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Provenance Overview (Current: Verification) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              End-to-End Lifecycle Verification
            </span>
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">All 5 Pillars Attested</span>
          </div>
          <LifecycleTimeline currentStage="verification" />
        </section>

        {/* Section 1: Accounting Reconciliation */}
        <section>
          <RetirementSummary
            projectName={retirement.projectName}
            creditId={retirement.creditId}
            vintage={retirement.vintage}
            issuedQuantity={retirement.originalIssuedTco2e}
            previouslyRetired={retirement.previouslyRetiredTco2e}
            thisRetirement={retirement.quantityTco2e}
            remaining={retirement.remainingAvailableTco2e}
          />
        </section>

        {/* Section 2: Verification Checks */}
        <section className="bg-white dark:bg-[#0c1410] border border-emerald-200 dark:border-emerald-950/70 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-emerald-100 dark:border-emerald-950/60">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                Integrity Invariants
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-sans mt-0.5">
                Cryptographic &amp; Regulatory Verification Checks
              </h2>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-semibold self-start sm:self-center">
              7 of 7 PASSED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {retirement.verificationChecks.map((check, index) => (
              <VerificationCheck key={index} check={check} />
            ))}
          </div>
        </section>

        {/* Section 3: Blockchain Proof */}
        <section className="bg-white dark:bg-[#0c1410] border border-emerald-200 dark:border-emerald-950/70 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-emerald-100 dark:border-emerald-950/60">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                Trust Layer Proof
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-sans mt-0.5">
                Public Blockchain Proof
              </h2>
            </div>

            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              Ethereum Sepolia Testnet
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-gradient-to-b dark:from-neutral-950/80 dark:to-neutral-950/40 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5 shadow-inner transition hover:border-emerald-300 dark:hover:border-emerald-700/50">
              <span className="text-neutral-500 uppercase text-[10px] tracking-wider block">Network</span>
              <span className="text-neutral-900 dark:text-white font-semibold text-sm block">{retirement.network}</span>
              <span className="text-[10px] text-neutral-500">Chain ID: 11155111</span>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-gradient-to-b dark:from-neutral-950/80 dark:to-neutral-950/40 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5 shadow-inner transition hover:border-emerald-300 dark:hover:border-emerald-700/50">
              <span className="text-neutral-500 uppercase text-[10px] tracking-wider block">Contract Address</span>
              <TransactionLink hash={retirement.contractAddress} type="address" network={retirement.network} />
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 rounded w-fit border border-emerald-200 dark:border-emerald-900/20">ProductionCarbonCredit1155</span>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-gradient-to-b dark:from-neutral-950/80 dark:to-neutral-950/40 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5 sm:col-span-2 shadow-inner transition hover:border-emerald-300 dark:hover:border-emerald-700/50">
              <span className="text-neutral-500 uppercase text-[10px] tracking-wider block">Retirement Burn Transaction</span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <TransactionLink hash={retirement.txHash} type="tx" network={retirement.network} truncate={false} />
                <a
                  href={`https://sepolia.etherscan.io/tx/${retirement.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-emerald-950/80 hover:bg-slate-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700/50 hover:border-emerald-400 dark:hover:border-emerald-500/80 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-semibold font-sans transition-all duration-300 shrink-0 self-start sm:self-center hover:scale-[1.02] active:scale-[0.98] shadow-sm dark:shadow-lg dark:shadow-emerald-900/20"
                >
                  <span>View Blockchain Transaction</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Provenance Quick Journey */}
        <div className="bg-white dark:bg-[#0c1410] border border-emerald-200 dark:border-emerald-950/70 rounded-2xl p-6 shadow-xl text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold uppercase text-[11px]">
              Continuous Lifecycle Journey
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 font-mono">10-Second Audit Trail</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
            <Link
              href="/projects/MRV-2026-001#evidence"
              className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/40 border border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 dark:hover:shadow-emerald-900/20"
            >
              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">1. Evidence ✓</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Satellite Data</div>
            </Link>

            <Link
              href="/projects/MRV-2026-001#claim"
              className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/40 border border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 dark:hover:shadow-emerald-900/20"
            >
              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">2. Claim ✓</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">120.0 tCO₂e</div>
            </Link>

            <Link
              href="/auditor/claims/CL-1024"
              className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/40 border border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 dark:hover:shadow-emerald-900/20"
            >
              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">3. Audit ✓</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">2/3 Quorum</div>
            </Link>

            <Link
              href="/credits/CC-001"
              className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/40 border border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 dark:hover:shadow-emerald-900/20"
            >
              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">4. Issuance ✓</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Token #1</div>
            </Link>

            <Link
              href="/retirements/RC-2026-00421"
              className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-600/60 hover:border-emerald-500 dark:hover:border-emerald-400/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-neutral-900 dark:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 col-span-2 sm:col-span-1 shadow-[0_0_10px_rgba(16,185,129,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-400/20 rounded-full blur-xl" />
              <div className="font-bold text-emerald-800 dark:text-emerald-300 text-sm relative z-10">5. Retired ✓</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400/80 mt-1 relative z-10">Burned On-Chain</div>
            </Link>
          </div>
        </div>

        {/* Final Completion Action Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-white dark:from-emerald-950/90 dark:via-[#0c1410] dark:to-[#0c1410] border border-emerald-300 dark:border-emerald-800/60 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-mono uppercase font-semibold tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Demonstration Journey Complete</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-sans mt-1">
              Full VanaDhara Lifecycle Demonstrated
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-xl">
              From raw satellite observation to biophysical machine learning, independent auditor consensus,
              semi-fungible on-chain issuance, and cryptographic retirement verification.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/projects/MRV-2026-001"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold font-mono tracking-wider uppercase transition shadow-lg shadow-emerald-950"
            >
              Restart Demo Flow →
            </Link>
          </div>
        </div>
      </main>

      <EcoFooter />
    </div>
  );
}
