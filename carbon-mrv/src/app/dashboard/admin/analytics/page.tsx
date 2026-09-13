'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Users,
  MapPin,
  Sparkles,
  ShieldCheck,
  CircleDollarSign,
  Layers,
  TrendingUp,
  Flame,
  Clock
} from 'lucide-react';
import { getAdminAnalyticsAction } from '@/features/buyer/actions/buyer-actions';
import { toast } from 'sonner';

interface AnalyticsData {
  totalUsers: number;
  totalParcels: number;
  pendingReviews: number;
  totalCredits: number;
  issuedCredits: number;
  soldCredits: number;
  retiredCredits: number;
  totalTransactions: number;
  totalAreaHa: number;
  totalClaimedCredits: number;
  totalRetiredTco2e: number;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconClass
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconClass: string;
}) => (
  <Card className='border shadow-xs'>
    <CardContent className='p-5'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm text-muted-foreground font-medium'>{title}</p>
          <p className='text-2xl font-bold mt-1'>{value}</p>
          {subtitle && <p className='text-xs text-muted-foreground mt-0.5'>{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconClass}`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getAdminAnalyticsAction();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || 'Failed to load analytics');
      }
      setLoading(false);
    })();
  }, []);

  return (
    <PageContainer>
      <div className='space-y-6 animate-in fade-in-50 duration-300'>
        {/* Header */}
        <div className='border-b pb-5'>
          <Badge variant='outline' className='bg-purple-500/10 text-purple-600 border-purple-500/30 text-xs font-semibold mb-2'>
            Admin Dashboard
          </Badge>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>Platform Analytics</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            End-to-end visibility into the VanaDhara ecosystem — from land registration to credit retirement.
          </p>
        </div>

        {loading ? (
          <div className='flex flex-col items-center justify-center h-64 border rounded-xl bg-card'>
            <Loader2 className='h-8 w-8 animate-spin text-primary mb-2' />
            <p className='text-sm text-muted-foreground'>Loading platform analytics...</p>
          </div>
        ) : data ? (
          <div className='space-y-6'>
            {/* Users & Parcels */}
            <div>
              <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3'>Users & Land</h2>
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                <StatCard
                  title='Total Users'
                  value={data.totalUsers}
                  subtitle='All roles'
                  icon={<Users className='h-5 w-5' />}
                  iconClass='bg-primary/10 text-primary'
                />
                <StatCard
                  title='Total Parcels'
                  value={data.totalParcels}
                  subtitle='Registered land sites'
                  icon={<MapPin className='h-5 w-5' />}
                  iconClass='bg-emerald-500/10 text-emerald-600'
                />
                <StatCard
                  title='Pending Reviews'
                  value={data.pendingReviews}
                  subtitle='In approver queue'
                  icon={<Clock className='h-5 w-5' />}
                  iconClass='bg-amber-500/10 text-amber-600'
                />
                <StatCard
                  title='Total Area'
                  value={`${data.totalAreaHa.toFixed(2)} ha`}
                  subtitle='Across all parcels'
                  icon={<Layers className='h-5 w-5' />}
                  iconClass='bg-blue-500/10 text-blue-600'
                />
              </div>
            </div>

            {/* Credits */}
            <div>
              <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3'>Carbon Credits</h2>
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                <StatCard
                  title='Total Credits'
                  value={data.totalCredits}
                  subtitle='All states'
                  icon={<Sparkles className='h-5 w-5' />}
                  iconClass='bg-purple-500/10 text-purple-600'
                />
                <StatCard
                  title='Issued (Available)'
                  value={data.issuedCredits}
                  subtitle='Ready to purchase'
                  icon={<TrendingUp className='h-5 w-5' />}
                  iconClass='bg-emerald-500/10 text-emerald-600'
                />
                <StatCard
                  title='Sold'
                  value={data.soldCredits}
                  subtitle='In buyer custody'
                  icon={<CircleDollarSign className='h-5 w-5' />}
                  iconClass='bg-blue-500/10 text-blue-600'
                />
                <StatCard
                  title='Retired'
                  value={data.retiredCredits}
                  subtitle={`${data.totalRetiredTco2e.toFixed(1)} tCO2e offset`}
                  icon={<Flame className='h-5 w-5' />}
                  iconClass='bg-amber-500/10 text-amber-600'
                />
              </div>
            </div>

            {/* Transactions & Claims */}
            <div>
              <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3'>Transactions & Claims</h2>
              <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
                <StatCard
                  title='Total Transactions'
                  value={data.totalTransactions}
                  subtitle='On-chain events logged'
                  icon={<ShieldCheck className='h-5 w-5' />}
                  iconClass='bg-primary/10 text-primary'
                />
                <StatCard
                  title='Claimed Credits'
                  value={`${data.totalClaimedCredits.toFixed(1)} tCO2e`}
                  subtitle='By generators (unverified claims)'
                  icon={<Sparkles className='h-5 w-5' />}
                  iconClass='bg-emerald-500/10 text-emerald-600'
                />
                <StatCard
                  title='Verified Sequestration'
                  value={`${data.totalRetiredTco2e.toFixed(1)} tCO2e`}
                  subtitle='Permanently retired offset'
                  icon={<Flame className='h-5 w-5' />}
                  iconClass='bg-amber-500/10 text-amber-600'
                />
              </div>
            </div>

            {/* Credit Pipeline Summary */}
            <Card className='border shadow-xs'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Credit Lifecycle Pipeline</CardTitle>
                <CardDescription className='text-xs'>
                  Distribution of total carbon credits across lifecycle states
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {data.totalCredits > 0 ? (
                  <>
                    {[
                      { label: 'Available (ISSUED)', count: data.issuedCredits, color: 'bg-emerald-500' },
                      { label: 'In Custody (SOLD)', count: data.soldCredits, color: 'bg-blue-500' },
                      { label: 'Retired', count: data.retiredCredits, color: 'bg-amber-500' }
                    ].map(({ label, count, color }) => {
                      const pct = data.totalCredits > 0 ? (count / data.totalCredits) * 100 : 0;
                      return (
                        <div key={label} className='space-y-1'>
                          <div className='flex items-center justify-between text-xs'>
                            <span className='text-muted-foreground'>{label}</span>
                            <span className='font-semibold'>{count} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className='h-2 bg-muted rounded-full overflow-hidden'>
                            <div
                              className={`h-full ${color} rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p className='text-sm text-muted-foreground text-center py-4'>No credits minted yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='bg-card border rounded-xl p-12 text-center'>
            <p className='text-muted-foreground'>Failed to load analytics data.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
