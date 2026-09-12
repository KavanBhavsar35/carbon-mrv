'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';

export default function ParcelsPage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParcels = async () => {
    try {
      const res = await fetch('/api/parcels');
      const data = await res.json();
      if (data.success) {
        setParcels(data.parcels || []);
      }
    } catch (err) {
      console.error('Failed to fetch parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌱</span>
              <h1 className="text-2xl font-bold tracking-tight">My Land Parcels</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Registered mangrove and coastal blue carbon ecosystems submitted for MRV verification.
            </p>
          </div>
          <Link
            href="/dashboard/generator/parcels/new"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 w-fit transition"
          >
            <span>+</span> Register New Parcel
          </Link>
        </div>

        {/* Parcels Table / List */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="animate-spin text-2xl mb-2">🔄</div>
            Loading parcels from database...
          </div>
        ) : parcels.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center space-y-3">
            <div className="text-4xl">🌾</div>
            <h3 className="font-bold text-lg">No Land Parcels Registered Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Start generating verifiable blue carbon credits by registering your first mangrove or coastal conservation plot.
            </p>
            <Link
              href="/dashboard/generator/parcels/new"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
            >
              Register Parcel Now
            </Link>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Parcel Name</th>
                    <th className="px-6 py-3.5 font-semibold">Ecosystem</th>
                    <th className="px-6 py-3.5 font-semibold">Area (Ha)</th>
                    <th className="px-6 py-3.5 font-semibold">Claimed Carbon</th>
                    <th className="px-6 py-3.5 font-semibold">Verified Credits</th>
                    <th className="px-6 py-3.5 font-semibold">Review Status</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parcels.map((parcel) => (
                    <tr key={parcel.id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{parcel.parcelName}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          ID: {parcel.id.substring(0, 10)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                          {parcel.ecosystemType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">{parcel.totalAreaHa} ha</td>
                      <td className="px-6 py-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {parcel.claimedCredits} tCO2e
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        {parcel.totalCreditsIssued > 0 ? (
                          <span className="text-emerald-600 font-bold dark:text-emerald-400">
                            {parcel.totalCreditsIssued} tCO2e
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Pending Audit</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                            parcel.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : parcel.status === 'REJECTED'
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {parcel.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {parcel.status === 'APPROVED' && parcel.credits?.length > 0 ? (
                          <Link
                            href={`/verify/${parcel.credits[0].onchainCreditId}`}
                            className="text-xs px-2.5 py-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-cyan-600 dark:text-cyan-400 font-medium"
                          >
                            Certificate ↗
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">In Review Queue</span>
                        )}
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
