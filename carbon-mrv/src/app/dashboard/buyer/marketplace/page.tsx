'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Leaf,
  TrendingUp,
  Wallet,
  ExternalLink,
  Loader2,
  CircleDollarSign,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { getAvailableCreditsAction, purchaseCreditAction } from '@/features/buyer/actions/buyer-actions';
import { toast } from 'sonner';

export default function MarketplacePage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const fetchCredits = async () => {
    const res = await getAvailableCreditsAction();
    if (res.success) {
      setCredits(res.data ?? []);
    } else {
      toast.error(res.error || 'Failed to load marketplace');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handlePurchase = async (creditId: string) => {
    setPurchasingId(creditId);
    const res = await purchaseCreditAction(creditId);
    if (res.success) {
      toast.success(`Credit purchased! Tx: ${res.data?.txHash?.substring(0, 18)}...`);
      await fetchCredits();
    } else {
      toast.error(res.error || 'Purchase failed');
    }
    setPurchasingId(null);
  };

  const totalVolume = credits.reduce((acc, c) => acc + (c.amount || 0), 0);
  const avgPrice = 35;

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
              Blue Carbon Marketplace
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Browse and acquire verified on-chain tokenized carbon credits with PyTorch UAV canopy allometry.
            </p>
          </div>
          <Link href='/dashboard/buyer/holdings'>
            <Button variant='outline' className='gap-2'>
              <Wallet className='h-4 w-4' />
              My Holdings
            </Button>
          </Link>
        </div>

        {/* Summary Metrics */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600'>
                  <Leaf className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Available Credits</div>
                  <div className='text-xl font-bold'>{loading ? '...' : credits.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-blue-500/10 text-blue-600'>
                  <BarChart3 className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Total Volume</div>
                  <div className='text-xl font-bold'>{loading ? '...' : `${totalVolume.toFixed(1)} tCO2e`}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-amber-500/10 text-amber-600'>
                  <CircleDollarSign className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Price / tCO2e</div>
                  <div className='text-xl font-bold'>${avgPrice}.00</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-purple-500/10 text-purple-600'>
                  <ShieldCheck className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Rating</div>
                  <div className='text-xl font-bold text-amber-500'>AAA</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credits Grid */}
        {loading ? (
          <div className='flex flex-col items-center justify-center h-64 border rounded-xl bg-card'>
            <Loader2 className='h-8 w-8 animate-spin text-emerald-600 mb-2' />
            <p className='text-sm text-muted-foreground'>Loading marketplace credits...</p>
          </div>
        ) : credits.length === 0 ? (
          <Card className='border-dashed shadow-none'>
            <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='p-4 rounded-full bg-emerald-500/10 text-emerald-600 mb-4'>
                <Leaf className='h-10 w-10' />
              </div>
              <h3 className='text-lg font-semibold'>No Credits Listed Yet</h3>
              <p className='text-sm text-muted-foreground max-w-md mt-1'>
                Once an Approver audits and approves submitted parcels, tokenized credits will appear here for purchase.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {credits.map((credit) => {
              const estimate = credit.parcel?.estimates?.[0];
              return (
                <Card key={credit.id} className='border shadow-xs hover:border-blue-500/40 transition-all flex flex-col justify-between'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <span className='text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground'>
                          Token #{credit.onchainCreditId}
                        </span>
                        <CardTitle className='text-base font-semibold mt-2'>
                          {credit.parcel?.parcelName || 'Blue Carbon Conservation Reserve'}
                        </CardTitle>
                        <CardDescription className='capitalize text-xs mt-0.5'>
                          {credit.parcel?.ecosystemType?.replace('_', ' ').toLowerCase() || 'mangrove'}
                        </CardDescription>
                      </div>
                      <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0'>
                        ISSUED
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-4 pt-0'>
                    <div className='grid grid-cols-2 gap-2 text-xs py-2 border-y bg-muted/30 -mx-6 px-6'>
                      <div>
                        <span className='text-muted-foreground'>Volume:</span>
                        <div className='font-semibold text-emerald-600'>{credit.amount} tCO2e</div>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>Vintage:</span>
                        <div className='font-semibold'>{credit.vintage}</div>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>Price:</span>
                        <div className='font-semibold'>${(credit.amount * 35).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>Rating:</span>
                        <div className='font-semibold text-amber-500'>AAA (Sylvera)</div>
                      </div>
                    </div>

                    {estimate && (
                      <div className='bg-blue-50/70 dark:bg-blue-950/20 p-2.5 rounded-md border border-blue-200/50 text-xs'>
                        <div className='font-medium text-blue-700 dark:text-blue-400 flex items-center justify-between'>
                          <span>ML Canopy Estimate</span>
                          <span>{estimate.estimatedCredits?.toFixed(1)} tCO2e</span>
                        </div>
                        <div className='text-[11px] text-muted-foreground mt-0.5 flex gap-3'>
                          <span>Cover: {estimate.vegetationCoverPct?.toFixed(1)}%</span>
                          <span>Conf: {((estimate.confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}

                    <div className='flex items-center justify-between gap-2 pt-1'>
                      <Link href={`/verify/${credit.onchainCreditId}`}>
                        <Button variant='ghost' size='sm' className='h-8 gap-1 text-xs'>
                          <ExternalLink className='h-3.5 w-3.5' />
                          Verify
                        </Button>
                      </Link>
                      <Button
                        size='sm'
                        className='gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs'
                        onClick={() => handlePurchase(credit.id)}
                        disabled={purchasingId === credit.id}
                      >
                        {purchasingId === credit.id ? (
                          <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        ) : (
                          <ShoppingCart className='h-3.5 w-3.5' />
                        )}
                        Purchase
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
