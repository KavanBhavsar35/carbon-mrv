'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { getAllTransactionsAction } from '@/features/buyer/actions/buyer-actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    const res = await getAllTransactionsAction();
    if (res.success) {
      setTransactions(res.data ?? []);
    } else {
      toast.error(res.error || 'Failed to load transactions');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h1 className="text-2xl font-bold tracking-tight">Admin: Immutable Blockchain Ledger</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time auditable stream of on-chain smart contract transactions across MINT, PURCHASE, and RETIRE events.
          </p>
        </div>

        {loading ? (
          <div className='flex flex-col items-center justify-center h-64 border rounded-xl bg-card'>
            <Loader2 className='h-8 w-8 animate-spin text-primary mb-2' />
            <p className='text-sm text-muted-foreground'>Loading transaction ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center space-y-2">
            <h3 className="font-bold text-lg">No Transactions Logged Yet</h3>
            <p className="text-sm text-muted-foreground">
              Transactions will automatically record as credits are minted, purchased, and retired.
            </p>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Event Type</th>
                    <th className="px-6 py-3.5 font-semibold">Volume</th>
                    <th className="px-6 py-3.5 font-semibold">Currency</th>
                    <th className="px-6 py-3.5 font-semibold">Transaction Hash</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${
                            tx.type === 'MINT'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : tx.type === 'PURCHASE'
                              ? 'bg-purple-950/60 text-purple-400 border border-purple-800'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-foreground">
                        {tx.amount} tCO2e
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {tx.currency || 'ETH'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-cyan-500 truncate max-w-[220px]">
                        {tx.txHash}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString()}
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
