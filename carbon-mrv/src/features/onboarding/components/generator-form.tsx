'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { useAppForm } from '@/lib/form';
import { generatorRegistrationSchema, GeneratorRegistrationInput } from '../schemas/onboarding-schema';
import { registerGeneratorAction } from '../actions/onboarding-actions';
import { toast } from 'sonner';
import { Trees, ArrowLeft, ShieldCheck, MapPin, Building, User, CheckCircle2 } from 'lucide-react';

const ENTITY_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Individual Landowner' },
  { value: 'NGO', label: 'Non-Governmental Organization (NGO)' },
  { value: 'PANCHAYAT', label: 'Gram Panchayat / Village Council' },
  { value: 'COMMUNITY', label: 'Community / Forest Group' },
  { value: 'COMPANY', label: 'Private Corporation / Agribusiness' }
];

interface GeneratorFormProps {
  initialData?: Partial<GeneratorRegistrationInput>;
  onBack: () => void;
  onSuccess: (result: { role: string; profile: Record<string, unknown> }) => void;
}

export function GeneratorForm({ initialData, onBack, onSuccess }: GeneratorFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useAppForm({
    defaultValues: {
      entityType: (initialData?.entityType || 'INDIVIDUAL') as 'INDIVIDUAL' | 'NGO' | 'PANCHAYAT' | 'COMMUNITY' | 'COMPANY',
      organizationName: initialData?.organizationName ?? '',
      contactPerson: initialData?.contactPerson ?? '',
      contactPhone: initialData?.contactPhone ?? '',
      state: initialData?.state ?? '',
      district: initialData?.district ?? '',
      village: initialData?.village ?? '',
      registrationNumber: initialData?.registrationNumber ?? '',
      walletAddress: initialData?.walletAddress ?? '',
      hasLegalPermits: initialData?.hasLegalPermits ?? false,
      hasSurveyReport: initialData?.hasSurveyReport ?? false,
      hasEnvironmentalClearance: initialData?.hasEnvironmentalClearance ?? false
    } as GeneratorRegistrationInput,
    validators: {
      onSubmit: generatorRegistrationSchema
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        try {
          const res = await registerGeneratorAction(value);
          if (res.success && res.data) {
            toast.success('Generator profile created successfully!');
            onSuccess({
              role: res.data.role,
              profile: res.data.profile
            });
          } else {
            toast.error(res.error || 'Failed to save Generator profile');
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
              <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold'>
                Generator Registration
              </Badge>
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-foreground mt-1'>
              Complete Your Generator Profile
            </h2>
          </div>
        </div>
        <div className='text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 self-start sm:self-auto'>
          <Trees className='h-3.5 w-3.5 text-emerald-500' />
          <span>MRV Supply Pipeline</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className='space-y-6'
      >
        {/* Entity & Organization Details */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <Building className='h-5 w-5 text-emerald-600' />
              <CardTitle className='text-lg'>Entity & Legal Structure</CardTitle>
            </div>
            <CardDescription>
              Specify your organizational type and official registration details.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField
                name='entityType'
                children={(field) => (
                  <field.SelectField
                    label='Entity Type'
                    required
                    placeholder='Select entity type'
                    options={ENTITY_OPTIONS}
                  />
                )}
              />

              <form.Subscribe selector={(state) => state.values.entityType}>
                {(entityType) => (
                  <form.AppField
                    name='organizationName'
                    children={(field) => (
                      <field.TextField
                        label='Organization / Group Name'
                        required={entityType !== 'INDIVIDUAL'}
                        placeholder={
                          entityType === 'INDIVIDUAL'
                            ? 'Optional for individuals'
                            : 'e.g. Sundarbans Mangrove Conservation Trust'
                        }
                      />
                    )}
                  />
                )}
              </form.Subscribe>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField
                name='registrationNumber'
                children={(field) => (
                  <field.TextField
                    label='Registration / Tax / Trust ID (Optional)'
                    placeholder='e.g. REG-2024-8891'
                  />
                )}
              />

              <form.AppField
                name='walletAddress'
                children={(field) => (
                  <field.TextField
                    label='Payout / Token Wallet Address (EVM)'
                    placeholder='0x71C...3a9f'
                    description='ERC-20 compatible address for receiving minted credits and payouts'
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Primary Representative */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <User className='h-5 w-5 text-emerald-600' />
              <CardTitle className='text-lg'>Primary Contact Person</CardTitle>
            </div>
            <CardDescription>
              Authorized representative for field verification, drone access, and legal notices.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField
                name='contactPerson'
                children={(field) => (
                  <field.TextField
                    label='Full Name of Contact Person'
                    required
                    placeholder='e.g. Rajesh Kumar'
                  />
                )}
              />

              <form.AppField
                name='contactPhone'
                children={(field) => (
                  <field.TextField
                    label='Phone Number'
                    type='tel'
                    required
                    placeholder='e.g. +91 98765 43210'
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Jurisdiction */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <MapPin className='h-5 w-5 text-emerald-600' />
              <CardTitle className='text-lg'>Primary Operational Jurisdiction</CardTitle>
            </div>
            <CardDescription>
              The primary state and district where your restoration or conservation sites are located.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <form.AppField
                name='state'
                children={(field) => (
                  <field.TextField
                    label='State / Province'
                    required
                    placeholder='e.g. West Bengal'
                  />
                )}
              />

              <form.AppField
                name='district'
                children={(field) => (
                  <field.TextField
                    label='District'
                    required
                    placeholder='e.g. South 24 Parganas'
                  />
                )}
              />

              <form.AppField
                name='village'
                children={(field) => (
                  <field.TextField
                    label='Village / Locality'
                    required
                    placeholder='e.g. Gosaba'
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Legal & Environmental Readiness */}
        <Card className='border shadow-xs bg-muted/20'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <ShieldCheck className='h-5 w-5 text-emerald-600' />
              <CardTitle className='text-lg'>Compliance & Readiness Checklist</CardTitle>
            </div>
            <CardDescription>
              Indicate current verification documentation ready for fast-track approver review.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-3 rounded-lg border bg-card p-4'>
              <form.AppField
                name='hasLegalPermits'
                children={(field) => (
                  <field.SwitchField
                    label='Land Tenure & Ownership / Concession Permits'
                    description='You hold verified title deeds, forest rights recognition, or government lease agreements.'
                  />
                )}
              />

              <div className='border-t pt-3' />

              <form.AppField
                name='hasSurveyReport'
                children={(field) => (
                  <field.SwitchField
                    label='Baseline Ecological / Topographic Survey Report'
                    description='A baseline vegetation study or perimeter boundary survey is available.'
                  />
                )}
              />

              <div className='border-t pt-3' />

              <form.AppField
                name='hasEnvironmentalClearance'
                children={(field) => (
                  <field.SwitchField
                    label='State Environmental / Coastal Zone Clearances'
                    description='Applicable Coastal Regulation Zone (CRZ) or state bio-diversity approvals are obtained.'
                  />
                )}
              />
            </div>
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
            className='gap-2 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
          >
            <span>Complete Registration</span>
            <CheckCircle2 className='h-4 w-4' />
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
