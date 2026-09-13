'use client';

import React, { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface TransactionLinkProps {
  hash: string;
  type?: 'tx' | 'address' | 'token';
  network?: string;
  truncate?: boolean;
  className?: string;
}

export function TransactionLink({
  hash,
  type = 'tx',
  network = 'sepolia',
  truncate = true,
  className = ''
}: TransactionLinkProps) {
  const [copied, setCopied] = useState(false);

  const displayHash = truncate && hash.length > 18
    ? `${hash.slice(0, 8)}...${hash.slice(-6)}`
    : hash;

  const baseUrl = network.toLowerCase().includes('sepolia')
    ? 'https://sepolia.etherscan.io'
    : 'https://etherscan.io';

  const explorerUrl = `${baseUrl}/${type}/${hash}`;

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 font-mono text-xs ${className}`}>
      <span className="text-neutral-700 dark:text-neutral-300 select-all" title={hash}>
        {displayHash}
      </span>
      <button
        onClick={copyToClipboard}
        title="Copy to clipboard"
        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Sepolia Explorer"
        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
      >
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
