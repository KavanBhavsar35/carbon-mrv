'use server';

import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/actions';
import { parcelRegistrationSchema, ParcelRegistrationInput } from '../schemas/parcel-schema';
import { area } from '@turf/area';

export async function createParcelAction(
  rawInput: ParcelRegistrationInput
): Promise<ActionResponse<{ parcelId: string }>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return { success: false, error: 'Unauthorized: User not logged in' };
    }

    let generatorProfile = dbUser.generatorProfile;
    if (!generatorProfile) {
      // Auto-create generator profile if missing so registration is seamless
      generatorProfile = await prisma.generatorProfile.create({
        data: {
          userId: dbUser.id,
          entityType: 'INDIVIDUAL',
          contactPerson: dbUser.name || 'Generator',
          contactPhone: dbUser.phone || '0000000000',
          state: 'Default',
          district: 'Default',
          village: 'Default',
          hasLegalPermits: true,
          hasSurveyReport: true,
          hasEnvironmentalClearance: true,
        },
      });
    }

    const validated = parcelRegistrationSchema.safeParse(rawInput);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid form input';
      return { success: false, error: errorMsg };
    }

    const { parcelName, ecosystemType, claimedCredits, geofence } = validated.data;

    // Calculate area server-side using Turf.js
    let totalAreaHa = 0;
    try {
      const geojson = JSON.parse(geofence);
      // area() returns square meters. 1 hectare = 10,000 square meters.
      const areaSqMeters = area(geojson);
      totalAreaHa = areaSqMeters / 10000;
    } catch (e) {
      return { success: false, error: 'Failed to calculate area from geofence' };
    }

    if (totalAreaHa <= 0) {
      return { success: false, error: 'Calculated area must be greater than 0' };
    }

    const parcel = await prisma.landParcel.create({
      data: {
        generatorId: generatorProfile.id,
        parcelName,
        ecosystemType,
        claimedCredits,
        geofence,
        totalAreaHa,
        status: 'PENDING_REVIEW', // Sends directly to Approver review queue
      },
    });

    return {
      success: true,
      data: {
        parcelId: parcel.id,
      },
    };
  } catch (error: any) {
    console.error('Error in createParcelAction:', error);
    return {
      success: false,
      error: error?.message || 'Failed to create parcel',
    };
  }
}

/**
 * Fetch parcels belonging to the current generator (or all if admin)
 */
export async function getMyParcelsAction(): Promise<ActionResponse<any[]>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    let whereClause: any = {};
    if (dbUser.role === 'GENERATOR' && dbUser.generatorProfile) {
      whereClause = { generatorId: dbUser.generatorProfile.id };
    } else if (dbUser.role !== 'ADMIN' && dbUser.generatorProfile) {
      whereClause = { generatorId: dbUser.generatorProfile.id };
    }

    const parcels = await prisma.landParcel.findMany({
      where: whereClause,
      include: {
        generator: {
          include: { user: true },
        },
        estimates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        reviewRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: parcels };
  } catch (error: any) {
    console.error('Error in getMyParcelsAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch parcels' };
  }
}

/**
 * Fetch detailed parcel data by ID
 */
export async function getParcelDetailAction(parcelId: string): Promise<ActionResponse<any>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    const parcel = await prisma.landParcel.findUnique({
      where: { id: parcelId },
      include: {
        generator: {
          include: { user: true },
        },
        estimates: {
          orderBy: { createdAt: 'desc' },
        },
        reviewRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!parcel) {
      return { success: false, error: 'Parcel not found' };
    }

    return { success: true, data: parcel };
  } catch (error: any) {
    console.error('Error in getParcelDetailAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch parcel details' };
  }
}

/**
 * Fetch all parcels across all generators (Admin view)
 */
export async function getAllParcelsAction(): Promise<ActionResponse<any[]>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    const parcels = await prisma.landParcel.findMany({
      include: {
        generator: {
          include: { user: true },
        },
        estimates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        reviewRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: parcels };
  } catch (error: any) {
    console.error('Error in getAllParcelsAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch all parcels' };
  }
}
