'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ClipboardList, Clock } from 'lucide-react';
import { getReviewQueueAction } from '@/features/review/actions/review-actions';
import { toast } from 'sonner';

export default function ReviewQueuePage() {
  const router = useRouter();
  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchQueue() {
      try {
        const res = await getReviewQueueAction();
        if (res.success && res.data) {
          setParcels(res.data);
        } else {
          toast.error(res.error || 'Failed to load review queue');
        }
      } catch (err) {
        toast.error('Unexpected error loading review queue');
      } finally {
        setIsLoading(false);
      }
    }
    fetchQueue();
  }, []);

  return (
    <div className='w-full max-w-6xl mx-auto space-y-6 animate-in fade-in-50 duration-300 py-6 px-4 md:px-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5'>
        <div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs font-semibold'>
              Approver Queue
            </Badge>
          </div>
          <h2 className='text-2xl font-bold tracking-tight text-foreground mt-1'>
            Parcels Pending Review
          </h2>
        </div>
        <div className='text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border flex items-center gap-1.5 self-start sm:self-auto'>
          <ClipboardList className='h-3.5 w-3.5 text-blue-500' />
          <span>Requires Evidence & ML Estimate</span>
        </div>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600'></div>
        </div>
      ) : parcels.length === 0 ? (
        <Card className='border-dashed shadow-none bg-muted/30'>
          <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
            <CheckCircle className='h-12 w-12 text-muted-foreground/50 mb-4' />
            <h3 className='text-lg font-semibold'>Queue is empty</h3>
            <p className='text-sm text-muted-foreground mt-1'>All submitted parcels have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {parcels.map((parcel) => (
            <Card key={parcel.id} className='flex flex-col shadow-xs transition-shadow hover:shadow-md'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <Badge variant='outline' className='bg-amber-500/10 text-amber-600 border-amber-500/30'>
                    {parcel.status}
                  </Badge>
                  <div className='flex items-center text-xs text-muted-foreground'>
                    <Clock className='mr-1 h-3 w-3' />
                    {new Date(parcel.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className='text-lg mt-2 line-clamp-1' title={parcel.parcelName}>
                  {parcel.parcelName}
                </CardTitle>
                <CardDescription className='line-clamp-1'>
                  {parcel.generator?.contactPerson || 'Unknown Generator'}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 flex flex-col justify-end space-y-4 pb-4'>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div className='bg-muted/50 p-2 rounded-md'>
                    <div className='text-xs text-muted-foreground'>Area</div>
                    <div className='font-medium'>{parcel.totalAreaHa.toFixed(2)} ha</div>
                  </div>
                  <div className='bg-muted/50 p-2 rounded-md'>
                    <div className='text-xs text-muted-foreground'>Claimed</div>
                    <div className='font-medium'>{parcel.claimedCredits} tCO2e</div>
                  </div>
                  <div className='bg-muted/50 p-2 rounded-md col-span-2'>
                    <div className='text-xs text-muted-foreground'>Ecosystem</div>
                    <div className='font-medium capitalize'>{parcel.ecosystemType.replace('_', ' ').toLowerCase()}</div>
                  </div>
                </div>
                <Button 
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white' 
                  onClick={() => router.push(`/dashboard/review/${parcel.id}`)}
                >
                  Review Parcel
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
