'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { CheckCircle2, Trees, ShoppingCart, ArrowRight, ShieldCheck, MapPin, Building, Wallet, Sparkles, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistrationResultProps {
  role: string;
  profile: Record<string, any>;
  onReset?: () => void;
}

export function RegistrationResult({ role, profile, onReset: _onReset }: RegistrationResultProps) {
  const isGenerator = role === 'GENERATOR';

  return (
    <div className='w-full max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 fade-in-50 duration-500'>
      {/* Celebration Header */}
      <div className='text-center space-y-4'>
        <div className='inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5 mb-1'>
          <CheckCircle2 className='h-10 w-10 stroke-[2.5]' />
        </div>
        <div className='space-y-2'>
          <Badge
            variant='outline'
            className={cn(
              'px-3 py-1 text-xs uppercase tracking-wider font-semibold border',
              isGenerator
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
            )}
          >
            {isGenerator ? 'Generator Profile Activated' : 'Buyer Profile Activated'}
          </Badge>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl text-foreground'>
            Registration Successfully Completed!
          </h1>
          <p className='text-muted-foreground max-w-lg mx-auto text-sm sm:text-base'>
            Your {isGenerator ? 'Carbon Generator' : 'Credit Buyer'} profile has been verified and stored in the database.
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className='border shadow-md overflow-hidden'>
        <div
          className={cn(
            'h-2 w-full',
            isGenerator ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-500 to-indigo-400'
          )}
        />
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div
                className={cn(
                  'h-9 w-9 rounded-lg flex items-center justify-center',
                  isGenerator ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                )}
              >
                {isGenerator ? <Trees className='h-5 w-5' /> : <ShoppingCart className='h-5 w-5' />}
              </div>
              <div>
                <CardTitle className='text-xl'>
                  {profile.organizationName || profile.companyName || profile.contactPerson || profile.name || 'Account Summary'}
                </CardTitle>
                <CardDescription className='text-xs'>
                  Role ID: <code className='text-foreground font-mono'>{role}</code> &middot; Status:{' '}
                  <span className='text-emerald-600 font-semibold'>ACTIVE</span>
                </CardDescription>
              </div>
            </div>
            <Badge variant='secondary' className='text-xs font-medium'>
              {isGenerator ? profile.entityType : profile.buyerType}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-4 pt-2 text-sm'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-4 rounded-xl border'>
            {isGenerator ? (
              <>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                    <Building className='h-3.5 w-3.5' /> Entity Type
                  </span>
                  <p className='font-medium text-foreground'>{profile.entityType}</p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                    <MapPin className='h-3.5 w-3.5' /> Location
                  </span>
                  <p className='font-medium text-foreground'>
                    {[profile.village, profile.district, profile.state].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground'>Contact Representative</span>
                  <p className='font-medium text-foreground'>{profile.contactPerson} ({profile.contactPhone})</p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                    <ShieldCheck className='h-3.5 w-3.5 text-emerald-500' /> Compliance Readiness
                  </span>
                  <div className='flex items-center gap-1.5 flex-wrap pt-0.5'>
                    {profile.hasLegalPermits && <Badge variant='outline' className='text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20'>Land Title</Badge>}
                    {profile.hasSurveyReport && <Badge variant='outline' className='text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20'>Survey</Badge>}
                    {profile.hasEnvironmentalClearance && <Badge variant='outline' className='text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20'>CRZ/Clearance</Badge>}
                    {!profile.hasLegalPermits && !profile.hasSurveyReport && !profile.hasEnvironmentalClearance && (
                      <span className='text-xs text-muted-foreground'>Pending uploads</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                    <Building className='h-3.5 w-3.5' /> Organization / Buyer
                  </span>
                  <p className='font-medium text-foreground'>{profile.companyName || 'Individual Retail Buyer'}</p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground'>Industry Sector</span>
                  <p className='font-medium text-foreground'>{profile.industry || 'General Offsets'}</p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground'>Target Offset Demand</span>
                  <p className='font-medium text-foreground'>{profile.wantedCredits?.toLocaleString() || 0} tCO2e Credits</p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground'>Annual Footprint</span>
                  <p className='font-medium text-foreground'>
                    {profile.annualEmissionsTco2e ? `${profile.annualEmissionsTco2e.toLocaleString()} tCO2e/yr` : 'Not specified'}
                  </p>
                </div>
              </>
            )}

            {profile.walletAddress && (
              <div className='sm:col-span-2 space-y-1 border-t pt-2.5 mt-1'>
                <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                  <Wallet className='h-3.5 w-3.5' /> Registered Settlement Wallet
                </span>
                <p className='font-mono text-xs text-foreground truncate bg-background p-2 rounded-md border'>
                  {profile.walletAddress}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className='flex flex-col sm:flex-row gap-3 pt-2 bg-muted/20 border-t'>
          {isGenerator ? (
            <>
              <Link
                href='/dashboard/generator/parcels/new'
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-xs'
                )}
              >
                <Sparkles className='h-4 w-4' />
                <span>Register First Land Parcel</span>
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                href='/dashboard/overview'
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto gap-2')}
              >
                <LayoutDashboard className='h-4 w-4' />
                <span>Go to Dashboard</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href='/dashboard/buyer/marketplace'
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-xs'
                )}
              >
                <ShoppingCart className='h-4 w-4' />
                <span>Browse Carbon Marketplace</span>
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                href='/dashboard/overview'
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto gap-2')}
              >
                <LayoutDashboard className='h-4 w-4' />
                <span>Go to Dashboard</span>
              </Link>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
