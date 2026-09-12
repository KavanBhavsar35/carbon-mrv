'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MapPin, 
  Trees, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { getParcelDetailAction } from '@/features/parcels/actions/parcel-actions';
import { MapDraw } from '@/features/parcels/components/map-draw';
import { toast } from 'sonner';

export default function GeneratorParcelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = params.id as string;

  const [parcel, setParcel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await getParcelDetailAction(parcelId);
        if (res.success && res.data) {
          setParcel(res.data);
        } else {
          toast.error(res.error || 'Parcel not found');
          router.push('/dashboard/generator/parcels');
        }
      } catch (err: any) {
        toast.error('Error loading parcel details');
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [parcelId, router]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-sm text-muted-foreground">Loading parcel information...</p>
        </div>
      </PageContainer>
    );
  }

  if (!parcel) return null;

  const latestEstimate = parcel.estimates?.[0];
  const latestReview = parcel.reviewRequests?.[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 text-sm py-1 px-3">
            <Clock className="h-3.5 w-3.5" />
            Under MRV Review
          </Badge>
        );
      case 'ACTIVE':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-sm py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active & Verified
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1 text-sm py-1 px-3">
            <XCircle className="h-3.5 w-3.5" />
            Review Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        {/* Header & Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/generator/parcels">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold">
                  Parcel Overview
                </Badge>
                {getStatusBadge(parcel.status)}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {parcel.parcelName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border self-start sm:self-auto">
            <Calendar className="h-3.5 w-3.5 text-emerald-500" />
            <span>Registered {new Date(parcel.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map & Geofence (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg">Geofence Boundary</CardTitle>
                </div>
                <CardDescription>
                  Interactive representation of your registered land perimeter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapDraw readOnly={true} initialGeojson={parcel.geofence} />
              </CardContent>
            </Card>

            {/* MRV Estimate History */}
            {latestEstimate && (
              <Card className="border shadow-xs border-blue-200/50 bg-blue-50/20 dark:bg-blue-950/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">MRV Drone Estimate Analysis</CardTitle>
                  </div>
                  <CardDescription>
                    Automated AI & Computer Vision biometric evaluation results.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-background p-3 rounded-lg border">
                      <span className="text-muted-foreground">Estimated Yield</span>
                      <div className="text-base font-bold text-blue-600 mt-0.5">
                        {latestEstimate.estimatedCredits.toFixed(1)} tCO2e
                      </div>
                    </div>
                    <div className="bg-background p-3 rounded-lg border">
                      <span className="text-muted-foreground">Variance Delta</span>
                      <div className="text-base font-bold mt-0.5">
                        {latestEstimate.deltaPct.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-background p-3 rounded-lg border">
                      <span className="text-muted-foreground">Vegetation Cover</span>
                      <div className="text-base font-bold mt-0.5">
                        {latestEstimate.vegetationCoverPct?.toFixed(1) || 'N/A'}%
                      </div>
                    </div>
                    <div className="bg-background p-3 rounded-lg border">
                      <span className="text-muted-foreground">Confidence Score</span>
                      <div className="text-base font-bold text-emerald-600 mt-0.5">
                        {(latestEstimate.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {latestReview?.comments && (
                    <div className="mt-4 p-3 rounded-lg bg-background border text-xs">
                      <span className="font-semibold text-foreground">Reviewer Note:</span>
                      <p className="text-muted-foreground mt-1">{latestReview.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Parcel Metrics & Verification Stage */}
          <div className="space-y-6">
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trees className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg">Land Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Ecosystem Type</span>
                  <div className="font-semibold capitalize text-base">
                    {parcel.ecosystemType.replace('_', ' ').toLowerCase()}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <span className="text-xs text-muted-foreground">Total Measured Area</span>
                  <div className="font-semibold text-base font-mono">
                    {parcel.totalAreaHa.toFixed(4)} ha
                  </div>
                </div>

                <div className="border-t pt-3">
                  <span className="text-xs text-muted-foreground">Claimed Carbon Sequestration</span>
                  <div className="font-semibold text-base font-mono text-emerald-600">
                    {parcel.claimedCredits} tCO2e
                  </div>
                </div>

                <div className="border-t pt-3">
                  <span className="text-xs text-muted-foreground">Verified Credits Issued</span>
                  <div className="font-semibold text-base font-mono text-blue-600">
                    {parcel.totalCreditsIssued || 0} tCO2e
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Verification Lifecycle</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                  <div>
                    <div className="font-semibold">1. Land Registration</div>
                    <p className="text-muted-foreground">Perimeter mapped and submitted for review.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${latestEstimate ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <div>
                    <div className="font-semibold">2. Drone Biometric Survey</div>
                    <p className="text-muted-foreground">
                      {latestEstimate ? 'Survey processed with computer vision.' : 'Awaiting reviewer drone evidence upload.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${parcel.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                  <div>
                    <div className="font-semibold">3. Final Verification & Minting</div>
                    <p className="text-muted-foreground">
                      {parcel.status === 'ACTIVE' ? 'Credits verified and approved.' : 'Pending final human Approver determination.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
