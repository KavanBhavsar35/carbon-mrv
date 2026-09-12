'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Trees, ShoppingCart, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export type SelectedRole = 'GENERATOR' | 'BUYER';

interface RoleSelectorProps {
  selectedRole: SelectedRole | null;
  onSelectRole: (role: SelectedRole) => void;
  onContinue: () => void;
}

export function RoleSelector({ selectedRole, onSelectRole, onContinue }: RoleSelectorProps) {
  const handleKeyDown = (e: React.KeyboardEvent, role: SelectedRole) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectRole(role);
    }
  };

  return (
    <div className='w-full max-w-4xl mx-auto space-y-8 animate-in fade-in-50 duration-500'>
      <div className='text-center space-y-3'>
        <Badge variant='outline' className='px-3 py-1 text-xs uppercase tracking-wider font-semibold border-primary/30 text-primary bg-primary/5'>
          Step 1 &middot; Account Identity
        </Badge>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl text-foreground'>
          How will you participate in Carbon MRV?
        </h1>
        <p className='text-muted-foreground max-w-xl mx-auto text-sm sm:text-base'>
          Select your primary role in the ecosystem. Your selection customizes your dashboard, verification workflows, and on-chain interactions.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-2'>
        {/* Generator Card */}
        <button
          type='button'
          aria-label='Select Carbon Generator Role'
          onClick={() => onSelectRole('GENERATOR')}
          onKeyDown={(e) => handleKeyDown(e, 'GENERATOR')}
          className={cn(
            'group relative rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer bg-card/60 backdrop-blur-xs flex flex-col justify-between text-left hover:shadow-lg hover:border-emerald-500/60 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-emerald-500/30',
            selectedRole === 'GENERATOR'
              ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/15 shadow-md'
              : 'border-border/80 hover:bg-card/90'
          )}
        >
          <div className='space-y-4 w-full'>
            <div className='flex items-center justify-between'>
              <div
                className={cn(
                  'h-13 w-13 rounded-xl flex items-center justify-center transition-colors',
                  selectedRole === 'GENERATOR'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20'
                )}
              >
                <Trees className='h-7 w-7' />
              </div>
              <div
                className={cn(
                  'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all',
                  selectedRole === 'GENERATOR'
                    ? 'border-emerald-600 bg-emerald-600 text-white scale-110'
                    : 'border-muted-foreground/30'
                )}
              >
                {selectedRole === 'GENERATOR' && <Check className='h-3.5 w-3.5 stroke-[3]' />}
              </div>
            </div>

            <div>
              <div className='flex items-center gap-2'>
                <h3 className='text-xl font-bold text-foreground'>Carbon Generator</h3>
                <Badge variant='secondary' className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs'>
                  Supply Side
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground mt-2 leading-relaxed'>
                Landowners, Forest Communities, Panchayats, NGOs, and Agribusinesses creating and minting verified carbon credits.
              </p>
            </div>

            <div className='pt-2 space-y-2.5 border-t border-border/50 text-xs text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <ShieldCheck className='h-4 w-4 text-emerald-500 shrink-0' />
                <span>Register land parcels & geofence polygon boundaries</span>
              </div>
              <div className='flex items-center gap-2'>
                <Cpu className='h-4 w-4 text-emerald-500 shrink-0' />
                <span>Upload Drone & Satellite imagery for AI MRV estimate</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='h-4 w-4 text-emerald-500 shrink-0' />
                <span>Earn on-chain carbon credits for verified offsets</span>
              </div>
            </div>
          </div>

          <div className='mt-6 pt-4 w-full'>
            <div
              className={cn(
                'text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors',
                selectedRole === 'GENERATOR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground group-hover:text-foreground'
              )}
            >
              <span>{selectedRole === 'GENERATOR' ? 'Role Selected' : 'Select Generator'}</span>
              <ArrowRight className='h-3.5 w-3.5' />
            </div>
          </div>
        </button>

        {/* Credit Buyer Card */}
        <button
          type='button'
          aria-label='Select Credit Buyer Role'
          onClick={() => onSelectRole('BUYER')}
          onKeyDown={(e) => handleKeyDown(e, 'BUYER')}
          className={cn(
            'group relative rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer bg-card/60 backdrop-blur-xs flex flex-col justify-between text-left hover:shadow-lg hover:border-blue-500/60 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-blue-500/30',
            selectedRole === 'BUYER'
              ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/15 shadow-md'
              : 'border-border/80 hover:bg-card/90'
          )}
        >
          <div className='space-y-4 w-full'>
            <div className='flex items-center justify-between'>
              <div
                className={cn(
                  'h-13 w-13 rounded-xl flex items-center justify-center transition-colors',
                  selectedRole === 'BUYER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20'
                )}
              >
                <ShoppingCart className='h-7 w-7' />
              </div>
              <div
                className={cn(
                  'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all',
                  selectedRole === 'BUYER'
                    ? 'border-blue-600 bg-blue-600 text-white scale-110'
                    : 'border-muted-foreground/30'
                )}
              >
                {selectedRole === 'BUYER' && <Check className='h-3.5 w-3.5 stroke-[3]' />}
              </div>
            </div>

            <div>
              <div className='flex items-center gap-2'>
                <h3 className='text-xl font-bold text-foreground'>Credit Buyer</h3>
                <Badge variant='secondary' className='bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs'>
                  Demand Side
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground mt-2 leading-relaxed'>
                Enterprises, ESG funds, and Organizations purchasing and retiring verified carbon credits to offset emissions.
              </p>
            </div>

            <div className='pt-2 space-y-2.5 border-t border-border/50 text-xs text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <ShieldCheck className='h-4 w-4 text-blue-500 shrink-0' />
                <span>Browse transparent, verifiable carbon marketplace</span>
              </div>
              <div className='flex items-center gap-2'>
                <Cpu className='h-4 w-4 text-blue-500 shrink-0' />
                <span>Instant on-chain settlement & transparent pricing</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='h-4 w-4 text-blue-500 shrink-0' />
                <span>Retire credits on-chain with immutable proof of offset</span>
              </div>
            </div>
          </div>

          <div className='mt-6 pt-4 w-full'>
            <div
              className={cn(
                'text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors',
                selectedRole === 'BUYER' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground group-hover:text-foreground'
              )}
            >
              <span>{selectedRole === 'BUYER' ? 'Role Selected' : 'Select Buyer'}</span>
              <ArrowRight className='h-3.5 w-3.5' />
            </div>
          </div>
        </button>
      </div>

      <div className='flex justify-center pt-4'>
        <Button
          size='lg'
          disabled={!selectedRole}
          onClick={onContinue}
          className='px-8 h-12 text-base font-semibold shadow-md transition-all gap-2'
        >
          <span>Continue with {selectedRole === 'GENERATOR' ? 'Generator Setup' : selectedRole === 'BUYER' ? 'Buyer Setup' : 'Selection'}</span>
          <ArrowRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
