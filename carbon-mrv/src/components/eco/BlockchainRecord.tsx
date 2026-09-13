import React from 'react';
import { ShieldCheck, ExternalLink, Blocks, Layers, CheckCircle2 } from 'lucide-react';
import { TransactionLink } from './TransactionLink';

interface BlockchainRecordProps {
  network?: string;
  contractAddress: string;
  tokenId?: string | number;
  txHash?: string;
  blockNumber?: number | string;
  status?: string;
  explorerUrl?: string;
  className?: string;
}

export function BlockchainRecord({
  network = 'Ethereum Sepolia',
  contractAddress,
  tokenId,
  txHash,
  blockNumber,
  status = 'Confirmed',
  explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}`,
  className = ''
}: BlockchainRecordProps) {
  return (
    <div
      className={`bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl text-neutral-100 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
              Integrity Anchor Layer
            </span>
            <h3 className="text-lg font-bold text-white font-sans">
              Blockchain Record
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {status}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono">
            {network}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            Contract Address (ERC-1155)
          </span>
          <div className="mt-1">
            <TransactionLink hash={contractAddress} type="address" network={network} />
          </div>
        </div>

        {tokenId !== undefined && (
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Token ID
            </span>
            <div className="mt-1 text-sm font-mono font-bold text-emerald-300">
              #{tokenId}
            </div>
          </div>
        )}

        {txHash && (
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Transaction Hash
            </span>
            <div className="mt-1">
              <TransactionLink hash={txHash} type="tx" network={network} />
            </div>
          </div>
        )}

        {blockNumber && (
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-emerald-950/40">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Block Height
            </span>
            <div className="mt-1 text-sm font-mono text-neutral-300">
              #{blockNumber}
            </div>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="mt-5 pt-4 border-t border-emerald-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-neutral-400 font-sans">
          Immutable smart contract record guarantees non-fungible vintage tracking and prevents double-retirement.
        </span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold font-sans transition shrink-0"
        >
          <span>View on Sepolia Explorer</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
