'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Flame,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { getMyTransactionsAction } from '@/features/buyer/actions/buyer-actions';
import { toast } from 'sonner';

const TX_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  PURCHASE: {
    label: 'Purchase',
    icon: <ArrowDownLeft className='h-3.5 w-3.5' />,
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30'
  },
  RETIRE: {
    label: 'Retirement',
    icon: <Flame className='h-3.5 w-3.5' />,
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30'
  },
  MINT: {
    label: 'Mint',
    icon: <ArrowUpRight className='h-3.5 w-3.5' />,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
  }
};

export default function OrdersPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getMyTransactionsAction();
      if (res.success) {
        setTransactions(res.data ?? []);
      } else {
        toast.error(res.error || 'Failed to load order history');
      }
      setLoading(false);
    })();
  }, []);

  const totalSpend = transactions
    .filter((tx) => tx.type === 'PURCHASE')
    .reduce((acc, tx) => acc + (tx.totalPrice || 0), 0);

  const totalTco2eRetired = transactions
    .filter((tx) => tx.type === 'RETIRE')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  return (
    <PageContainer>
      <div className='space-y-6 animate-in fade-in-50 duration-300'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5'>
          <div>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs font-semibold'>
                Buyer Dashboard
              </Badge>
            </div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground mt-1'>
              Order History
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Complete on-chain transaction ledger for purchases and ESG credit retirements.
            </p>
          </div>
          <Link href='/dashboard/buyer/holdings'>
            <Button variant='outline' className='gap-2'>
              View Holdings
            </Button>
          </Link>
        </div>

        {/* Summary Metrics */}
        <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-blue-500/10 text-blue-600'>
                  <Receipt className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Total Orders</div>
                  <div className='text-xl font-bold'>{loading ? '...' : transactions.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600'>
                  <ArrowDownLeft className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Total Spend</div>
                  <div className='text-xl font-bold'>${totalSpend.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border shadow-xs col-span-2 lg:col-span-1'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-amber-500/10 text-amber-600'>
                  <Flame className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>tCO2e Retired</div>
                  <div className='text-xl font-bold'>{totalTco2eRetired.toFixed(1)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className='flex flex-col items-center justify-center h-64 border rounded-xl bg-card'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600 mb-2' />
            <p className='text-sm text-muted-foreground'>Loading order history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <Card className='border-dashed shadow-none'>
            <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='p-4 rounded-full bg-blue-500/10 text-blue-600 mb-4'>
                <Receipt className='h-10 w-10' />
              </div>
              <h3 className='text-lg font-semibold'>No Orders Yet</h3>
              <p className='text-sm text-muted-foreground max-w-md mt-1 mb-6'>
                Your purchase and retirement history will appear here once you transact on the marketplace.
              </p>
              <Link href='/dashboard/buyer/marketplace'>
                <Button className='gap-2 bg-blue-600 hover:bg-blue-700 text-white'>
                  Browse Marketplace
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className='bg-card border rounded-xl overflow-hidden shadow-xs'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground'>
                  <tr>
                    <th className='px-6 py-3.5 font-semibold'>Type</th>
                    <th className='px-6 py-3.5 font-semibold'>Credit ID</th>
                    <th className='px-6 py-3.5 font-semibold'>Volume (tCO2e)</th>
                    <th className='px-6 py-3.5 font-semibold'>Price/t</th>
                    <th className='px-6 py-3.5 font-semibold'>Total</th>
                    <th className='px-6 py-3.5 font-semibold'>Status</th>
                    <th className='px-6 py-3.5 font-semibold'>Tx Hash</th>
                    <th className='px-6 py-3.5 font-semibold text-right'>Date</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {transactions.map((tx) => {
                    const config = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.MINT;
                    return (
                      <tr key={tx.id} className='hover:bg-muted/30 transition'>
                        <td className='px-6 py-4'>
                          <Badge variant='outline' className={`gap-1.5 text-xs font-semibold ${config.badgeClass}`}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </td>
                        <td className='px-6 py-4 font-mono text-xs text-muted-foreground'>
                          {tx.creditId ? tx.creditId.substring(0, 12) + '...' : '—'}
                        </td>
                        <td className='px-6 py-4 font-semibold text-emerald-600'>
                          {tx.amount} tCO2e
                        </td>
                        <td className='px-6 py-4 text-xs text-muted-foreground'>
                          {tx.pricePerCredit ? `$${tx.pricePerCredit}` : '—'}
                        </td>
                        <td className='px-6 py-4 font-semibold'>
                          {tx.totalPrice ? `$${tx.totalPrice.toLocaleString()}` : '—'}
                        </td>
                        <td className='px-6 py-4'>
                          <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs'>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className='px-6 py-4 font-mono text-xs text-primary truncate max-w-[160px]'>
                          {tx.txHash ? tx.txHash.substring(0, 18) + '...' : '—'}
                        </td>
                        <td className='px-6 py-4 text-right text-xs text-muted-foreground'>
                          {new Date(tx.createdAt).toLocaleDateString()}<br />
                          <span className='text-[11px]'>{new Date(tx.createdAt).toLocaleTimeString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
