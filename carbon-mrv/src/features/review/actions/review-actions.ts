'use server';

import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/actions';
import { predictDrone } from '@/lib/ml-client';

/**
 * Fetch parcels that are pending review
 */
export async function getReviewQueueAction(): Promise<ActionResponse<any[]>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized: Please log in' };

    if (dbUser.role !== 'APPROVER' && dbUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Approver/Admin only' };
    }

    const parcels = await prisma.landParcel.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: { 
        generator: true,
        estimates: { orderBy: { createdAt: 'desc' }, take: 1 },
        reviewRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: parcels };
  } catch (error: any) {
    console.error('Error fetching review queue:', error);
    return { success: false, error: error?.message || 'Failed to fetch review queue' };
  }
}

/**
 * Fetch a single parcel for review, including full history
 */
export async function getReviewDetailAction(parcelId: string): Promise<ActionResponse<any>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized: Please log in' };

    if (dbUser.role !== 'APPROVER' && dbUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Approver/Admin only' };
    }

    const parcel = await prisma.landParcel.findUnique({
      where: { id: parcelId },
      include: { 
        generator: true,
        estimates: { orderBy: { createdAt: 'desc' } },
        reviewRequests: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!parcel) {
      return { success: false, error: 'Parcel not found' };
    }

    return { success: true, data: parcel };
  } catch (error: any) {
    console.error('Error fetching parcel details:', error);
    return { success: false, error: error?.message || 'Failed to fetch parcel details' };
  }
}

/**
 * Upload drone evidence, call ML model, and record estimate
 */
export async function uploadEvidenceAndEstimateAction(
  parcelId: string,
  images: string[]
): Promise<ActionResponse<any>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized: Please log in' };

    if (dbUser.role !== 'APPROVER' && dbUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Approver/Admin only' };
    }

    const parcel = await prisma.landParcel.findUnique({
      where: { id: parcelId }
    });

    if (!parcel) {
      return { success: false, error: 'Parcel not found' };
    }

    if (images.length === 0) {
      return { success: false, error: 'No evidence images provided' };
    }

    // Call ML Microservice
    const mlResponse = await predictDrone(images, parcel.ecosystemType);
    
    const delta = Math.abs(parcel.claimedCredits - mlResponse.estimatedCredits) / parcel.claimedCredits;
    const deltaPct = delta * 100;

    // As requested: the final decision is approver only, so we leave it as PENDING_REVIEW
    // even though we calculate the ML estimate.
    const decision = 'PENDING_REVIEW'; 

    // Create CarbonEstimate
    const estimate = await prisma.carbonEstimate.create({
      data: {
        parcelId: parcel.id,
        source: 'DRONE',
        sourceImages: JSON.stringify(images),
        estimatedCredits: mlResponse.estimatedCredits,
        vegetationCoverPct: mlResponse.vegetationCoverPct,
        estimatedBiomass: mlResponse.estimatedBiomass,
        confidence: mlResponse.confidence,
        modelVersion: mlResponse.modelVersion,
        deltaPct: deltaPct,
        decision: decision
      }
    });

    // Create a ReviewRequest to queue it for final manual approval based on this estimate
    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        parcelId: parcel.id,
        estimateId: estimate.id,
        status: 'PENDING',
      }
    });

    return { 
      success: true, 
      data: { 
        estimateId: estimate.id,
        reviewRequestId: reviewRequest.id,
        estimatedCredits: estimate.estimatedCredits,
        deltaPct: estimate.deltaPct,
        vegetationCoverPct: estimate.vegetationCoverPct,
        estimatedBiomass: estimate.estimatedBiomass,
        confidence: estimate.confidence,
      } 
    };
  } catch (error: any) {
    console.error('Error in uploadEvidenceAndEstimateAction:', error);
    return { success: false, error: error?.message || 'Failed to process evidence and run estimate' };
  }
}

/**
 * Submit final human Approver decision (Approve / Reject)
 */
export async function submitReviewDecisionAction(input: {
  parcelId: string;
  reviewRequestId?: string;
  decision: 'APPROVED' | 'REJECTED';
  comments?: string;
}): Promise<ActionResponse<any>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized: Please log in' };

    if (dbUser.role !== 'APPROVER' && dbUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Approver/Admin only' };
    }

    const { parcelId, reviewRequestId, decision, comments } = input;

    const parcel = await prisma.landParcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel) {
      return { success: false, error: 'Parcel not found' };
    }

    // Update parcel status
    const newParcelStatus = decision === 'APPROVED' ? 'ACTIVE' : 'REJECTED';
    const creditsIssued = decision === 'APPROVED' ? parcel.claimedCredits : 0;

    await prisma.landParcel.update({
      where: { id: parcelId },
      data: {
        status: newParcelStatus,
        totalCreditsIssued: creditsIssued,
      },
    });

    // If reviewRequest exists, update it
    if (reviewRequestId) {
      await prisma.reviewRequest.update({
        where: { id: reviewRequestId },
        data: {
          status: decision,
          reviewedById: dbUser.id,
          reviewedAt: new Date(),
          comments: comments || null,
        },
      });
    }

    return {
      success: true,
      data: {
        parcelId,
        status: newParcelStatus,
        decision,
      },
    };
  } catch (error: any) {
    console.error('Error in submitReviewDecisionAction:', error);
    return { success: false, error: error?.message || 'Failed to submit review decision' };
  }
}
