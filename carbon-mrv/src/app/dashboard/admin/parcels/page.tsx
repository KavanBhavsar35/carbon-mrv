'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';

export default function AdminParcelsPage() {
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
      console.error('Failed to load admin parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h1 className="text-2xl font-bold tracking-tight">Admin: Master Land Parcel Registry</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Global administrative supervision of all registered blue carbon plots, generator submissions, and audit statuses.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading registry...</div>
        ) : parcels.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center space-y-2">
            <div className="text-3xl">🌾</div>
            <h3 className="font-bold text-lg">No Land Parcels Registered Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When generators submit mangrove parcels for verification, they will be tracked and audited here.
            </p>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Parcel Name</th>
                    <th className="px-6 py-3.5 font-semibold">Generator</th>
                    <th className="px-6 py-3.5 font-semibold">Ecosystem</th>
                    <th className="px-6 py-3.5 font-semibold">Area (Ha)</th>
                    <th className="px-6 py-3.5 font-semibold">Claimed</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parcels.map((parcel) => (
                    <tr key={parcel.id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {parcel.parcelName}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {parcel.generator?.organizationName || 'Coastal Trust'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-medium">
                          {parcel.ecosystemType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{parcel.totalAreaHa} ha</td>
                      <td className="px-6 py-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        {parcel.claimedCredits} tCO2e
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            parcel.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : parcel.status === 'REJECTED'
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {parcel.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/review/${parcel.id}`}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted text-indigo-500 transition"
                        >
                          Inspect Console →
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
