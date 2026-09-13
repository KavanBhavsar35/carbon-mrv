import { UserProfile } from '@clerk/nextjs';
import { getRegistrationStatusAction } from '@/features/onboarding/actions/onboarding-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Trees, ShoppingCart, ShieldCheck, Edit3, ArrowRight, UserCheck } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';

export default async function ProfileViewPage() {
  const statusRes = await getRegistrationStatusAction();
  const statusData = statusRes.success ? statusRes.data : undefined;
  const userRole = statusData?.role;
  const isGenerator = userRole === 'GENERATOR';
  const isBuyer = userRole === 'BUYER';
  const genProfile = statusData?.generatorProfile;
  const buyerProfile = statusData?.buyerProfile;

  return (
    <PageContainer>
      <div className='flex w-full flex-col gap-6'>
        {/* VanaDhara Profile Card */}
        {statusData?.isOnboarded && (isGenerator || isBuyer) && (
          <Card className='border shadow-xs overflow-hidden'>
            <div
              className={`h-1.5 w-full ${
                isGenerator
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-400'
              }`}
            />
            <CardHeader className='pb-3'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      isGenerator
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isGenerator ? <Trees className='h-6 w-6' /> : <ShoppingCart className='h-6 w-6' />}
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <CardTitle className='text-xl'>
                        {isGenerator
                          ? genProfile?.organizationName || genProfile?.contactPerson || 'Carbon Generator Profile'
                          : buyerProfile?.companyName || 'Credit Buyer Profile'}
                      </CardTitle>
                      <Badge
                        variant='outline'
                        className={`text-xs ${
                          isGenerator
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                        }`}
                      >
                        {userRole}
                      </Badge>
                    </div>
                    <CardDescription className='text-xs mt-0.5'>
                      Registered MRV Identity &middot; Database Synced
                    </CardDescription>
                  </div>
                </div>

                <Link
                  href={isGenerator ? '/dashboard/generator/onboarding' : '/dashboard/buyer/onboarding'}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2 shrink-0')}
                >
                  <Edit3 className='h-3.5 w-3.5' />
                  <span>Edit Profile Details</span>
                </Link>
              </div>
            </CardHeader>

            <CardContent className='pt-2'>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border text-xs'>
                {isGenerator && genProfile && (
                  <>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground'>Entity Type</span>
                      <p className='font-semibold text-foreground text-sm'>{genProfile.entityType}</p>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground'>Location</span>
                      <p className='font-semibold text-foreground text-sm'>
                        {[genProfile.village, genProfile.district, genProfile.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground'>Contact Phone</span>
                      <p className='font-semibold text-foreground text-sm'>{genProfile.contactPhone}</p>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground'>Compliance Status</span>
                      <p className='font-semibold text-emerald-600 text-sm flex items-center gap-1'>
                        <ShieldCheck className='h-4 w-4' />
                        {genProfile.hasLegalPermits ? 'Permits Verified' : 'Standard'}
                      </p>
                    </div>
                  </>
                )}

                {isBuyer && buyerProfile && (
                  <>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground'>Buyer Category</span>
                      <p className='font-semibold text-foreground text-sm'>{buyerProfile.buyerType}</p>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground'>Industry</span>
                      <p className='font-semibold text-foreground text-sm'>{buyerProfile.industry || 'General'}</p>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground'>Target Credits</span>
                      <p className='font-semibold text-foreground text-sm'>{buyerProfile.wantedCredits?.toLocaleString()} tCO2e</p>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-muted-foreground'>Annual Emissions</span>
                      <p className='font-semibold text-foreground text-sm'>
                        {buyerProfile.annualEmissionsTco2e ? `${buyerProfile.annualEmissionsTco2e} tCO2e` : 'N/A'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* If user not onboarded yet, show a CTA banner */}
        {(!statusData?.isOnboarded || (!isGenerator && !isBuyer && userRole !== 'ADMIN' && userRole !== 'APPROVER')) && (
          <Card className='border border-primary/20 bg-primary/5 shadow-xs p-5'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div className='space-y-1'>
                <h3 className='font-bold text-foreground text-base flex items-center gap-2'>
                  <UserCheck className='h-5 w-5 text-primary' />
                  Complete Your MRV Registration
                </h3>
                <p className='text-xs text-muted-foreground'>
                  You haven&apos;t set up your role as a Carbon Generator or Credit Buyer yet. Complete registration to unlock full platform features.
                </p>
              </div>
              <Link
                href='/dashboard/onboarding'
                className={cn(buttonVariants({ size: 'sm' }), 'gap-2 shrink-0')}
              >
                <span>Start Onboarding</span>
                <ArrowRight className='h-3.5 w-3.5' />
              </Link>
            </div>
          </Card>
        )}

        {/* Clerk User Profile */}
        <div className='flex w-full justify-center'>
          <UserProfile routing='hash' />
        </div>
      </div>
    </PageContainer>
  );
}
