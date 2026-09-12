import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

export default function LandingPage() {
  return (
    <div className='flex min-h-screen flex-col bg-background text-foreground'>
      <header className='flex items-center justify-between p-6 lg:px-8 border-b'>
        <div className='flex items-center gap-2'>
          <Icons.logo className='h-8 w-8 text-primary' />
          <span className='text-xl font-bold'>Carbon MRV</span>
        </div>
        <nav className='flex items-center gap-3'>
          <Link href='/demo' className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition">
            <span>✨</span> Live Judge Demo
          </Link>
          <Link href='/auth/sign-in' className={buttonVariants({ variant: 'ghost' })}>
            Sign In
          </Link>
          <Link href='/auth/sign-up' className={buttonVariants({ variant: 'default' })}>
            Get Started
          </Link>
        </nav>
      </header>

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='relative px-6 lg:px-8 py-24 sm:py-32 flex flex-col items-center text-center overflow-hidden'>
          <div className='absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background' />
          
          <h1 className='text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl'>
            Verifiable Carbon Credit & Offset Tracking Platform
          </h1>
          <p className='mt-6 text-lg leading-8 text-muted-foreground max-w-2xl'>
            Empowering the circular carbon ecosystem with transparent Measurement, Reporting, and Verification. 
            Connect buyers and generators with immutable on-chain tracking and AI-powered estimation.
          </p>
          <div className='mt-10 flex items-center justify-center gap-x-4 flex-wrap gap-y-3'>
            <Link
              href='/demo'
              className={cn(buttonVariants({ size: 'lg' }), 'gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg')}
            >
              <span>🚀</span> Launch Interactive Prototype Demo <Icons.chevronRight className='h-4 w-4' />
            </Link>
            <Link
              href='/verify/101'
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              View Public Certificate
            </Link>
          </div>
        </section>

        {/* References Section */}
        <section id='references' className='py-24 sm:py-32 bg-muted/30 border-t'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl text-center'>
              <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
                Why Carbon MRV?
              </h2>
              <p className='mt-4 text-lg leading-8 text-muted-foreground'>
                Our platform bridges the gap between grassroots conservation efforts and global ESG goals.
              </p>
            </div>
            
            <div className='mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none'>
              <dl className='grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3'>
                
                <div className='flex flex-col items-start'>
                  <div className='rounded-lg bg-primary/10 p-3 ring-1 ring-primary/20 mb-4'>
                    <Icons.map className='h-6 w-6 text-primary' />
                  </div>
                  <dt className='text-xl font-semibold leading-7'>Geospatial Verification</dt>
                  <dd className='mt-2 text-base leading-7 text-muted-foreground'>
                    Using satellite imagery and drone data, our integrated ML pipeline verifies land parcels 
                    and estimates carbon biomass with high confidence.
                  </dd>
                </div>
                
                <div className='flex flex-col items-start'>
                  <div className='rounded-lg bg-primary/10 p-3 ring-1 ring-primary/20 mb-4'>
                    <Icons.kanban className='h-6 w-6 text-primary' />
                  </div>
                  <dt className='text-xl font-semibold leading-7'>Transparent MRV Pipeline</dt>
                  <dd className='mt-2 text-base leading-7 text-muted-foreground'>
                    Strict workflows ensure all claims undergo rigorous estimation and human-in-the-loop 
                    approvals before any credits are minted.
                  </dd>
                </div>
                
                <div className='flex flex-col items-start'>
                  <div className='rounded-lg bg-primary/10 p-3 ring-1 ring-primary/20 mb-4'>
                    <Icons.wallet className='h-6 w-6 text-primary' />
                  </div>
                  <dt className='text-xl font-semibold leading-7'>On-Chain Tracking</dt>
                  <dd className='mt-2 text-base leading-7 text-muted-foreground'>
                    Every credit issued, sold, and retired is recorded immutably on the blockchain, 
                    preventing double-counting and ensuring 100% traceability.
                  </dd>
                </div>
                
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-t py-8 text-center text-sm text-muted-foreground'>
        <p>&copy; {new Date().getFullYear()} Carbon MRV. All rights reserved.</p>
      </footer>
    </div>
  );
}
