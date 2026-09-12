'use client';

import * as React from 'react';
import { useEffect, useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { 
  ArrowLeft, 
  CheckCircle2, 
  UploadCloud, 
  Trees, 
  MapPin, 
  Loader2, 
  Sparkles, 
  XCircle, 
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { 
  getReviewDetailAction, 
  uploadEvidenceAndEstimateAction,
  submitReviewDecisionAction 
} from '@/features/review/actions/review-actions';
import { MapDraw } from '@/features/parcels/components/map-draw';
import { toast } from 'sonner';

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const parcelId = params.id as string;
  
  const [parcel, setParcel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [comments, setComments] = useState('');
  const [isPending, startTransition] = useTransition();

  const fetchParcel = React.useCallback(async () => {
    try {
      const res = await getReviewDetailAction(parcelId);
      if (res.success && res.data) {
        setParcel(res.data);
      } else {
        toast.error(res.error || 'Failed to load parcel');
        router.push('/dashboard/review/queue');
      }
    } catch (err: any) {
      toast.error('Unexpected error loading parcel');
    } finally {
      setIsLoading(false);
    }
  }, [parcelId, router]);

  useEffect(() => {
    fetchParcel();
  }, [fetchParcel]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEvidenceImages(prev => [...prev, base64]);
      setIsUploading(false);
      toast.success('Image uploaded successfully');
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error('Failed to read image');
    };
    reader.readAsDataURL(file);
  };

  const handleRunEstimate = () => {
    if (evidenceImages.length === 0) {
      toast.error('Please upload at least one evidence image');
      return;
    }

    startTransition(async () => {
      try {
        const res = await uploadEvidenceAndEstimateAction(parcelId, evidenceImages);
        if (res.success && res.data) {
          toast.success(`ML Estimate complete! Delta: ${res.data.deltaPct.toFixed(1)}%`);
          await fetchParcel();
        } else {
          toast.error(res.error || 'Failed to run estimate');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Unexpected error running estimate');
      }
    });
  };

  const handleDecision = (decision: 'APPROVED' | 'REJECTED') => {
    const reviewRequest = parcel?.reviewRequests?.[0];

    startTransition(async () => {
      try {
        const res = await submitReviewDecisionAction({
          parcelId,
          reviewRequestId: reviewRequest?.id,
          decision,
          comments,
        });

        if (res.success) {
          toast.success(`Parcel successfully ${decision.toLowerCase()}!`);
          router.push('/dashboard/review/queue');
        } else {
          toast.error(res.error || 'Failed to record decision');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error recording decision');
      }
    });
  };

  if (isLoading) {
    return (
      <div className='flex flex-col justify-center items-center h-64 gap-2'>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs text-muted-foreground">Loading parcel review data...</p>
      </div>
    );
  }

  if (!parcel) return null;

  const latestEstimate = parcel.estimates?.[0];
  const isFinalized = parcel.status === 'ACTIVE' || parcel.status === 'REJECTED';

  return (
    <div className='w-full max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-300 py-6 px-4 md:px-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5'>
        <div className='flex items-center gap-3'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={() => router.push('/dashboard/review/queue')}
            className='h-9 w-9 rounded-lg border shrink-0'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs font-semibold'>
                Approver Verification
              </Badge>
              <Badge variant='outline' className={
                parcel.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                parcel.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' :
                'bg-amber-500/10 text-amber-600 border-amber-500/30'
              }>
                {parcel.status}
              </Badge>
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-foreground mt-1'>
              {parcel.parcelName}
            </h2>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column: Details & Map */}
        <div className='md:col-span-2 space-y-6'>
          <Card className='border shadow-xs'>
            <CardHeader className='pb-4'>
              <div className='flex items-center gap-2'>
                <Trees className='h-5 w-5 text-blue-600' />
                <CardTitle className='text-lg'>Parcel Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <div className='text-muted-foreground mb-1'>Generator</div>
                  <div className='font-medium'>{parcel.generator?.contactPerson || 'N/A'}</div>
                  <div className='text-xs text-muted-foreground mt-0.5'>{parcel.generator?.organizationName || 'Individual'}</div>
                </div>
                <div>
                  <div className='text-muted-foreground mb-1'>Ecosystem</div>
                  <div className='font-medium capitalize'>{parcel.ecosystemType.replace('_', ' ').toLowerCase()}</div>
                </div>
                <div>
                  <div className='text-muted-foreground mb-1'>Calculated Area</div>
                  <div className='font-medium font-mono'>{parcel.totalAreaHa.toFixed(2)} ha</div>
                </div>
                <div>
                  <div className='text-muted-foreground mb-1'>Claimed Credits</div>
                  <div className='font-medium font-mono text-emerald-600'>{parcel.claimedCredits} tCO2e</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border shadow-xs'>
            <CardHeader className='pb-4'>
              <div className='flex items-center gap-2'>
                <MapPin className='h-5 w-5 text-blue-600' />
                <CardTitle className='text-lg'>Geofence Boundary</CardTitle>
              </div>
              <CardDescription>Visual geofence verified from generator submission.</CardDescription>
            </CardHeader>
            <CardContent>
              <MapDraw readOnly={true} initialGeojson={parcel.geofence} />
            </CardContent>
          </Card>

          {/* ML Estimate Result Card */}
          {latestEstimate && (
            <Card className='border shadow-xs border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10'>
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-2'>
                  <Sparkles className='h-5 w-5 text-blue-600' />
                  <CardTitle className='text-lg'>MRV Drone Biometric Analysis</CardTitle>
                </div>
                <CardDescription>AI prediction result comparing drone imagery against claimed credits.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                  <div className='p-3 bg-background rounded-lg border'>
                    <span className='text-muted-foreground'>ML Estimate</span>
                    <div className='text-base font-bold text-blue-600 mt-0.5 font-mono'>
                      {latestEstimate.estimatedCredits.toFixed(1)} tCO2e
                    </div>
                  </div>
                  <div className='p-3 bg-background rounded-lg border'>
                    <span className='text-muted-foreground'>Variance Delta</span>
                    <div className={`text-base font-bold mt-0.5 font-mono ${latestEstimate.deltaPct > 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {latestEstimate.deltaPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className='p-3 bg-background rounded-lg border'>
                    <span className='text-muted-foreground'>Vegetation Cover</span>
                    <div className='text-base font-bold mt-0.5 font-mono'>
                      {latestEstimate.vegetationCoverPct?.toFixed(1) || 'N/A'}%
                    </div>
                  </div>
                  <div className='p-3 bg-background rounded-lg border'>
                    <span className='text-muted-foreground'>Confidence</span>
                    <div className='text-base font-bold text-emerald-600 mt-0.5 font-mono'>
                      {(latestEstimate.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Evidence & Action */}
        <div className='space-y-6'>
          {/* Drone Evidence Upload */}
          <Card className='border shadow-xs'>
            <CardHeader className='pb-4'>
              <div className='flex items-center gap-2'>
                <UploadCloud className='h-5 w-5 text-blue-600' />
                <CardTitle className='text-lg'>Drone Evidence</CardTitle>
              </div>
              <CardDescription>
                Upload survey imagery to run the MRV computer vision model.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='evidence-upload'>Upload Image</Label>
                <Input 
                  id='evidence-upload' 
                  type='file' 
                  accept='image/*' 
                  onChange={handleImageUpload}
                  disabled={isUploading || isPending}
                />
              </div>

              {evidenceImages.length > 0 && (
                <div className='space-y-2 mt-4'>
                  <Label>Survey Previews ({evidenceImages.length})</Label>
                  <div className='grid grid-cols-2 gap-2'>
                    {evidenceImages.map((img, i) => (
                      <div key={i} className='aspect-square relative rounded-md overflow-hidden border'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Evidence ${i}`} className='object-cover w-full h-full' />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <LoadingButton
                onClick={handleRunEstimate}
                loading={isPending}
                disabled={evidenceImages.length === 0 || isUploading}
                className='w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white'
              >
                <Sparkles className='h-4 w-4' />
                <span>Run Drone Estimate</span>
              </LoadingButton>
            </CardContent>
          </Card>

          {/* Final Human Determination (Approver Decision) */}
          <Card className='border shadow-xs border-emerald-500/20'>
            <CardHeader className='pb-4'>
              <div className='flex items-center gap-2'>
                <ShieldCheck className='h-5 w-5 text-emerald-600' />
                <CardTitle className='text-lg'>Approver Determination</CardTitle>
              </div>
              <CardDescription>
                Final human verification decision. No automatic approval.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {isFinalized ? (
                <div className='p-3.5 rounded-lg bg-muted border text-xs flex items-center gap-2.5'>
                  {parcel.status === 'ACTIVE' ? (
                    <>
                      <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0' />
                      <span>This parcel has been <strong>Approved</strong> and activated.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className='h-4 w-4 text-rose-600 shrink-0' />
                      <span>This parcel has been <strong>Rejected</strong>.</span>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='decision-comments'>Review Comments (Optional)</Label>
                    <Textarea
                      id='decision-comments'
                      placeholder='Add notes on perimeter, vegetation density, or audit rationale...'
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      className='text-xs'
                    />
                  </div>

                  <div className='flex flex-col gap-2 pt-2'>
                    <LoadingButton
                      onClick={() => handleDecision('APPROVED')}
                      loading={isPending}
                      className='w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                    >
                      <CheckCircle2 className='h-4 w-4' />
                      <span>Approve Parcel & Issue Credits</span>
                    </LoadingButton>

                    <Button
                      type='button'
                      variant='outline'
                      disabled={isPending}
                      onClick={() => handleDecision('REJECTED')}
                      className='w-full gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200'
                    >
                      <XCircle className='h-4 w-4' />
                      <span>Reject Parcel</span>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
