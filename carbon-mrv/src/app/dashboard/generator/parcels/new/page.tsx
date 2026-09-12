'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { useAppForm } from '@/lib/form';
import { toast } from 'sonner';
import { Trees, MapPin, CheckCircle2 } from 'lucide-react';
import { parcelRegistrationSchema, ParcelRegistrationInput } from '@/features/parcels/schemas/parcel-schema';
import { createParcelAction } from '@/features/parcels/actions/parcel-actions';
import { MapDraw } from '@/features/parcels/components/map-draw';

const ECOSYSTEM_OPTIONS = [
  { value: 'MANGROVE', label: 'Mangrove' },
  { value: 'SEAGRASS', label: 'Seagrass' },
  { value: 'SALT_MARSH', label: 'Salt Marsh' },
  { value: 'CORAL_REEF', label: 'Coral Reef' },
  { value: 'KELP_FOREST', label: 'Kelp Forest' }
];

export default function NewParcelPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useAppForm({
    defaultValues: {
      parcelName: '',
      ecosystemType: 'MANGROVE',
      state: '',
      district: '',
      village: '',
      claimedCredits: 100,
      geofence: '',
    } as ParcelRegistrationInput,
    validators: {
      onSubmit: parcelRegistrationSchema
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        try {
          const res = await createParcelAction(value);
          if (res.success && res.data) {
            toast.success('Parcel registered successfully! Pending review.');
            router.push('/dashboard/generator/parcels');
          } else {
            toast.error(res.error || 'Failed to register parcel');
          }
        } catch (err: any) {
          toast.error(err?.message || 'Unexpected error while registering parcel');
        }
      });
    }
  });

  return (
    <div className='w-full max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-300 py-6 px-4 md:px-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5'>
        <div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold'>
              Land Registration
            </Badge>
          </div>
          <h2 className='text-2xl font-bold tracking-tight text-foreground mt-1'>
            Register New Carbon Parcel
          </h2>
        </div>
        <div className='text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 self-start sm:self-auto'>
          <Trees className='h-3.5 w-3.5 text-emerald-500' />
          <span>Generator Pipeline</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className='space-y-6'
      >
        {/* Section 1: Parcel Details */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <Trees className='h-5 w-5 text-emerald-600' />
              <CardTitle className='text-lg'>1. Parcel Specifications</CardTitle>
            </div>
            <CardDescription>
              Basic ecosystem classification and estimated carbon credits for this area.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField
                name='parcelName'
                children={(field) => (
                  <field.TextField
                    label='Parcel Name'
                    required
                    placeholder='e.g. Sundarbans Mangrove Conservation Area'
                  />
                )}
              />

              <form.AppField
                name='ecosystemType'
                children={(field) => (
                  <field.SelectField
                    label='Ecosystem Type'
                    required
                    placeholder='Select ecosystem'
                    options={ECOSYSTEM_OPTIONS}
                  />
                )}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField
                name='claimedCredits'
                children={(field) => (
                  <field.TextField
                    label='Claimed Carbon Credits (tCO2e)'
                    type='number'
                    required
                    placeholder='100'
                    description='Your initial estimate of sequestered carbon'
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Geographic Location */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <MapPin className='h-5 w-5 text-emerald-600' />
              <CardTitle className='text-lg'>2. Geographic Location & Administrative Bounds</CardTitle>
            </div>
            <CardDescription>
              Regional administrative identifiers and jurisdictional jurisdiction for land verification.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <form.AppField
                name='state'
                children={(field) => (
                  <field.TextField
                    label='State / Province'
                    required
                    placeholder='e.g. West Bengal, Gujarat'
                  />
                )}
              />

              <form.AppField
                name='district'
                children={(field) => (
                  <field.TextField
                    label='District / Region'
                    required
                    placeholder='e.g. South 24 Parganas'
                  />
                )}
              />

              <form.AppField
                name='village'
                children={(field) => (
                  <field.TextField
                    label='Village / Local Body'
                    required
                    placeholder='e.g. Gosaba, Mundra'
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: GPS Geofence Polygon */}
        <Card className='border shadow-xs'>
          <CardHeader className='pb-4'>
            <div className='flex items-center gap-2'>
              <MapPin className='h-5 w-5 text-emerald-600' />
              <CardTitle className='text-lg'>3. GPS Geofence Polygon Boundaries</CardTitle>
            </div>
            <CardDescription>
              Draw or adjust the polygon boundary on the map representing the exact perimeter of your parcel.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <MapDraw 
              onChange={(geojson) => {
                form.setFieldValue('geofence', geojson);
              }}
            />
            
            <form.Field
              name="geofence"
              children={(field) => (
                field.state.meta.errors.length > 0 ? (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {field.state.meta.errors[0]?.toString()}
                  </p>
                ) : null
              )}
            />
          </CardContent>
        </Card>

        <div className='flex items-center justify-end pt-2'>
          <LoadingButton
            type='submit'
            loading={isPending}
            className='gap-2 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
          >
            <span>Submit for Review</span>
            <CheckCircle2 className='h-4 w-4' />
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
