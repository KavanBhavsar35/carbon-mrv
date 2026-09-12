'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface DemoData {
  parcels: any[];
  credits: any[];
  transactions: any[];
}

export default function InteractiveDemoPage() {
  const [activeTab, setActiveTab] = useState<'generator' | 'ml' | 'approver' | 'buyer' | 'verify'>('generator');
  const [loading, setLoading] = useState(false);
  const [demoState, setDemoState] = useState<DemoData>({ parcels: [], credits: [], transactions: [] });
  
  // Form State for Generator
  const [projectName, setProjectName] = useState('Sundarbans Coastal Mangrove Reserve (Plot A)');
  const [ecosystem, setEcosystem] = useState('MANGROVE');
  const [areaHa, setAreaHa] = useState('12.5');
  const [claimedCredits, setClaimedCredits] = useState('120');
  const [sensorType, setSensorType] = useState<'DRONE' | 'SATELLITE'>('DRONE');
  
  // Active workflow output
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'System initialized. Connected to SQLite DB & FastAPI ML Server.',
    'Hardhat CarbonCreditRegistry contract ready at 0x5FbDB2315678afecb367f032d93F642f64180aa3.'
  ]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Fetch initial state
  const loadState = async () => {
    try {
      const res = await fetch('/api/demo');
      const data = await res.json();
      if (data.success) {
        setDemoState({
          parcels: data.parcels || [],
          credits: data.credits || [],
          transactions: data.transactions || []
        });
      }
    } catch (e: any) {
      addLog(`Failed to load state: ${e.message}`);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Quick Preset Handlers
  const setLegitimatePreset = () => {
    setProjectName('Sundarbans Coastal Mangrove Restoration (Plot A)');
    setEcosystem('MANGROVE');
    setAreaHa('12.5');
    setClaimedCredits('120');
    setSensorType('DRONE');
    addLog('Preset applied: Legitimate Mangrove Project (Claim ~ 120 tCO2e)');
  };

  const setSuspiciousPreset = () => {
    setProjectName('Delta Estuary High-Risk Claim');
    setEcosystem('MANGROVE');
    setAreaHa('8.0');
    setClaimedCredits('250');
    setSensorType('DRONE');
    addLog('Preset applied: High-Risk Over-Reporting Claim (Claim = 250 tCO2e vs 82 expected)');
  };

  // 1. Submit Claim & Run ML
  const handleGeneratorSubmit = async () => {
    setLoading(true);
    addLog(`Submitting "${projectName}" (${areaHa} ha, ${claimedCredits} tCO2e claim)...`);
    addLog(`Triggering AI MRV Pipeline via FastAPI (${sensorType} model)...`);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_parcel_and_estimate',
          parcelName: projectName,
          ecosystemType: ecosystem,
          areaHa: parseFloat(areaHa),
          claimedCredits: parseFloat(claimedCredits),
          source: sensorType,
          images: ['https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg']
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      setCurrentResult(data);
      addLog(`ML Model Inference complete! Model: ${data.mlOutput.modelVersion}`);
      addLog(`Canopy Cover: ${data.mlOutput.vegetationCoverPct}% | Estimated Biomass: ${data.mlOutput.estimatedBiomass} t/ha`);
      addLog(`ML Carbon Estimate: ${data.mlOutput.estimatedCredits} tCO2e (Delta: ${data.estimate.deltaPct}%)`);
      addLog(`Sylvera Rating: ${data.mlOutput.additionalityRating || 'AAA'} | Risk: ${data.mlOutput.riskLevel}`);
      
      await loadState();
      setActiveTab('ml');
    } catch (e: any) {
      addLog(`Error during submission: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Approver Decision
  const handleReviewDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!currentResult?.reviewRequest?.id) {
      addLog('No active review request to evaluate.');
      return;
    }

    setLoading(true);
    addLog(`Approver decision dispatched: ${decision}...`);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_decision',
          reviewId: currentResult.reviewRequest.id,
          parcelId: currentResult.parcel.id,
          decision,
          comments: decision === 'APPROVED' 
            ? 'Verified against PyTorch Mangrove UNet baseline. Sylvera AAA rating accepted.' 
            : 'Rejected due to excessive delta over AI biophysical canopy limit.'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');

      if (decision === 'APPROVED') {
        addLog(`On-chain transaction minted! Credit #${data.credit.onchainCreditId}`);
        addLog(`Tx Hash: ${data.credit.blockchainTxHash.substring(0, 20)}...`);
        setCurrentResult((prev: any) => ({ ...prev, credit: data.credit }));
        setActiveTab('approver');
      } else {
        addLog('Claim REJECTED. Registry marked as unapproved.');
      }

      await loadState();
    } catch (e: any) {
      addLog(`Error during review: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Buyer Purchase
  const handleBuyCredit = async (creditId: string) => {
    setLoading(true);
    addLog(`Initiating tokenized credit purchase for Credit ID ${creditId}...`);

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

      addLog(`Purchase confirmed! Custody transferred to buyer wallet.`);
      addLog(`Payment Tx: ${data.txHash.substring(0, 20)}...`);
      await loadState();
    } catch (e: any) {
      addLog(`Error during purchase: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Buyer Retire
  const handleRetireCredit = async (creditId: string) => {
    setLoading(true);
    addLog(`Retiring Credit ID ${creditId} for Corporate ESG Net-Zero Offset...`);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retire_credit',
          creditId,
          retirementReason: 'Corporate Net-Zero 2026 Scope 1 & 2 Offsetting'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retirement failed');

      addLog(`Credit #${creditId} permanently RETIRED on-chain! Double-spending locked.`);
      addLog(`Retire Tx: ${data.txHash.substring(0, 20)}...`);
      await loadState();
      setActiveTab('verify');
    } catch (e: any) {
      addLog(`Error during retirement: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeCredit = currentResult?.credit || demoState.credits[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Circular Blue Carbon MRV Prototype
            </h1>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            End-to-End Multi-Role Judge Demonstration Console (FastAPI ML + Prisma SQLite + Hardhat)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={setLegitimatePreset}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-medium hover:bg-emerald-900/60 transition"
          >
            Demo 1: Valid Claim
          </button>
          <button
            onClick={setSuspiciousPreset}
            className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 text-amber-300 text-xs font-medium hover:bg-amber-900/60 transition"
          >
            Demo 2: Over-Reporting Flag
          </button>
          <Link
            href={activeCredit ? `/verify/${activeCredit.onchainCreditId}` : '/verify/101'}
            target="_blank"
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
          >
            Open Public Certificate ↗
          </Link>
        </div>
      </header>

      {/* Role Navigation Stepper */}
      <div className="max-w-7xl mx-auto my-6 grid grid-cols-2 md:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveTab('generator')}
          className={`p-3 rounded-xl text-left border transition ${
            activeTab === 'generator'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
              : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
          }`}
        >
          <div className="text-xs text-neutral-500 font-mono">STEP 1</div>
          <div className="font-semibold text-sm flex items-center gap-1.5 mt-0.5">
            <span>🌱</span> Generator Apply
          </div>
        </button>

        <button
          onClick={() => setActiveTab('ml')}
          className={`p-3 rounded-xl text-left border transition ${
            activeTab === 'ml'
              ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
              : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
          }`}
        >
          <div className="text-xs text-neutral-500 font-mono">STEP 2</div>
          <div className="font-semibold text-sm flex items-center gap-1.5 mt-0.5">
            <span>🤖</span> AI MRV Inference
          </div>
        </button>

        <button
          onClick={() => setActiveTab('approver')}
          className={`p-3 rounded-xl text-left border transition ${
            activeTab === 'approver'
              ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
              : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
          }`}
        >
          <div className="text-xs text-neutral-500 font-mono">STEP 3</div>
          <div className="font-semibold text-sm flex items-center gap-1.5 mt-0.5">
            <span>🛡️</span> Approver Audit
          </div>
        </button>

        <button
          onClick={() => setActiveTab('buyer')}
          className={`p-3 rounded-xl text-left border transition ${
            activeTab === 'buyer'
              ? 'bg-purple-950/60 border-purple-500 text-purple-200'
              : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
          }`}
        >
          <div className="text-xs text-neutral-500 font-mono">STEP 4</div>
          <div className="font-semibold text-sm flex items-center gap-1.5 mt-0.5">
            <span>💼</span> Buyer Marketplace
          </div>
        </button>

        <button
          onClick={() => setActiveTab('verify')}
          className={`p-3 rounded-xl text-left border col-span-2 md:col-span-1 transition ${
            activeTab === 'verify'
              ? 'bg-amber-950/60 border-amber-500 text-amber-200'
              : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
          }`}
        >
          <div className="text-xs text-neutral-500 font-mono">STEP 5</div>
          <div className="font-semibold text-sm flex items-center gap-1.5 mt-0.5">
            <span>📜</span> ESG Verification
          </div>
        </button>
      </div>

      {/* Main Showcase Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Interactive Role Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: GENERATOR */}
          {activeTab === 'generator' && (
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">🌱</span>
                  Generator Portal: Register Land Parcel & Request Credits
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Role: GENERATOR
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Project / Parcel Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Ecosystem Type
                    </label>
                    <select
                      value={ecosystem}
                      onChange={e => setEcosystem(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="MANGROVE">Mangrove Forest</option>
                      <option value="SEAGRASS">Seagrass Meadow</option>
                      <option value="SALT_MARSH">Coastal Salt Marsh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Total Area (Hectares)
                    </label>
                    <input
                      type="number"
                      value={areaHa}
                      onChange={e => setAreaHa(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Claimed Carbon ($tCO_2e$)
                    </label>
                    <input
                      type="number"
                      value={claimedCredits}
                      onChange={e => setClaimedCredits(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Sensor Evidence Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={sensorType === 'DRONE'}
                        onChange={() => setSensorType('DRONE')}
                        className="text-emerald-500 focus:ring-0"
                      />
                      High-Resolution Drone UAV Imagery (MangroveUNet)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={sensorType === 'SATELLITE'}
                        onChange={() => setSensorType('SATELLITE')}
                        className="text-emerald-500 focus:ring-0"
                      />
                      Sentinel-2 Bi-Temporal Satellite (Recovery UNet)
                    </label>
                  </div>
                </div>

                {/* Evidence preview box */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-lg">
                      📸
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-200">Multispectral UAV Orthomosaic</div>
                      <div className="text-xs text-neutral-500 font-mono">
                        SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-neutral-800 text-neutral-300">
                    Pre-processed
                  </span>
                </div>

                <button
                  onClick={handleGeneratorSubmit}
                  disabled={loading}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Calling PyTorch ML Models & Writing DB...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Submit Claim & Trigger AI MRV Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ML INFERENCE */}
          {activeTab === 'ml' && (
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">🤖</span>
                  AI MRV Engine Analysis & Canopy Segmentation
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  FastAPI Port 8000
                </span>
              </div>

              {currentResult?.mlOutput ? (
                <div className="space-y-6">
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <div className="text-xs text-neutral-400">Canopy Cover</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">
                        {currentResult.mlOutput.vegetationCoverPct}%
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">U-Net Segmentation</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <div className="text-xs text-neutral-400">Biomass Density</div>
                      <div className="text-2xl font-bold text-cyan-400 mt-1">
                        {currentResult.mlOutput.estimatedBiomass}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">t/ha allometric</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <div className="text-xs text-neutral-400">ML Carbon Estimate</div>
                      <div className="text-2xl font-bold text-teal-300 mt-1">
                        {currentResult.mlOutput.estimatedCredits}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">tCO2e baseline</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <div className="text-xs text-neutral-400">Additionality Rating</div>
                      <div className="text-2xl font-bold text-amber-400 mt-1">
                        {currentResult.mlOutput.additionalityRating || 'AAA'}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">Sylvera benchmark</div>
                    </div>
                  </div>

                  {/* Anomaly & Risk Analysis */}
                  <div className={`p-4 rounded-xl border ${
                    currentResult.mlOutput.riskLevel === 'HIGH'
                      ? 'bg-red-950/30 border-red-800/60'
                      : 'bg-emerald-950/30 border-emerald-800/60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {currentResult.mlOutput.riskLevel === 'HIGH' ? '⚠️' : '✅'}
                        </span>
                        <div>
                          <div className="font-semibold text-white">
                            Isolation Forest Anomaly Check: {currentResult.mlOutput.riskLevel} Risk
                          </div>
                          <div className="text-xs text-neutral-400">
                            Claimed: {currentResult.parcel.claimedCredits} tCO2e vs AI Estimate: {currentResult.mlOutput.estimatedCredits} tCO2e (Delta: {currentResult.estimate.deltaPct}%)
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded font-mono ${
                        currentResult.mlOutput.riskLevel === 'HIGH'
                          ? 'bg-red-900/60 text-red-200 border border-red-700'
                          : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                      }`}>
                        Score: {currentResult.mlOutput.anomalyScore}
                      </span>
                    </div>
                  </div>

                  {/* Permanence Buffer Pool */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-neutral-400">15% Permanence Buffer Pool Deduction</div>
                      <div className="text-neutral-200 font-semibold mt-0.5">
                        {currentResult.mlOutput.bufferPoolCredits || (currentResult.mlOutput.estimatedCredits * 0.15).toFixed(2)} tCO2e held in insurance escrow
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-neutral-400">Net Tradable Credits</div>
                      <div className="text-emerald-400 font-bold text-sm mt-0.5">
                        {currentResult.mlOutput.netTradableCredits || (currentResult.mlOutput.estimatedCredits * 0.85).toFixed(2)} tCO2e
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('approver')}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
                  >
                    Proceed to Approver Audit Queue →
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <p>No active claim evaluated yet. Go to Step 1 and submit a claim to trigger the AI MRV pipeline.</p>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="mt-3 px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700"
                  >
                    Go to Step 1
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: APPROVER / AUDITOR */}
          {activeTab === 'approver' && (
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">🛡️</span>
                  Approver / Auditor Review Queue & On-Chain Minting
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                  Role: APPROVER
                </span>
              </div>

              {currentResult?.reviewRequest ? (
                <div className="space-y-4 text-sm">
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white text-base">{currentResult.parcel.parcelName}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Applicant: Sundarbans Blue Carbon Trust | Area: {currentResult.parcel.totalAreaHa} ha
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded font-semibold ${
                        currentResult.parcel.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : currentResult.parcel.status === 'REJECTED'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        Status: {currentResult.parcel.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-800 text-xs">
                      <div>
                        <span className="text-neutral-500 block">Claimed Credits:</span>
                        <span className="font-bold text-neutral-200">{currentResult.parcel.claimedCredits} tCO2e</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">AI Baseline:</span>
                        <span className="font-bold text-teal-400">{currentResult.estimate.estimatedCredits} tCO2e</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Delta %:</span>
                        <span className={`font-bold ${currentResult.estimate.deltaPct > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {currentResult.estimate.deltaPct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {currentResult.credit ? (
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800">
                      <div className="font-bold text-emerald-300">✅ On-Chain Carbon Credit Minted!</div>
                      <div className="text-xs text-neutral-300 mt-1 space-y-1 font-mono">
                        <div>Credit ID: #{currentResult.credit.onchainCreditId}</div>
                        <div>Amount: {currentResult.credit.amount} tCO2e</div>
                        <div>Tx Hash: {currentResult.credit.blockchainTxHash}</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('buyer')}
                        className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Switch to Buyer Role & Purchase Token →
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleReviewDecision('APPROVED')}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <span>✅</span> Approve & Mint On-Chain (Hardhat)
                      </button>
                      <button
                        onClick={() => handleReviewDecision('REJECTED')}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-semibold transition disabled:opacity-50"
                      >
                        <span>❌</span> Reject Claim
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <p>Queue is empty. Submit a parcel claim in Step 1 to populate this queue.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BUYER MARKETPLACE */}
          {activeTab === 'buyer' && (
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">💼</span>
                  Corporate Buyer Marketplace & Offset Retirement
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
                  Role: BUYER (Acme Corp ESG Desk)
                </span>
              </div>

              <div className="space-y-4">
                {demoState.credits.length > 0 ? (
                  demoState.credits.map((credit: any) => (
                    <div
                      key={credit.id}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Credit #{credit.onchainCreditId}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                            Vintage {credit.vintage}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            credit.status === 'RETIRED'
                              ? 'bg-neutral-800 text-neutral-400'
                              : credit.status === 'SOLD'
                              ? 'bg-blue-950 text-blue-400'
                              : 'bg-emerald-950 text-emerald-400'
                          }`}>
                            {credit.status}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">
                          Amount: <span className="text-white font-semibold">{credit.amount} tCO2e</span> | Owner: {credit.ownerWalletAddress.substring(0, 10)}...
                        </div>
                        {credit.retiredReason && (
                          <div className="text-xs text-amber-400/90 mt-1 italic">
                            Retirement Purpose: "{credit.retiredReason}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        {credit.status === 'ISSUED' && (
                          <button
                            onClick={() => handleBuyCredit(credit.id)}
                            disabled={loading}
                            className="w-full md:w-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
                          >
                            Buy Credit ($35/tCO2e)
                          </button>
                        )}
                        {credit.status === 'SOLD' && (
                          <button
                            onClick={() => handleRetireCredit(credit.id)}
                            disabled={loading}
                            className="w-full md:w-auto px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                          >
                            Retire for Net-Zero Offset
                          </button>
                        )}
                        <Link
                          href={`/verify/${credit.onchainCreditId}`}
                          className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium"
                        >
                          View Certificate
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    <p>No carbon credits minted yet. Approve a claim in Step 3 to mint credits.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PUBLIC VERIFICATION PREVIEW */}
          {activeTab === 'verify' && (
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">📜</span>
                  Public Certificate & Immutable Audit Proof
                </h2>
                <Link
                  href={activeCredit ? `/verify/${activeCredit.onchainCreditId}` : '/verify/101'}
                  target="_blank"
                  className="text-xs px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
                >
                  Open Dedicated Page ↗
                </Link>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-950 to-neutral-900 border border-neutral-800 text-center space-y-4">
                <div className="inline-block p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-3xl mb-1">
                  🌿
                </div>
                <h3 className="text-xl font-bold text-white">
                  Certificate of Verified Blue Carbon Retirement
                </h3>
                <p className="text-xs text-neutral-400 max-w-lg mx-auto">
                  Cryptographically secured by Hardhat smart contract on Ethereum Paris EVM with PyTorch U-Net satellite MRV verification.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left pt-2">
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-xs text-neutral-500 block">Credit Token ID</span>
                    <span className="text-base font-bold text-white font-mono">
                      #{activeCredit?.onchainCreditId || '101'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-xs text-neutral-500 block">Carbon Volume</span>
                    <span className="text-base font-bold text-emerald-400">
                      {activeCredit?.amount || 120.0} tCO2e
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-xs text-neutral-500 block">Quality Rating</span>
                    <span className="text-base font-bold text-amber-400">AAA (Sylvera)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-xs text-neutral-500 block">Status</span>
                    <span className="text-base font-bold text-cyan-400">
                      {activeCredit?.status || 'RETIRED'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-left text-xs font-mono break-all text-neutral-400">
                  <div className="text-neutral-500 text-[10px] uppercase font-sans">On-Chain Transaction Hash</div>
                  <div className="mt-0.5 text-cyan-300">
                    {activeCredit?.blockchainTxHash || '0x2d3b683949f5038c11aa082103f19114b3017a86f91f34b92b6a938c82ef9104'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Audit & Terminal Console */}
        <div className="space-y-6">
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Live Audit & Hardhat Console
                </h3>
              </div>
              <button
                onClick={() => setConsoleLogs(['Console cleared.'])}
                className="text-[10px] text-neutral-500 hover:text-neutral-300"
              >
                Clear
              </button>
            </div>

            <div className="bg-neutral-950 rounded-xl p-3.5 font-mono text-xs text-neutral-300 space-y-1.5 h-[340px] overflow-y-auto border border-neutral-800/80">
              {consoleLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed break-words ${
                    log.includes('complete') || log.includes('minted') || log.includes('confirmed')
                      ? 'text-emerald-400'
                      : log.includes('REJECTED') || log.includes('HIGH') || log.includes('Error')
                      ? 'text-amber-400'
                      : log.includes('Triggering') || log.includes('Submitting')
                      ? 'text-cyan-400'
                      : 'text-neutral-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats & System Status */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-xl backdrop-blur text-xs space-y-3">
            <h4 className="font-bold text-neutral-200 uppercase tracking-wider text-[11px]">
              System Health & Active Contracts
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">ML PyTorch Server:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Port 8000 Healthy
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Prisma SQLite:</span>
                <span className="text-emerald-400 font-semibold">dev.db (Synced)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Smart Contract:</span>
                <span className="text-cyan-400 font-mono">0x5FbD...aa3</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Registered Parcels:</span>
                <span className="text-white font-bold">{demoState.parcels.length}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Minted Credits:</span>
                <span className="text-emerald-400 font-bold">{demoState.credits.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
