'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, ShieldCheck, ExternalLink, ChevronDown, CheckCircle2 } from 'lucide-react';

export function EcoNavbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Explorer', href: '/verify/RC-2026-00421', desc: 'Public Verifier' },
    { label: 'Projects', href: '/projects/MRV-2026-001', desc: 'MRV Evidence' },
    { label: 'Credits', href: '/credits/CC-001', desc: 'Credit Provenance' },
    { label: 'Auditor', href: '/auditor/claims/CL-1024', desc: 'Consensus Review' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080d0a]/90 backdrop-blur-md border-b border-emerald-950/80 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/projects/MRV-2026-001" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-neutral-950 shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <Leaf className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Circular Carbon
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                Registry 2.0
              </span>
            </div>
          </Link>
        </div>

        {/* Primary Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href.split('?')[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-inner'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Testnet Network Badge + Demo Flow Shortcut */}
        <div className="flex items-center gap-3">
          {/* Network Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-[11px] font-mono text-emerald-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Ethereum Sepolia</span>
            <span className="sm:hidden">Sepolia</span>
          </div>

          {/* Direct link to Retirement Certificate */}
          <Link
            href="/retirements/RC-2026-00421"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition"
          >
            <span>Certificate</span>
          </Link>

          {/* Existing Dashboard Link */}
          <Link
            href="/dashboard/overview"
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition shadow"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-emerald-950/60 bg-[#080d0a]/95 py-2 px-3 text-xs">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href.split('?')[0]);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] ${
                isActive
                  ? 'bg-emerald-950 text-emerald-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
