'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { useAppForm } from '@/lib/form';
import { buyerRegistrationSchema, BuyerRegistrationInput } from '../schemas/onboarding-schema';
import { registerBuyerAction } from '../actions/onboarding-actions';
import { toast } from 'sonner';
import { ShoppingCart, ArrowLeft, Building2, Wallet, Target, CheckCircle2 } from 'lucide-react';

const BUYER_TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Individual Offsetting / Retail' },
  { value: 'COMPANY', label: 'Enterprise / Corporate Organization' }
];

const INDUSTRY_OPTIONS = [
  { value: 'Technology & Software', label: 'Technology & Software' },
  { value: 'Energy & Utilities', label: 'Energy & Utilities' },
  { value: 'Manufacturing & Industrial', label: 'Manufacturing & Industrial' },
  { value: 'Transportation & Logistics', label: 'Transportation & Logistics' },
  { value: 'Financial Services & Banking', label: 'Financial Services & Banking' },
  { value: 'Retail & Consumer Goods', label: 'Retail & Consumer Goods' },
  { value: 'Real Estate & Construction', label: 'Real Estate & Construction' },
  { value: 'Other / Non-profit', label: 'Other / Non-profit' }
];

interface BuyerFormProps {
  initialData?: Partial<BuyerRegistrationInput>;
  onBack: () => void;
  onSuccess: (result: { role: string; profile: Record<string, unknown> }) => void;
}

export function BuyerForm({ initialData, onBack, onSuccess }: BuyerFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useAppForm({
    defaultValues: {
      buyerType: (initialData?.buyerType || 'COMPANY') as 'INDIVIDUAL' | 'COMPANY',
      companyName: initialData?.companyName ?? '',
      industry: initialData?.industry ?? '',
      annualEmissionsTco2e: initialData?.annualEmissionsTco2e ?? undefined,
      wantedCredits: initialData?.wantedCredits ?? 500,
      contactPhone: initialData?.contactPhone ?? '',
      walletAddress: initialData?.walletAddress ?? ''
    } as BuyerRegistrationInput,
    validators: {
      onSubmit: buyerRegistrationSchema
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        try {
          const res = await registerBuyerAction(value);
          if (res.success && res.data) {
            toast.success('Credit Buyer profile created successfully!');
            onSuccess({
              role: res.data.role,
              profile: res.data.profile
            });
          } else {
            toast.error(res.error || 'Failed to save Buyer profile');
          }
        } catch (err: any) {
          toast.error(err?.message || 'Unexpected error while registering profile');
        }
      });
    }
  });

  return (
    <div className='w-full max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-300'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5'>
        <div className='flex items-center gap-3'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={onBack}
            className='h-9 w-9 rounded-lg border shrink-0'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs font-semibold'>
                Buyer Registration
              </Badge>
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-foreground mt-1'>
              Complete Your Buyer Account Setup
            </h2>
          </div>
        </div>
        <div className='text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 self-start sm:self-auto'>
          <ShoppingCart className='h-3.5 w-3.5 text-blue-500' />
          <span>Carbon Offsetting Portfolio</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className='space-y-6'
      >
        {/* Buyer Identity */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <Building2 className='h-5 w-5 text-blue-600' />
              <CardTitle className='text-lg'>Buyer Classification</CardTitle>
            </div>
            <CardDescription>
              Select whether you are purchasing credits as an individual or on behalf of an organization.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField
                name='buyerType'
                children={(field) => (
                  <field.SelectField
                    label='Buyer Category'
                    required
                    placeholder='Select category'
                    options={BUYER_TYPE_OPTIONS}
                  />
                )}
              />

              <form.Subscribe selector={(state) => state.values.buyerType}>
                {(buyerType) => (
                  <form.AppField
                    name='companyName'
                    children={(field) => (
                      <field.TextField
                        label='Company / Entity Name'
                        required={buyerType === 'COMPANY'}
                        placeholder={
                          buyerType === 'COMPANY'
                            ? 'e.g. Acme CleanTech Global Corp'
                            : 'Optional for individuals'
                        }
                      />
                    )}
                  />
                )}
              </form.Subscribe>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField
                name='industry'
                children={(field) => (
                  <field.SelectField
                    label='Industry Sector'
                    placeholder='Select industry sector'
                    options={INDUSTRY_OPTIONS}
                  />
                )}
              />

              <form.AppField
                name='contactPhone'
                children={(field) => (
                  <field.TextField
                    label='Primary Phone Number'
                    type='tel'
                    required
                    placeholder='e.g. +1 (555) 019-2834'
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Carbon Offset Goals */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <Target className='h-5 w-5 text-blue-600' />
              <CardTitle className='text-lg'>Carbon Targets & Demand Scope</CardTitle>
            </div>
            <CardDescription>
              Help us tailor marketplace matching based on your annual footprint and target offset volume.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField
                name='annualEmissionsTco2e'
                children={(field) => (
                  <field.TextField
                    label='Annual Carbon Emissions (tCO2e)'
                    type='number'
                    placeholder='e.g. 2500'
                    description='Estimated Scope 1/2/3 emissions to offset'
                  />
                )}
              />

              <form.AppField
                name='wantedCredits'
                children={(field) => (
                  <field.TextField
                    label='Target Credits to Purchase (tCO2e)'
                    type='number'
                    required
                    placeholder='e.g. 500'
                    description='1 Credit = 1 Metric Ton of verified CO2 equivalent'
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Web3 Wallet Settlement */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <Wallet className='h-5 w-5 text-blue-600' />
              <CardTitle className='text-lg'>Settlement & Retirement Wallet</CardTitle>
            </div>
            <CardDescription>
              Your EVM wallet address for receiving and retiring credits on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppField
              name='walletAddress'
              children={(field) => (
                <field.TextField
                  label='EVM Wallet Address (Ethereum / Hardhat)'
                  placeholder='0x98b...41a2'
                  description='You can also connect and switch your Web3 wallet at any time on the marketplace'
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className='flex items-center justify-between pt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onBack}
            disabled={isPending}
            className='gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Change Role
          </Button>

          <LoadingButton
            type='submit'
            loading={isPending}
            className='gap-2 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold'
          >
            <span>Complete Registration</span>
            <CheckCircle2 className='h-4 w-4' />
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
