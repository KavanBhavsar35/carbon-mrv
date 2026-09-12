'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';

export default function RegisterLandParcelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [parcelName, setParcelName] = useState('');
  const [ecosystemType, setEcosystemType] = useState('MANGROVE');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [totalAreaHa, setTotalAreaHa] = useState('');
  const [claimedCredits, setClaimedCredits] = useState('');
  const [hasLegalPermits, setHasLegalPermits] = useState(false);

  // Geofence Coords
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const latitude = parseFloat(lat) || 21.945;
      const longitude = parseFloat(lng) || 88.892;
      const geofence = [
        { lat: latitude, lng: longitude },
        { lat: latitude + 0.015, lng: longitude + 0.012 },
        { lat: latitude + 0.01, lng: longitude + 0.025 },
        { lat: latitude - 0.005, lng: longitude + 0.018 }
      ];

      const res = await fetch('/api/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelName,
          ecosystemType,
          state,
          district,
          village,
          totalAreaHa: parseFloat(totalAreaHa),
          claimedCredits: parseFloat(claimedCredits),
          geofence,
          hasLegalPermits
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register land parcel');
      }

      router.push('/dashboard/generator/parcels');
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌱</span>
              <h1 className="text-2xl font-bold tracking-tight">Register New Blue Carbon Parcel</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Apply for high-integrity carbon credit issuance. Once registered, your parcel will be queued for Approver drone audit.
            </p>
          </div>
          <Link
            href="/dashboard/generator/parcels"
            className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition"
          >
            ← Back to Parcels
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/15 border border-destructive text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Section 1: Basic Details */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              1. Project Identification & Ecosystem
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Parcel / Project Name *</label>
                <input
                  type="text"
                  required
                  value={parcelName}
                  onChange={(e) => setParcelName(e.target.value)}
                  placeholder="e.g. Sundarbans Mangrove Reserve"
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Ecosystem Classification *</label>
                <select
                  value={ecosystemType}
                  onChange={(e) => setEcosystemType(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="MANGROVE">Mangrove Forest (Dense / Tidal)</option>
                  <option value="SEAGRASS">Seagrass Meadow (Sub-tidal)</option>
                  <option value="SALT_MARSH">Coastal Salt Marsh</option>
                  <option value="CORAL_REEF">Coral Reef Barrier</option>
                  <option value="KELP_FOREST">Kelp Forest Basin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Total Conservation Area (Hectares) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={totalAreaHa}
                  onChange={(e) => setTotalAreaHa(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Section 2: Location & GPS Geofence */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              2. Geographic Location & Geofence Bounds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1">State / Province *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">District / Region *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Village / Local Body *</label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">Reference Geofence Center (GPS)</span>
                <span className="text-muted-foreground">Coordinates will guide drone UAV flight path</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Latitude (° N)</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-background border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Longitude (° E)</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-background border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Section 3: Carbon Sequestration Claim */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              3. Carbon Sequestration Claim Volume
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Claimed Carbon Volume ($tCO_2e$) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={claimedCredits}
                  onChange={(e) => setClaimedCredits(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  The Approver will cross-verify this volume against PyTorch drone canopy allometry.
                </p>
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasLegalPermits}
                    onChange={(e) => setHasLegalPermits(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I confirm our organization holds lawful community land rights, conservation permits, and environmental clearances for this parcel.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex justify-end gap-3">
            <Link
              href="/dashboard/generator/parcels"
              className="px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-950/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">🔄</span> Submitting to Database...
                </>
              ) : (
                <>
                  <span>🌱</span> Register Parcel & Request Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
