import React from 'react';
import Link from 'next/link';
import { Leaf, ShieldCheck, ExternalLink } from 'lucide-react';

export function EcoFooter() {
  return (
    <footer className="w-full bg-white dark:bg-[#070b09] border-t border-emerald-100 dark:border-emerald-950/80 text-neutral-600 dark:text-neutral-400 py-10 px-4 sm:px-6 lg:px-8 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-sm">
            <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>VanaDhara Ecosystem</span>
          </div>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400 text-xs max-w-md">
            Verifiable Carbon Credit &amp; Offset Tracking System with multi-party auditor consensus and
            cryptographic blockchain permanence on Ethereum Sepolia.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
          <Link href="/projects/MRV-2026-001" className="hover:text-emerald-600 dark:hover:text-emerald-300 transition">
            MRV Project
          </Link>
          <Link href="/auditor/claims/CL-1024" className="hover:text-emerald-600 dark:hover:text-emerald-300 transition">
            Auditor Quorum
          </Link>
          <Link href="/credits/CC-001" className="hover:text-emerald-600 dark:hover:text-emerald-300 transition">
            Credit Provenance
          </Link>
          <Link href="/retirements/RC-2026-00421" className="hover:text-emerald-600 dark:hover:text-emerald-300 transition">
            Retirement Certificate
          </Link>
          <Link href="/verify/RC-2026-00421" className="hover:text-emerald-600 dark:hover:text-emerald-300 transition">
            Public Verifier
          </Link>
        </div>

        <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
          Smart Contract Suite v2.0 • ERC-1155 Anchored
        </div>
      </div>
    </footer>
  );
}
