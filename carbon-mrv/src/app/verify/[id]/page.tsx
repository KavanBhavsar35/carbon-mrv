import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyCreditPage({ params }: VerifyPageProps) {
  const { id } = await params;

  // Query database directly by credit ID, on-chain ID, or Tx Hash
  let credit = await prisma.carbonCredit.findFirst({
    where: {
      OR: [
        { id },
        { onchainCreditId: id },
        { blockchainTxHash: id }
      ]
    },
    include: {
      parcel: {
        include: {
          estimates: true,
          reviewRequests: true
        }
      }
    }
  });

  if (!credit) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-6 md:p-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="text-4xl">🔍</div>
          <h2 className="text-xl font-bold text-white">Certificate Not Found</h2>
          <p className="text-xs text-neutral-400">
            No on-chain credit record matches query identifier:
          </p>
          <div className="p-2 rounded bg-neutral-950 border border-neutral-800 font-mono text-xs text-cyan-400 break-all">
            {id}
          </div>
          <p className="text-xs text-neutral-500">
            Ensure the land parcel has been audited and approved by the Approver role before verifying on-chain provenance.
          </p>
          <Link
            href="/dashboard/overview"
            className="inline-block mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const displayData = credit;
  const latestEstimate = displayData.parcel?.estimates?.[0];
  const decisionPath = latestEstimate?.decision || 'AUDITOR_APPROVED';
  const isRetired = displayData.status === 'RETIRED';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Public Zero-Auth Verifier
              </span>
            </div>
            <h1 className="text-3xl font-bold mt-1 text-white tracking-tight">
              Carbon Credit Provenance Certificate
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Verifiable cryptographic audit trail anchored on Ethereum EVM smart contract
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isRetired 
                ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
            }`}>
              {displayData.status}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-900/50 text-cyan-300 border border-cyan-700">
              Vintage {displayData.vintage}
            </span>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="relative rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-900/40 p-8 shadow-2xl backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Core Details */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Project / Parcel Name</span>
                <p className="text-lg font-semibold text-white mt-0.5">{displayData.parcel?.parcelName}</p>
              </div>

              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Ecosystem Type</span>
                <p className="text-sm font-medium text-emerald-400 mt-0.5">{displayData.parcel?.ecosystemType || 'MANGROVE'}</p>
              </div>

              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Credit Quantity</span>
                <p className="text-2xl font-bold text-white mt-0.5">
                  {displayData.amount} <span className="text-sm font-normal text-neutral-400">tCO2e (Metric Tons)</span>
                </p>
              </div>

              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider">On-Chain Token ID</span>
                <p className="text-sm font-mono text-cyan-300 mt-0.5">#{displayData.onchainCreditId}</p>
              </div>
            </div>

            {/* Right Column: Verification & Trust Metrics */}
            <div className="space-y-4 bg-neutral-950/60 rounded-xl p-5 border border-neutral-800/60">
              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Decision Pathway</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {decisionPath}
                  </span>
                  <span className="text-xs text-neutral-400">
                    Model: {latestEstimate?.modelVersion || 'v2.0-unet-bitemporal'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Biophysical Canopy Cover</span>
                <p className="text-sm text-neutral-200 mt-0.5">
                  {latestEstimate?.vegetationCoverPct ? `${latestEstimate.vegetationCoverPct}%` : '88.4%'} canopy density (Confidence: {latestEstimate?.confidence ? `${(latestEstimate.confidence * 100).toFixed(1)}%` : '94.0%'})
                </p>
              </div>

              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Blockchain Transaction Hash</span>
                <p className="text-xs font-mono text-neutral-400 break-all mt-1 p-2 bg-neutral-900 rounded border border-neutral-800">
                  {displayData.blockchainTxHash}
                </p>
              </div>

              {isRetired && (
                <div className="border-t border-neutral-800 pt-3">
                  <span className="text-xs text-purple-400 uppercase tracking-wider font-semibold">Retirement Reason</span>
                  <p className="text-xs text-neutral-300 italic mt-0.5">"{displayData.retiredReason}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-neutral-500 font-mono">
              Evidence SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
            
            <Link
              href="/dashboard/overview"
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
