import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { getRegistrationStatusAction } from '@/features/onboarding/actions/onboarding-actions';
import { getAllParcelsAction } from '@/features/parcels/actions/parcel-actions';
import { getAllCreditsAction, getAllUsersAction } from '@/features/buyer/actions/buyer-actions';
import React from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

async function getOverviewData(role: string) {
  if (role === 'GENERATOR') {
    const parcels = await getAllParcelsAction();
    const data = parcels.data ?? [];
    return {
      cards: [
        {
          label: 'My Parcels',
          value: data.length,
          trend: '--',
          footer: 'Registered land parcels',
          sub: 'Total sites under MRV'
        },
        {
          label: 'Total Area',
          value: `${data.reduce((a: number, p: any) => a + (p.totalAreaHa || 0), 0).toFixed(1)} ha`,
          trend: '--',
          footer: 'Combined area',
          sub: 'Across all parcels'
        },
        {
          label: 'Under Review',
          value: data.filter((p: any) => p.status === 'PENDING_REVIEW').length,
          trend: '--',
          footer: 'Pending approver',
          sub: 'Awaiting verification'
        },
        {
          label: 'Claimed Credits',
          value: `${data.reduce((a: number, p: any) => a + (p.claimedCredits || 0), 0).toFixed(0)} tCO2e`,
          trend: '--',
          footer: 'Estimated potential',
          sub: 'Subject to MRV audit'
        }
      ],
      cta: { href: '/dashboard/generator/parcels/new', label: 'Register New Land', icon: 'plus' }
    };
  }

  if (role === 'BUYER') {
    const credits = await getAllCreditsAction();
    const data = credits.data ?? [];
    const available = data.filter((c: any) => c.status === 'ISSUED');
    const held = data.filter((c: any) => c.status === 'SOLD');
    const retired = data.filter((c: any) => c.status === 'RETIRED');
    return {
      cards: [
        {
          label: 'Available Credits',
          value: available.length,
          trend: '--',
          footer: 'Ready to purchase',
          sub: 'In marketplace'
        },
        {
          label: 'My Holdings',
          value: held.length,
          trend: '--',
          footer: 'In custody',
          sub: 'Active tokens owned'
        },
        {
          label: 'Retired',
          value: retired.length,
          trend: '--',
          footer: 'ESG offset locked',
          sub: 'Permanently retired'
        },
        {
          label: 'tCO2e Offset',
          value: `${retired.reduce((a: number, c: any) => a + (c.amount || 0), 0).toFixed(1)}`,
          trend: '--',
          footer: 'Carbon offset',
          sub: 'Verified tCO2e'
        }
      ],
      cta: { href: '/dashboard/buyer/marketplace', label: 'Browse Marketplace', icon: 'kanban' }
    };
  }

  if (role === 'APPROVER') {
    const parcels = await getAllParcelsAction();
    const data = parcels.data ?? [];
    return {
      cards: [
        {
          label: 'Review Queue',
          value: data.filter((p: any) => p.status === 'PENDING_REVIEW').length,
          trend: '--',
          footer: 'Awaiting your review',
          sub: 'Submitted by generators'
        },
        {
          label: 'Total Parcels',
          value: data.length,
          trend: '--',
          footer: 'Platform-wide',
          sub: 'All registered land'
        },
        {
          label: 'Approved',
          value: data.filter((p: any) => p.status === 'ACTIVE').length,
          trend: '--',
          footer: 'Verified parcels',
          sub: 'Credits issued'
        },
        {
          label: 'Rejected',
          value: data.filter((p: any) => p.status === 'REJECTED').length,
          trend: '--',
          footer: 'Did not pass review',
          sub: 'Awaiting resubmission'
        }
      ],
      cta: { href: '/dashboard/approver/queue', label: 'Open Review Queue', icon: 'check' }
    };
  }

  // ADMIN — full overview
  const [parcelsRes, creditsRes, usersRes] = await Promise.all([
    getAllParcelsAction(),
    getAllCreditsAction(),
    getAllUsersAction()
  ]);
  const parcels = parcelsRes.data ?? [];
  const credits = creditsRes.data ?? [];
  const users = usersRes.data ?? [];
  return {
    cards: [
      {
        label: 'Total Credits Issued',
        value: credits.length,
        trend: '--',
        footer: 'All lifecycle states',
        sub: 'Platform total'
      },
      {
        label: 'Active Parcels',
        value: parcels.filter((p: any) => p.status === 'ACTIVE').length,
        trend: '--',
        footer: 'Verified & approved',
        sub: 'Total managed area'
      },
      {
        label: 'Pending Reviews',
        value: parcels.filter((p: any) => p.status === 'PENDING_REVIEW').length,
        trend: '--',
        footer: 'In approver queue',
        sub: 'Awaiting approver action'
      },
      {
        label: 'Total Users',
        value: users.length,
        trend: '--',
        footer: 'All roles',
        sub: 'Registered on platform'
      }
    ],
    cta: { href: '/dashboard/admin/analytics', label: 'View Analytics', icon: 'trendingUp' }
  };
}

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const statusRes = await getRegistrationStatusAction();
  const role = statusRes.data?.role || 'GENERATOR';
  const userName = statusRes.data?.user?.name?.split(' ')[0] || 'there';

  const roleLabels: Record<string, { label: string; badgeClass: string }> = {
    ADMIN: { label: 'Admin Dashboard', badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
    APPROVER: { label: 'Approver Dashboard', badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    GENERATOR: { label: 'Generator Dashboard', badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    BUYER: { label: 'Buyer Dashboard', badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30' }
  };

  const { label: roleLabel, badgeClass } = roleLabels[role] || roleLabels.GENERATOR;

  let overviewData;
  try {
    overviewData = await getOverviewData(role);
  } catch {
    overviewData = null;
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        {/* Header */}
        <div className='flex items-center justify-between border-b pb-5'>
          <div>
            <Badge variant='outline' className={cn('text-xs font-semibold mb-2', badgeClass)}>
              {roleLabel}
            </Badge>
            <h2 className='flex items-center text-2xl font-bold tracking-tight'>
              Welcome back, {userName}! <Icons.hand className='ml-2 h-6 w-6 text-yellow-500' />
            </h2>
            <p className='text-sm text-muted-foreground mt-1'>Here's what's happening on your dashboard today.</p>
          </div>
          {overviewData?.cta && (
            <Link
              href={overviewData.cta.href}
              className={cn(buttonVariants({ size: 'sm' }), 'gap-2 hidden sm:flex')}
            >
              {overviewData.cta.label}
            </Link>
          )}
        </div>

        {/* Stat Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {overviewData?.cards.map((card) => (
            <Card key={card.label} className='@container/card'>
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {card.value}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline'>
                    <Icons.trendingUp />
                    {card.trend}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>{card.footer}</div>
                <div className='text-muted-foreground'>{card.sub}</div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Parallel route slots */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 min-h-0 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
