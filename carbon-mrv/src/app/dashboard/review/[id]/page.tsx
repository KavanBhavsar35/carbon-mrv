'use client';

import React, { useState, useEffect, use } from 'react';
import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuditParcelPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // ML State (Supports any number of uploaded UAV survey tiles)
  const [droneImages, setDroneImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [mlResult, setMlResult] = useState<any>(null);
  const [auditComments, setAuditComments] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Load parcel
  const fetchParcel = async () => {
    try {
      const res = await fetch('/api/parcels');
      const data = await res.json();
      if (data.success) {
        const found = (data.parcels || []).find((p: any) => p.id === id);
        setParcel(found);
        if (found?.estimates?.length > 0) {
          const latestEstimate = found.estimates[found.estimates.length - 1];
          setMlResult({
            vegetationCoverPct: latestEstimate.vegetationCoverPct,
            estimatedBiomass: latestEstimate.estimatedBiomass,
            estimatedCredits: latestEstimate.estimatedCredits,
            additionalityRating: 'AAA',
            bufferPoolCredits: (latestEstimate.estimatedCredits * 0.15).toFixed(2),
            netTradableCredits: (latestEstimate.estimatedCredits * 0.85).toFixed(2),
            riskLevel: latestEstimate.deltaPct > 25 ? 'HIGH' : 'LOW',
            anomalyScore: latestEstimate.deltaPct > 25 ? 0.78 : 0.05,
            modelVersion: latestEstimate.modelVersion,
            tilesProcessed: 6
          });
        }
      }
    } catch (err) {
      console.error('Failed to load parcel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcel();
  }, [id]);

  // Handle uploading any number of images from local PC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const readPromises = fileList.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) resolve(ev.target.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((base64Strings) => {
      setDroneImages((prev) => [...prev, ...base64Strings]);
      setShowPreview(true);
      setMessage(`Added ${base64Strings.length} survey image${base64Strings.length > 1 ? 's' : ''} to audit queue.`);
    });
    // Reset file input value to allow re-uploading the same files if needed
    e.target.value = '';
  };

  // Add image by URL
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setDroneImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
    setShowPreview(true);
  };

  // Remove individual image
  const handleRemoveImage = (indexToRemove: number) => {
    setDroneImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Run ML Model on all uploaded survey images
  const handleRunMl = async () => {
    if (droneImages.length === 0) {
      setMessage('Please upload or select at least one UAV drone survey image before running AI verification.');
      return;
    }

    setMlLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_parcel_and_estimate',
          parcelName: parcel?.parcelName || 'Audited Mangrove Plot',
          ecosystemType: parcel?.ecosystemType || 'MANGROVE',
          areaHa: parcel?.totalAreaHa || 15.0,
          claimedCredits: parcel?.claimedCredits || 120.0,
          source: 'DRONE',
          images: droneImages
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ML prediction failed');

      setMlResult(data.mlOutput);
      setMessage(`PyTorch Mangrove U-Net successfully analyzed all ${droneImages.length} aerial flight survey images in parallel batch!`);
    } catch (err: any) {
      console.error('ML inference error:', err);
      setMessage(`ML Inference Error: ${err.message || 'Check ML service connection'}`);
    } finally {
      setMlLoading(false);
    }
  };

  // Submit Audit Decision
  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    setAuditLoading(true);
    setMessage(null);

    try {
      const reviewId = parcel?.reviewRequests?.[0]?.id || `rev-${Date.now()}`;
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_decision',
          reviewId,
          parcelId: id,
          decision,
          comments: auditComments || (decision === 'APPROVED' ? 'Approved by Auditor.' : 'Rejected.')
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit decision');

      if (decision === 'APPROVED') {
        setMessage(`Claim APPROVED! Token #${data.credit?.onchainCreditId || '101'} minted on-chain.`);
      } else {
        setMessage('Claim REJECTED. Parcel marked as rejected.');
      }

      await fetchParcel();
      setTimeout(() => {
        router.push('/dashboard/review/queue');
      }, 1500);
    } catch (err: any) {
      setMessage(`Audit error: ${err.message}`);
    } finally {
      setAuditLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="p-12 text-center text-muted-foreground">Loading audit console...</div>
      </PageContainer>
    );
  }

  if (!parcel) {
    return (
      <PageContainer>
        <div className="bg-card border rounded-2xl p-12 text-center space-y-3">
          <h3 className="font-bold text-lg">Parcel Not Found</h3>
          <Link href="/dashboard/review/queue" className="text-xs text-indigo-500 underline">
            Return to Review Queue
          </Link>
        </div>
      </PageContainer>
    );
  }

  const deltaPct = mlResult
    ? (((parcel.claimedCredits - mlResult.estimatedCredits) / mlResult.estimatedCredits) * 100).toFixed(1)
    : '0.0';

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h1 className="text-2xl font-bold tracking-tight">Audit Console: {parcel.parcelName}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Verify generator claim against high-resolution drone UAV canopy segmentation and biomass models.
            </p>
          </div>
          <Link
            href="/dashboard/review/queue"
            className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition"
          >
            ← Back to Queue
          </Link>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
            {message}
          </div>
        )}

        {/* Claim Summary Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Generator Application Metadata
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Ecosystem:</span>
              <span className="font-bold text-foreground">{parcel.ecosystemType}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Conservation Area:</span>
              <span className="font-bold text-foreground">{parcel.totalAreaHa} Hectares</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Claimed Volume:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {parcel.claimedCredits} tCO2e
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Status:</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  parcel.status === 'APPROVED'
                    ? 'bg-emerald-950/60 text-emerald-400'
                    : parcel.status === 'REJECTED'
                    ? 'bg-red-950/60 text-red-400'
                    : 'bg-amber-950/60 text-amber-400'
                }`}
              >
                {parcel.status}
              </span>
            </div>
          </div>
        </div>

        {/* Drone Image & ML Inference Workspace */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>📸</span> Drone UAV Evidence & AI Analysis
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload multispectral or RGB drone orthomosaic imagery captured over the geofenced coordinates.
              </p>
            </div>
            <button
              onClick={handleRunMl}
              disabled={mlLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow"
            >
              {mlLoading ? (
                <>
                  <span className="animate-spin">🔄</span> Running PyTorch Model...
                </>
              ) : (
                <>
                  <span>🤖</span> Run AI ML Verification
                </>
              )}
            </button>
          </div>

          {/* UAV Drone Survey Imagery Upload & Batch Management */}
          <div className="p-4 rounded-xl bg-muted/40 border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  UAV Drone Flight Survey Evidence ({droneImages.length} Image{droneImages.length === 1 ? '' : 's'} Selected)
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Upload multiple orthomosaic sector tiles or photos covering the entire parcel boundary.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {droneImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDroneImages([]);
                      setMessage('Cleared all uploaded survey images.');
                    }}
                    className="px-2.5 py-1 rounded-lg border text-xs text-red-500 hover:bg-red-500/10 font-medium transition"
                  >
                    🗑️ Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    showPreview
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-background border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>👁️</span> {showPreview ? 'Hide Preview' : `Preview (${droneImages.length})`}
                </button>
              </div>
            </div>

            {/* URL Input & Multi-File Upload */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-3 flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  placeholder="Paste image URL or Base64 and click Add..."
                  className="flex-1 bg-background border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap transition"
                >
                  + Add URL
                </button>
              </div>

              {/* Multi-File Upload Button */}
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border bg-background hover:bg-muted text-xs font-semibold cursor-pointer transition shadow-xs">
                <span>📁</span> Upload Images (Select Any)
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">Quick Add Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDroneImages((prev) => [...prev, '/samples/mangrove_tile_1.png']);
                    setShowPreview(true);
                  }}
                  className="px-2 py-1 rounded bg-background hover:bg-muted border text-[11px] text-emerald-600 dark:text-emerald-400 font-medium transition"
                >
                  + 🌱 Dense Canopy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDroneImages((prev) => [...prev, '/samples/mangrove_tile_2.png']);
                    setShowPreview(true);
                  }}
                  className="px-2 py-1 rounded bg-background hover:bg-muted border text-[11px] text-cyan-600 dark:text-cyan-400 font-medium transition"
                >
                  + 🌊 Tidal Creek
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDroneImages((prev) => [...prev, '/samples/mangrove_tile_3.png']);
                    setShowPreview(true);
                  }}
                  className="px-2 py-1 rounded bg-background hover:bg-muted border text-[11px] text-teal-600 dark:text-teal-400 font-medium transition"
                >
                  + 🌿 Forest Margin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDroneImages([
                      '/samples/mangrove_tile_1.png',
                      '/samples/mangrove_tile_2.png',
                      '/samples/mangrove_tile_3.png',
                      '/samples/mangrove_tile_1.png',
                      '/samples/mangrove_tile_2.png',
                      '/samples/mangrove_tile_3.png'
                    ]);
                    setShowPreview(true);
                    setMessage('Loaded 6 high-resolution drone orthomosaic survey tiles across the parcel.');
                  }}
                  className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[11px] text-indigo-400 font-semibold transition"
                >
                  ⚡ Load 6 Sector Survey
                </button>
              </div>

              <span className="text-[11px] text-muted-foreground font-mono">
                {droneImages.length} tile{droneImages.length === 1 ? '' : 's'} queued for PyTorch batch
              </span>
            </div>

            {/* Visual Image Preview Panel */}
            {showPreview && (
              <div className="mt-3 p-4 rounded-xl bg-background border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${droneImages.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-xs font-bold text-foreground">
                      UAV Orthomosaic Survey Preview ({droneImages.length} Image{droneImages.length === 1 ? '' : 's'})
                    </span>
                  </div>
                  {droneImages.length > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Ready for Batch Inference
                    </span>
                  )}
                </div>

                {droneImages.length === 0 ? (
                  <div className="py-10 text-center space-y-2 bg-muted/20 rounded-xl border border-dashed p-6">
                    <div className="text-3xl">🚁</div>
                    <div className="text-xs font-semibold text-foreground">No Survey Images Uploaded Yet</div>
                    <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                      Select multiple images at once using <strong>"Upload Images"</strong>, add image URLs, or click <strong>"Load 6 Sector Survey"</strong> to test multi-tile drone processing.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto p-1">
                    {droneImages.map((imgSrc, i) => (
                      <div
                        key={i}
                        className="group relative border rounded-xl overflow-hidden bg-muted/30 flex flex-col shadow-xs"
                      >
                        <div className="relative aspect-square w-full bg-neutral-900 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt={`Survey Sector ${i + 1}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/samples/mangrove_tile_1.png';
                            }}
                          />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-emerald-300 backdrop-blur-xs">
                            Sector #{i + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            title="Remove this image"
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xs opacity-80 group-hover:opacity-100 transition shadow-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="p-2 text-[10px] bg-card border-t flex items-center justify-between">
                          <span className="font-semibold text-foreground truncate">
                            Tile {i + 1}
                          </span>
                          <span className="text-muted-foreground font-mono">256×256</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {droneImages.length > 0 && (
                  <div className="text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between font-mono pt-2 border-t gap-1">
                    <span>PyTorch Batch Tensor: [{droneImages.length}, 3, 256, 256]</span>
                    <span className="text-indigo-400">
                      Multi-tile parallel allometry enabled
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ML Results Panel */}
          {mlResult && (
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                AI MRV Verified Biophysical Baseline
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-muted/40 border">
                  <div className="text-xs text-muted-foreground">Canopy Cover %</div>
                  <div className="text-xl font-bold text-emerald-500 mt-1">
                    {mlResult.vegetationCoverPct}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">U-Net Segmentation</div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border">
                  <div className="text-xs text-muted-foreground">Biomass Density</div>
                  <div className="text-xl font-bold text-cyan-500 mt-1">
                    {mlResult.estimatedBiomass}
                  </div>
                  <div className="text-[10px] text-muted-foreground">t/ha allometric</div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border">
                  <div className="text-xs text-muted-foreground">AI Verified Credits</div>
                  <div className="text-xl font-bold text-teal-400 mt-1">
                    {mlResult.estimatedCredits}
                  </div>
                  <div className="text-[10px] text-muted-foreground">tCO2e baseline</div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border">
                  <div className="text-xs text-muted-foreground">Sylvera Rating</div>
                  <div className="text-xl font-bold text-amber-500 mt-1">
                    {mlResult.additionalityRating || 'AAA'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Quality Benchmark</div>
                </div>
              </div>

              {/* Comparison & Anomaly Callout */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  parseFloat(deltaPct) > 25
                    ? 'bg-destructive/10 border-destructive text-destructive'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">
                    {parseFloat(deltaPct) > 25 ? '⚠️ High-Risk Over-Reporting Detected' : '✅ Verified Within Biological Tolerance'}
                  </div>
                  <div className="text-xs mt-0.5">
                    Claimed: {parcel.claimedCredits} tCO2e vs AI Actual: {mlResult.estimatedCredits} tCO2e (Discrepancy: {deltaPct}%)
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-background border">
                  Risk: {mlResult.riskLevel}
                </span>
              </div>
            </div>
          )}

          {/* Audit Action Section */}
          <div className="pt-4 border-t space-y-3">
            <label className="block text-xs font-semibold text-muted-foreground">
              Auditor Verification Comments
            </label>
            <textarea
              rows={2}
              value={auditComments}
              onChange={(e) => setAuditComments(e.target.value)}
              placeholder="e.g. Canopy density confirmed via PyTorch drone U-Net inference. Allometric equations verified."
              className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDecision('APPROVED')}
                disabled={auditLoading || !mlResult}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow"
              >
                <span>✅</span> Approve Claim & Mint On-Chain (Hardhat)
              </button>
              <button
                onClick={() => handleDecision('REJECTED')}
                disabled={auditLoading}
                className="px-6 py-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 font-semibold text-xs transition disabled:opacity-50"
              >
                <span>❌</span> Reject Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
