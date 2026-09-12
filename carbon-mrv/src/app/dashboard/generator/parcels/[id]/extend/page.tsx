import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Satellite, Layers, Leaf, Clock, Map, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function ExtendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const plannedFeatures = [
    {
      icon: <Satellite className='h-5 w-5' />,
      title: 'Satellite-assisted Boundary Extension',
      description:
        'Upload new GeoJSON or draw additional polygon areas directly on the satellite map. The system will automatically union geometries and re-calculate total area.',
      iconClass: 'bg-blue-500/10 text-blue-600'
    },
    {
      icon: <Layers className='h-5 w-5' />,
      title: 'Incremental Carbon Estimation',
      description:
        'The ML pipeline (PyTorch UAV allometry) will run a new canopy density estimation over the extended zone and compute incremental tCO2e potential.',
      iconClass: 'bg-emerald-500/10 text-emerald-600'
    },
    {
      icon: <ShieldCheck className='h-5 w-5' />,
      title: 'Re-Verification Workflow',
      description:
        'Extension requests enter a dedicated approver queue for human-in-the-loop review. Approved extensions increase the parcel\'s total area and credit ceiling.',
      iconClass: 'bg-purple-500/10 text-purple-600'
    },
    {
      icon: <Leaf className='h-5 w-5' />,
      title: 'Additional Credit Issuance',
      description:
        'Once verified, additional carbon credits are minted on-chain for the extended area. Credits are linked to the parent parcel token for full audit trail.',
      iconClass: 'bg-amber-500/10 text-amber-600'
    }
  ];

  return (
    <PageContainer>
      <div className='space-y-6 animate-in fade-in-50 duration-300 max-w-3xl'>
        {/* Header */}
        <div className='border-b pb-5'>
          <div className='flex items-center gap-2 mb-3'>
            <Link
              href={`/dashboard/generator/parcels/${id}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-2 -ml-3')}
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Parcel
            </Link>
          </div>

          <div className='flex items-start gap-3'>
            <div className='p-3 rounded-xl bg-primary/10 text-primary mt-0.5'>
              <Map className='h-6 w-6' />
            </div>
            <div>
              <div className='flex items-center gap-2 flex-wrap'>
                <h1 className='text-2xl font-bold tracking-tight'>Extend Parcel Area</h1>
                <Badge variant='outline' className='bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs font-semibold'>
                  Coming Soon
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground mt-1.5'>
                This feature allows you to expand your registered land boundary and claim additional
                carbon credits for the extended area through the MRV verification pipeline.
              </p>
            </div>
          </div>
        </div>

        {/* ETA Notice */}
        <Card className='border-amber-500/20 bg-amber-500/5 shadow-none'>
          <CardContent className='flex items-center gap-3 py-4 px-5'>
            <Clock className='h-5 w-5 text-amber-600 shrink-0' />
            <div>
              <p className='text-sm font-semibold text-amber-700 dark:text-amber-400'>Feature in Development</p>
              <p className='text-xs text-muted-foreground mt-0.5'>
                The parcel extension workflow is being built as part of Phase 2 of the Carbon MRV platform.
                You will receive a notification when it becomes available.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Planned Features */}
        <div>
          <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
            What the Extension Feature Will Include
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {plannedFeatures.map((f) => (
              <Card key={f.title} className='border shadow-xs'>
                <CardHeader className='pb-2 pt-5 px-5'>
                  <div className={`p-2.5 rounded-lg ${f.iconClass} w-fit mb-2`}>{f.icon}</div>
                  <CardTitle className='text-sm font-semibold leading-snug'>{f.title}</CardTitle>
                </CardHeader>
                <CardContent className='px-5 pb-5 pt-0'>
                  <CardDescription className='text-xs leading-relaxed'>
                    {f.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Back CTA */}
        <div className='flex gap-3 pt-2'>
          <Link
            href={`/dashboard/generator/parcels/${id}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Return to Parcel Details
          </Link>
          <Link
            href='/dashboard/generator/parcels'
            className={buttonVariants({ variant: 'ghost' })}
          >
            View All Parcels
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
