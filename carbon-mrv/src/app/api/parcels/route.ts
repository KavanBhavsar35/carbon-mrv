import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const parcels = await prisma.landParcel.findMany({
      where: whereClause,
      include: {
        generator: {
          include: { user: true }
        },
        estimates: true,
        reviewRequests: true,
        credits: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, parcels });
  } catch (error: any) {
    console.error('[PARCELS GET ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch parcels' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      parcelName,
      ecosystemType = 'MANGROVE',
      state = 'West Bengal',
      district = 'South 24 Parganas',
      village = 'Gosaba',
      totalAreaHa = 10.0,
      claimedCredits = 100.0,
      geofence = [{ lat: 21.94, lng: 88.89 }, { lat: 21.95, lng: 88.91 }],
      hasLegalPermits = true
    } = body;

    if (!parcelName) {
      return NextResponse.json({ error: 'Parcel name is required' }, { status: 400 });
    }

    // Ensure generator profile exists
    let generator = await prisma.generatorProfile.findFirst();
    if (!generator) {
      const user = await prisma.user.upsert({
        where: { email: 'generator@carbonmrv.io' },
        update: {},
        create: {
          clerkId: 'generator_default_1',
          email: 'generator@carbonmrv.io',
          name: 'Community Land Steward',
          role: 'GENERATOR',
          generatorProfile: {
            create: {
              entityType: 'COMMUNITY',
              organizationName: 'Coastal Mangrove Producer',
              contactPerson: 'Lead Steward',
              contactPhone: '+91 98765 43210',
              state: state || 'Gujarat',
              district: district || 'Kachchh',
              village: village || 'Mundra',
              hasLegalPermits: Boolean(hasLegalPermits)
            }
          }
        },
        include: { generatorProfile: true }
      });
      generator = user.generatorProfile!;
    }

    const parcel = await prisma.landParcel.create({
      data: {
        generatorId: generator.id,
        parcelName,
        ecosystemType,
        state,
        district,
        village,
        geofence: typeof geofence === 'string' ? geofence : JSON.stringify(geofence),
        totalAreaHa: Number(totalAreaHa),
        claimedCredits: Number(claimedCredits),
        status: 'PENDING_REVIEW',
        estimates: {
          create: {
            source: 'DRONE',
            sourceImages: JSON.stringify([]),
            estimatedCredits: 0,
            vegetationCoverPct: 0,
            estimatedBiomass: 0,
            confidence: 0,
            modelVersion: 'v2.0-pending-audit',
            deltaPct: 0,
            decision: 'PENDING_REVIEW'
          }
        }
      },
      include: {
        estimates: true
      }
    });

    // Create Review Request for Approver
    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        parcelId: parcel.id,
        estimateId: parcel.estimates[0].id,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, parcel, reviewRequest });
  } catch (error: any) {
    console.error('[PARCELS POST ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create parcel' }, { status: 500 });
  }
}
