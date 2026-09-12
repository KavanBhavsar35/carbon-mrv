'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Trees, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Loader2,
  Layers,
  Shield
} from 'lucide-react';
import { getAllParcelsAction } from '@/features/parcels/actions/parcel-actions';
import { toast } from 'sonner';

export default function AdminAllParcelsPage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const res = await getAllParcelsAction();
        if (res.success && res.data) {
          setParcels(res.data);
        } else {
          toast.error(res.error || 'Failed to load parcels');
        }
      } catch (err: any) {
        toast.error('Error loading parcels');
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  const totalArea = parcels.reduce((acc, p) => acc + (p.totalAreaHa || 0), 0);
  const totalClaimedCredits = parcels.reduce((acc, p) => acc + (p.claimedCredits || 0), 0);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs font-semibold">
                Administration
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
              All Registered Parcels
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              System-wide registry of all mapped parcels, owners, biometrics, and verification statuses.
            </p>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Registered Parcels</div>
                <div className="text-xl font-bold">{isLoading ? '...' : parcels.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Measured Area</div>
                <div className="text-xl font-bold">{isLoading ? '...' : `${totalArea.toFixed(2)} ha`}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
                <Trees className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Claimed Carbon Sequestration</div>
                <div className="text-xl font-bold">{isLoading ? '...' : `${totalClaimedCredits} tCO2e`}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parcels Table / Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 border rounded-xl bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-muted-foreground">Loading registry...</p>
          </div>
        ) : parcels.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="py-16 text-center text-muted-foreground">
              No parcels registered in the system yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {parcels.map((parcel) => (
              <Card key={parcel.id} className="border shadow-xs hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold truncate">
                        {parcel.parcelName}
                      </CardTitle>
                      <CardDescription className="capitalize text-xs mt-0.5">
                        {parcel.ecosystemType.replace('_', ' ').toLowerCase()} · {parcel.generator?.contactPerson || 'Unknown Generator'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(parcel.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y bg-muted/30 -mx-6 px-6">
                    <div>
                      <span className="text-muted-foreground">Area:</span>
                      <div className="font-semibold">{parcel.totalAreaHa.toFixed(2)} ha</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Claimed:</span>
                      <div className="font-semibold">{parcel.claimedCredits} tCO2e</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(parcel.createdAt).toLocaleDateString()}
                    </span>
                    <Link href={`/dashboard/review/${parcel.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-500/10">
                        <span>Review / Details</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
