'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';

export default function MarketplacePage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/demo');
      const data = await res.json();
      if (data.success) {
        setCredits(data.credits || []);
      }
    } catch (err) {
      console.error('Failed to load marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handlePurchase = async (creditId: string) => {
    setPurchasingId(creditId);
    setMessage(null);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'buy_credit',
          creditId,
          buyerWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purchase failed');

      setMessage(`Credit purchased successfully! On-chain custody transferred. Tx: ${data.txHash.substring(0, 18)}...`);
      await fetchCredits();
    } catch (err: any) {
      setMessage(`Purchase failed: ${err.message}`);
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <h1 className="text-2xl font-bold tracking-tight">Verified Blue Carbon Marketplace</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Browse and acquire on-chain tokenized carbon credits with verified PyTorch UAV canopy allometry.
            </p>
          </div>
          <Link
            href="/dashboard/buyer/holdings"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm w-fit transition flex items-center gap-1.5"
          >
            <span>👛</span> View My Holdings
          </Link>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium">
            {message}
          </div>
        )}

        {/* Marketplace Grid */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="animate-spin text-2xl mb-2">🔄</div>
            Loading marketplace credits...
          </div>
        ) : credits.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center space-y-2">
            <div className="text-3xl">🌱</div>
            <h3 className="font-bold text-lg">No Credits Listed Yet</h3>
            <p className="text-sm text-muted-foreground">
              Once an Approver audits and approves submitted parcels, tokenized credits will appear here for purchase.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credits.map((credit) => (
              <div
                key={credit.id}
                className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        Token #{credit.onchainCreditId}
                      </span>
                      <h3 className="font-bold text-base text-foreground mt-2">
                        {credit.parcel?.parcelName || 'Blue Carbon Conservation Reserve'}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        credit.status === 'RETIRED'
                          ? 'bg-neutral-800 text-neutral-400'
                          : credit.status === 'SOLD'
                          ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {credit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t text-xs">
                    <div>
                      <span className="text-muted-foreground block">Vintage:</span>
                      <span className="font-bold text-foreground">{credit.vintage}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Rating:</span>
                      <span className="font-bold text-amber-500">AAA (Sylvera)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Volume:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {credit.amount} tCO2e
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Price:</span>
                      <span className="font-bold text-foreground text-sm">$35.00 / t</span>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-muted-foreground font-mono truncate">
                    EVM Tx: {credit.blockchainTxHash}
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between gap-3">
                  <Link
                    href={`/verify/${credit.onchainCreditId}`}
                    className="px-3 py-2 rounded-xl border text-xs font-medium hover:bg-muted transition"
                  >
                    View Audit
                  </Link>

                  {credit.status === 'ISSUED' ? (
                    <button
                      onClick={() => handlePurchase(credit.id)}
                      disabled={purchasingId === credit.id}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1 shadow"
                    >
                      {purchasingId === credit.id ? (
                        <>
                          <span className="animate-spin">🔄</span> Processing...
                        </>
                      ) : (
                        <>
                          <span>💳</span> Purchase (${(credit.amount * 35).toLocaleString()})
                        </>
                      )}
                    </button>
                  ) : credit.status === 'SOLD' ? (
                    <Link
                      href="/dashboard/buyer/holdings"
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs"
                    >
                      Retire Token →
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Permanently Retired</span>
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
