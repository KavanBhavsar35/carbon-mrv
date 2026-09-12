'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';

export default function AdminCreditsPage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/demo');
      const data = await res.json();
      if (data.success) {
        setCredits(data.credits || []);
      }
    } catch (err) {
      console.error('Failed to load admin credits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h1 className="text-2xl font-bold tracking-tight">Admin: Master Carbon Credit Inventory</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Total lifecycle visibility into tokenized blue carbon credits across ISSUED, SOLD, and RETIRED states.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading credit inventory...</div>
        ) : credits.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center space-y-2">
            <div className="text-3xl">🌱</div>
            <h3 className="font-bold text-lg">No Carbon Credits Minted Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Once an approver validates and approves a parcel, minted on-chain credits will be listed here.
            </p>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Token ID</th>
                    <th className="px-6 py-3.5 font-semibold">Associated Parcel</th>
                    <th className="px-6 py-3.5 font-semibold">Volume (tCO2e)</th>
                    <th className="px-6 py-3.5 font-semibold">Vintage</th>
                    <th className="px-6 py-3.5 font-semibold">Custody Wallet</th>
                    <th className="px-6 py-3.5 font-semibold">State</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {credits.map((credit) => (
                    <tr key={credit.id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-4 font-mono font-bold text-cyan-500">
                        #{credit.onchainCreditId}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {credit.parcel?.parcelName || 'Mangrove Conservation Plot'}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {credit.amount} tCO2e
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{credit.vintage}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground truncate max-w-[150px]">
                        {credit.ownerWalletAddress}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            credit.status === 'RETIRED'
                              ? 'bg-neutral-800 text-neutral-400'
                              : credit.status === 'SOLD'
                              ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {credit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/verify/${credit.onchainCreditId}`}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted text-cyan-600 dark:text-cyan-400 transition"
                        >
                          Verify ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
