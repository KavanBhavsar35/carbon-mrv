'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MapPin, 
  Trees, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Sparkles,
  Loader2,
  Layers
} from 'lucide-react';
import { getMyParcelsAction } from '@/features/parcels/actions/parcel-actions';
import { toast } from 'sonner';

export default function MyParcelsPage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadParcels() {
      try {
        const res = await getMyParcelsAction();
        if (res.success && res.data) {
          setParcels(res.data);
        } else {
          toast.error(res.error || 'Failed to load parcels');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error loading parcels');
      } finally {
        setIsLoading(false);
      }
    }
    loadParcels();
  }, []);

  const totalArea = parcels.reduce((acc, p) => acc + (p.totalAreaHa || 0), 0);
  const totalClaimedCredits = parcels.reduce((acc, p) => acc + (p.claimedCredits || 0), 0);
  const pendingCount = parcels.filter(p => p.status === 'PENDING_REVIEW').length;
  const activeCount = parcels.filter(p => p.status === 'ACTIVE').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case 'ACTIVE':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active & Verified
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        {/* Header with Register Land CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold">
                Generator Dashboard
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
              My Land Parcels
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor your registered lands, MRV review progress, and verified carbon credit issuance.
            </p>
          </div>

          <Link href="/dashboard/generator/parcels/new">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Register New Land</span>
            </Button>
          </Link>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Total Parcels</div>
                  <div className="text-xl font-bold">{isLoading ? '...' : parcels.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Total Area</div>
                  <div className="text-xl font-bold">{isLoading ? '...' : `${totalArea.toFixed(2)} ha`}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Under Review</div>
                  <div className="text-xl font-bold">{isLoading ? '...' : pendingCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Claimed Credits</div>
                  <div className="text-xl font-bold">{isLoading ? '...' : `${totalClaimedCredits} tCO2e`}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parcels List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 border rounded-xl bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-sm text-muted-foreground">Loading your registered parcels...</p>
          </div>
        ) : parcels.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
                <Trees className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-semibold">No Land Parcels Registered Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
                Draw your first parcel boundary on our interactive map to initiate the MRV drone verification and carbon credit issuance pipeline.
              </p>
              <Link href="/dashboard/generator/parcels/new">
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  <Plus className="h-4 w-4" />
                  <span>Register Land Now</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {parcels.map((parcel) => {
              const latestEstimate = parcel.estimates?.[0];
              return (
                <Card key={parcel.id} className="border shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-semibold truncate">
                          {parcel.parcelName}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <span className="capitalize font-medium text-foreground">{parcel.ecosystemType.replace('_', ' ').toLowerCase()}</span>
                          {(parcel.village || parcel.district || parcel.state) && (
                            <>
                              <span>&middot;</span>
                              <span className="truncate">{[parcel.village, parcel.district, parcel.state].filter(Boolean).join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(parcel.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y bg-muted/30 -mx-6 px-6">
                      <div>
                        <span className="text-muted-foreground">Total Area:</span>
                        <div className="font-semibold">{parcel.totalAreaHa.toFixed(2)} ha</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Claimed Credits:</span>
                        <div className="font-semibold">{parcel.claimedCredits} tCO2e</div>
                      </div>
                    </div>

                    {latestEstimate && (
                      <div className="bg-blue-50/70 dark:bg-blue-950/20 p-2.5 rounded-md border border-blue-200/50 text-xs">
                        <div className="font-medium text-blue-700 dark:text-blue-400 flex items-center justify-between">
                          <span>MRV Drone Estimate</span>
                          <span>{latestEstimate.estimatedCredits.toFixed(1)} tCO2e</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Delta: {latestEstimate.deltaPct.toFixed(1)}% · Confidence: {(latestEstimate.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(parcel.createdAt).toLocaleDateString()}
                      </span>
                      <Link href={`/dashboard/generator/parcels/${parcel.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10">
                          <span>View Details</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
