'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';

export default function ReviewQueuePage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'AUDITED'>('PENDING');

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/parcels');
      const data = await res.json();
      if (data.success) {
        setParcels(data.parcels || []);
      }
    } catch (err) {
      console.error('Failed to fetch review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filteredParcels = parcels.filter(p => {
    if (filter === 'PENDING') return p.status === 'PENDING_REVIEW';
    if (filter === 'AUDITED') return p.status === 'APPROVED' || p.status === 'REJECTED';
    return true;
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h1 className="text-2xl font-bold tracking-tight">Approver Audit & Review Queue</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Independent verification console: Inspect applicant claims, upload drone UAV imagery, and run PyTorch U-Net baseline models.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border text-xs">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'PENDING' ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending Audit ({parcels.filter(p => p.status === 'PENDING_REVIEW').length})
            </button>
            <button
              onClick={() => setFilter('AUDITED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'AUDITED' ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Audited ({parcels.filter(p => p.status === 'APPROVED' || p.status === 'REJECTED').length})
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({parcels.length})
            </button>
          </div>
        </div>

        {/* Queue Content */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="animate-spin text-2xl mb-2">🔄</div>
            Loading audit queue...
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center space-y-2">
            <div className="text-3xl">✅</div>
            <h3 className="font-bold text-lg">No Parcels Pending Audit</h3>
            <p className="text-sm text-muted-foreground">
              All submitted generator land parcels have been evaluated and audited.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredParcels.map((parcel) => (
              <div
                key={parcel.id}
                className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                        {parcel.ecosystemType}
                      </span>
                      <h3 className="font-bold text-base text-foreground mt-1.5">
                        {parcel.parcelName}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        parcel.status === 'APPROVED'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : parcel.status === 'REJECTED'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {parcel.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs">
                    <div>
                      <span className="text-muted-foreground block">Area:</span>
                      <span className="font-bold text-foreground">{parcel.totalAreaHa} Hectares</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Claimed Credits:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {parcel.claimedCredits} tCO2e
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="text-muted-foreground font-mono">
                    ID: {parcel.id.substring(0, 10)}...
                  </span>
                  <Link
                    href={`/dashboard/review/${parcel.id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1"
                  >
                    <span>Inspect & Audit</span> →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
