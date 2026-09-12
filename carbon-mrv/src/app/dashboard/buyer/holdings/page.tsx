'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';

export default function HoldingsPage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retiringId, setRetiringId] = useState<string | null>(null);
  const [retirementReason, setRetirementReason] = useState('Corporate Scope 1 & 2 ESG Net-Zero Offsetting');
  const [message, setMessage] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/demo');
      const data = await res.json();
      if (data.success) {
        // Credits owned by buyer: either SOLD (active custody) or RETIRED
        const owned = (data.credits || []).filter(
          (c: any) => c.status === 'SOLD' || c.status === 'RETIRED'
        );
        setCredits(owned);
      }
    } catch (err) {
      console.error('Failed to load holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleRetire = async (creditId: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retire_credit',
          creditId,
          retirementReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retirement failed');

      setMessage(`Credit permanently retired on blockchain! Invariant enforced: token locked against double-counting.`);
      setRetiringId(null);
      await fetchCredits();
    } catch (err: any) {
      setMessage(`Retirement error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👛</span>
              <h1 className="text-2xl font-bold tracking-tight">Corporate Carbon Holdings & Retirement</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Custody management for tokenized blue carbon credits and immutable ESG retirement execution.
            </p>
          </div>
          <Link
            href="/dashboard/buyer/marketplace"
            className="px-4 py-2 rounded-xl border text-xs font-medium hover:bg-muted transition"
          >
            ← Back to Marketplace
          </Link>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-medium">
            {message}
          </div>
        )}

        {/* Holdings List */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="animate-spin text-2xl mb-2">🔄</div>
            Loading portfolio holdings...
          </div>
        ) : credits.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center space-y-3">
            <div className="text-3xl">💼</div>
            <h3 className="font-bold text-lg">No Carbon Credits in Custody</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You have not purchased any verified blue carbon credits yet. Browse the marketplace to acquire tokens.
            </p>
            <Link
              href="/dashboard/buyer/marketplace"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500"
            >
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {credits.map((credit) => (
              <div
                key={credit.id}
                className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Token #{credit.onchainCreditId}
                    </span>
                    <h3 className="font-bold text-base text-foreground">
                      {credit.parcel?.parcelName || 'Mangrove Conservation Reserve'}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        credit.status === 'RETIRED'
                          ? 'bg-neutral-800 text-neutral-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {credit.status === 'RETIRED' ? 'PERMANENTLY RETIRED' : 'ACTIVE CUSTODY'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                    <div>
                      Volume: <span className="font-bold text-foreground">{credit.amount} tCO2e</span>
                    </div>
                    <div>
                      Vintage: <span className="font-bold text-foreground">{credit.vintage}</span>
                    </div>
                    <div>
                      Additionality: <span className="font-bold text-amber-500">AAA (Sylvera)</span>
                    </div>
                  </div>

                  {credit.retiredReason && (
                    <div className="text-xs text-amber-500/90 italic pt-1">
                      Retirement Purpose: "{credit.retiredReason}"
                    </div>
                  )}

                  <div className="text-[11px] text-muted-foreground font-mono truncate max-w-lg">
                    Blockchain Hash: {credit.blockchainTxHash}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {credit.status === 'SOLD' ? (
                    retiringId === credit.id ? (
                      <div className="p-3 bg-muted/50 border rounded-xl space-y-2 text-xs w-full md:w-80">
                        <label className="font-semibold block text-foreground">
                          Corporate Retirement Purpose
                        </label>
                        <input
                          type="text"
                          value={retirementReason}
                          onChange={(e) => setRetirementReason(e.target.value)}
                          className="w-full bg-background border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setRetiringId(null)}
                            className="px-2.5 py-1 rounded border text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRetire(credit.id)}
                            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                          >
                            Confirm Burn & Retire
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRetiringId(credit.id)}
                        className="w-full md:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow"
                      >
                        Retire for Net-Zero Offset
                      </button>
                    )
                  ) : (
                    <Link
                      href={`/verify/${credit.onchainCreditId}`}
                      className="w-full md:w-auto px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>📜</span> Public Certificate ↗
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
