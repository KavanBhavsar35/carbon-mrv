'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wallet,
  Leaf,
  ShieldCheck,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { getMyHoldingsAction, retireCreditAction } from '@/features/buyer/actions/buyer-actions';
import { toast } from 'sonner';

export default function HoldingsPage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retiringId, setRetiringId] = useState<string | null>(null);
  const [retirementReason, setRetirementReason] = useState('Corporate Scope 1 & 2 ESG Net-Zero Offsetting');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchCredits = async () => {
    const res = await getMyHoldingsAction();
    if (res.success) {
      setCredits(res.data ?? []);
    } else {
      toast.error(res.error || 'Failed to load holdings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleRetire = async (creditId: string) => {
    setProcessingId(creditId);
    const res = await retireCreditAction(creditId, retirementReason);
    if (res.success) {
      toast.success('Credit permanently retired on blockchain. Token locked against double-counting.');
      setRetiringId(null);
      await fetchCredits();
    } else {
      toast.error(res.error || 'Retirement failed');
    }
    setProcessingId(null);
  };

  const activeCount = credits.filter((c) => c.status === 'SOLD').length;
  const retiredCount = credits.filter((c) => c.status === 'RETIRED').length;
  const totalTco2e = credits.reduce((acc, c) => acc + (c.amount || 0), 0);

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
              Carbon Holdings & ESG Retirement
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Custody management for tokenized blue carbon credits and immutable ESG retirement execution.
            </p>
          </div>
          <Link href='/dashboard/buyer/marketplace'>
            <Button variant='outline' className='gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        {/* Summary Metrics */}
        <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600'>
                  <Wallet className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Active Credits</div>
                  <div className='text-xl font-bold'>{loading ? '...' : activeCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-amber-500/10 text-amber-600'>
                  <Lock className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Retired</div>
                  <div className='text-xl font-bold'>{loading ? '...' : retiredCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border shadow-xs col-span-2 lg:col-span-1'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-blue-500/10 text-blue-600'>
                  <Leaf className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Total tCO2e</div>
                  <div className='text-xl font-bold'>{loading ? '...' : `${totalTco2e.toFixed(1)}`}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings List */}
        {loading ? (
          <div className='flex flex-col items-center justify-center h-64 border rounded-xl bg-card'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600 mb-2' />
            <p className='text-sm text-muted-foreground'>Loading portfolio holdings...</p>
          </div>
        ) : credits.length === 0 ? (
          <Card className='border-dashed shadow-none'>
            <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='p-4 rounded-full bg-blue-500/10 text-blue-600 mb-4'>
                <Wallet className='h-10 w-10' />
              </div>
              <h3 className='text-lg font-semibold'>No Carbon Credits in Custody</h3>
              <p className='text-sm text-muted-foreground max-w-md mt-1 mb-6'>
                You have not purchased any verified blue carbon credits yet. Browse the marketplace to acquire tokens.
              </p>
              <Link href='/dashboard/buyer/marketplace'>
                <Button className='gap-2 bg-blue-600 hover:bg-blue-700 text-white'>
                  <Leaf className='h-4 w-4' />
                  Explore Marketplace
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {credits.map((credit) => (
              <Card key={credit.id} className='border shadow-xs'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <span className='text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground'>
                        Token #{credit.onchainCreditId}
                      </span>
                      <CardTitle className='text-base font-semibold mt-2'>
                        {credit.parcel?.parcelName || 'Mangrove Conservation Reserve'}
                      </CardTitle>
                      <CardDescription className='text-xs mt-0.5'>
                        {credit.amount} tCO2e · Vintage {credit.vintage} · <span className='text-amber-500 font-medium'>AAA (Sylvera)</span>
                      </CardDescription>
                    </div>
                    <Badge
                      variant='outline'
                      className={
                        credit.status === 'RETIRED'
                          ? 'bg-muted text-muted-foreground border-muted shrink-0'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0'
                      }
                    >
                      {credit.status === 'RETIRED' ? 'PERMANENTLY RETIRED' : 'ACTIVE CUSTODY'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className='pt-0 space-y-3'>
                  {credit.retiredReason && (
                    <div className='text-xs text-amber-600 italic bg-amber-500/10 rounded-md p-2.5 border border-amber-500/20'>
                      Retirement Purpose: &quot;{credit.retiredReason}&quot;
                    </div>
                  )}
                  <div className='text-[11px] text-muted-foreground font-mono truncate'>
                    Blockchain Tx: {credit.blockchainTxHash}
                  </div>

                  {/* Retire form */}
                  {credit.status === 'SOLD' && retiringId === credit.id && (
                    <div className='p-3 bg-muted/50 border rounded-lg space-y-2.5'>
                      <Label className='text-xs font-semibold'>Corporate Retirement Purpose</Label>
                      <Input
                        value={retirementReason}
                        onChange={(e) => setRetirementReason(e.target.value)}
                        className='h-8 text-xs'
                        placeholder='e.g. FY2026 Scope 1 & 2 ESG Carbon Neutrality'
                      />
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-7 text-xs'
                          onClick={() => setRetiringId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size='sm'
                          className='h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1'
                          onClick={() => handleRetire(credit.id)}
                          disabled={processingId === credit.id}
                        >
                          {processingId === credit.id ? (
                            <Loader2 className='h-3 w-3 animate-spin' />
                          ) : (
                            <Lock className='h-3 w-3' />
                          )}
                          Confirm & Retire
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className='border-t pt-3 flex items-center justify-between gap-3'>
                  <Link href={`/verify/${credit.onchainCreditId}`}>
                    <Button variant='ghost' size='sm' className='h-8 gap-1 text-xs'>
                      <ExternalLink className='h-3.5 w-3.5' />
                      Public Certificate
                    </Button>
                  </Link>

                  {credit.status === 'SOLD' && retiringId !== credit.id && (
                    <Button
                      size='sm'
                      className='gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs'
                      onClick={() => setRetiringId(credit.id)}
                    >
                      <ShieldCheck className='h-3.5 w-3.5' />
                      Retire for Net-Zero
                    </Button>
                  )}

                  {credit.status === 'RETIRED' && (
                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                      Permanently Retired
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
