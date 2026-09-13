import React from 'react';
import Link from 'next/link';
import { EcoNavbar } from '@/components/eco/EcoNavbar';
import { EcoFooter } from '@/components/eco/EcoFooter';
import { LifecycleTimeline } from '@/components/eco/LifecycleTimeline';
import { StatusBadge } from '@/components/eco/StatusBadge';
import {
  Leaf,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Satellite,
  UserCheck,
  Award,
  ExternalLink,
  Lock,
  TreeDeciduous,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const demoPages = [
    {
      num: '01',
      title: 'Project & MRV Detail',
      route: '/projects/MRV-2026-001',
      badge: 'Origin',
      headline: 'Mangrove Restoration — Gujarat',
      desc: 'Satellite observation (42.7 ha, +21.57% canopy delta) with SHA-256 integrity hash anchoring and UNet biomass estimation (125.7 tCO₂e).',
      tag: 'MRV Evidence'
    },
    {
      num: '02',
      title: 'Auditor Review & Quorum',
      route: '/auditor/claims/CL-1024',
      badge: 'Governance',
      headline: '2-of-3 Multi-Party Consensus',
      desc: 'Independent certifications from Bureau Veritas, DNV GL, and TÜV SÜD enforcing anti-self-approval before minting authorization.',
      tag: 'Auditor Quorum'
    },
    {
      num: '03',
      title: 'Credit Provenance Chain',
      route: '/credits/CC-001',
      badge: 'Issuance',
      headline: 'ERC-1155 Token #1 (1,000 tCO₂e)',
      desc: 'End-to-end audit trail on Ethereum Sepolia with 15% automatic allocation to the non-permanence risk buffer pool.',
      tag: 'Blockchain Anchor'
    },
    {
      num: '04',
      title: 'Retirement Certificate',
      route: '/retirements/RC-2026-00421',
      badge: 'Offset',
      headline: 'Certificate #RC-2026-00421',
      desc: 'Official certificate for 25.000 tCO₂e permanently retired by EcoTech Global Holdings for corporate net-zero compliance.',
      tag: 'Printable Certificate'
    },
    {
      num: '05',
      title: 'Public Zero-Auth Verifier',
      route: '/verify/RC-2026-00421',
      badge: 'Trust',
      headline: 'Instant 10-Second Validation',
      desc: 'Zero-authentication public verification demonstrating 7 of 7 cryptographic invariant checks and on-chain burn confirmation.',
      tag: 'Public Proof'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b09] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <EcoNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Hero Section */}
        <section className="relative rounded-3xl bg-gradient-to-b from-[#0c1410] via-[#09100d] to-[#070b09] border border-emerald-950/70 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Circular Carbon Ecosystem • Live on Ethereum Sepolia</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-sans leading-tight">
              Verifiable Carbon Credit &amp; Offset Tracking System
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              Tracking carbon credits end-to-end: from satellite biophysical observation,
              ML anomaly verification, and 2-of-3 auditor quorum to semi-fungible ERC-1155 issuance,
              partial retirement, and instant public verification.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/projects/MRV-2026-001"
                className="px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-bold font-mono tracking-wider uppercase transition shadow-xl shadow-emerald-950/80 flex items-center gap-2 group"
              >
                <span>Launch Demo Journey</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/verify/RC-2026-00421"
                className="px-6 py-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm font-semibold transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Public Verifier</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Global Lifecycle Bar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
              End-to-End Demonstration Architecture
            </span>
            <span className="text-xs font-mono text-neutral-400">5 Primary Milestones</span>
          </div>
          <LifecycleTimeline currentStage="evidence" />
        </section>

        {/* The 5 Primary Demonstration Pages Cards */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
                Demonstration Flow
              </span>
              <h2 className="text-2xl font-bold text-white font-sans mt-0.5">
                The 5 Core Lifecycle Screens
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              One Unified Project: Mangrove Restoration — Gujarat
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoPages.map((p) => (
              <Link
                key={p.num}
                href={p.route}
                className="group relative bg-[#0c1410] border border-emerald-950/70 hover:border-emerald-700/80 rounded-2xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      PAGE {p.num}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors font-sans">
                    {p.title}
                  </h3>

                  <div className="text-xs font-mono text-neutral-300 font-medium">
                    {p.headline}
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-950/50 flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400/80">{p.tag}</span>
                  <span className="text-white group-hover:text-emerald-300 inline-flex items-center gap-1 font-semibold">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}

            {/* Quick Summary Card */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-[#0c1410] border border-emerald-800/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Trust &amp; Integrity</span>
                </div>

                <h3 className="text-lg font-bold text-white font-sans">
                  The Blockchain is the Trust Layer
                </h3>

                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  Our system keeps complex crypto jargon secondary. Buyers and auditors interact with
                  clear, verifiable carbon accounting backed by Ethereum Sepolia smart contracts.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-950/50">
                <Link
                  href="/projects/MRV-2026-001"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono tracking-wider uppercase transition text-center block"
                >
                  Start Demo at Page 1 →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EcoFooter />
    </div>
  );
}
