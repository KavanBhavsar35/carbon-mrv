'use server';

import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/actions';

/**
 * Get all available (ISSUED) credits for the marketplace
 */
export async function getAvailableCreditsAction(): Promise<ActionResponse<any[]>> {
  try {
    const credits = await prisma.carbonCredit.findMany({
      where: { status: 'ISSUED' },
      include: {
        parcel: {
          include: {
            estimates: { orderBy: { createdAt: 'desc' }, take: 1 },
            generator: { include: { user: true } },
          },
        },
      },
      orderBy: { mintedAt: 'desc' },
    });
    return { success: true, data: credits };
  } catch (error: any) {
    console.error('Error in getAvailableCreditsAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch marketplace credits' };
  }
}

/**
 * Get all credits (ISSUED + SOLD + RETIRED) — for admin
 */
export async function getAllCreditsAction(): Promise<ActionResponse<any[]>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const credits = await prisma.carbonCredit.findMany({
      include: {
        parcel: true,
      },
      orderBy: { mintedAt: 'desc' },
    });
    return { success: true, data: credits };
  } catch (error: any) {
    console.error('Error in getAllCreditsAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch all credits' };
  }
}

/**
 * Get buyer's holdings (SOLD + RETIRED credits)
 */
export async function getMyHoldingsAction(): Promise<ActionResponse<any[]>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const credits = await prisma.carbonCredit.findMany({
      where: {
        status: { in: ['SOLD', 'RETIRED'] },
      },
      include: {
        parcel: {
          include: {
            estimates: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { mintedAt: 'desc' },
    });
    return { success: true, data: credits };
  } catch (error: any) {
    console.error('Error in getMyHoldingsAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch holdings' };
  }
}

/**
 * Purchase a credit (move from ISSUED → SOLD)
 */
export async function purchaseCreditAction(
  creditId: string
): Promise<ActionResponse<{ txHash: string }>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const credit = await prisma.carbonCredit.findUnique({ where: { id: creditId } });
    if (!credit) return { success: false, error: 'Credit not found' };
    if (credit.status !== 'ISSUED') return { success: false, error: 'Credit is not available for purchase' };

    const simulatedTxHash =
      '0x' + Math.random().toString(16).substring(2).padEnd(64, '0').substring(0, 64);

    const updated = await prisma.carbonCredit.update({
      where: { id: creditId },
      data: {
        status: 'SOLD',
        ownerWalletAddress: dbUser.walletAddress || '0xBuyer',
      },
    });

    await prisma.transaction.create({
      data: {
        type: 'PURCHASE',
        fromUserId: null,
        toUserId: dbUser.id,
        parcelId: updated.parcelId,
        creditId: updated.id,
        amount: updated.amount,
        pricePerCredit: 35,
        totalPrice: updated.amount * 35,
        currency: 'USD',
        txHash: simulatedTxHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
        status: 'COMPLETED',
      },
    });

    return { success: true, data: { txHash: simulatedTxHash } };
  } catch (error: any) {
    console.error('Error in purchaseCreditAction:', error);
    return { success: false, error: error?.message || 'Purchase failed' };
  }
}

/**
 * Retire a credit (move from SOLD → RETIRED)
 */
export async function retireCreditAction(
  creditId: string,
  retirementReason: string
): Promise<ActionResponse<{ txHash: string }>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const credit = await prisma.carbonCredit.findUnique({ where: { id: creditId } });
    if (!credit) return { success: false, error: 'Credit not found' };
    if (credit.status !== 'SOLD') return { success: false, error: 'Only purchased credits can be retired' };

    const simulatedTxHash =
      '0x' + Math.random().toString(16).substring(2).padEnd(64, '0').substring(0, 64);

    const updated = await prisma.carbonCredit.update({
      where: { id: creditId },
      data: {
        status: 'RETIRED',
        retiredAt: new Date(),
        retiredReason: retirementReason,
      },
    });

    await prisma.transaction.create({
      data: {
        type: 'RETIRE',
        fromUserId: dbUser.id,
        toUserId: null,
        parcelId: updated.parcelId,
        creditId: updated.id,
        amount: updated.amount,
        pricePerCredit: 0,
        totalPrice: 0,
        currency: 'USD',
        txHash: simulatedTxHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
        status: 'COMPLETED',
      },
    });

    return { success: true, data: { txHash: simulatedTxHash } };
  } catch (error: any) {
    console.error('Error in retireCreditAction:', error);
    return { success: false, error: error?.message || 'Retirement failed' };
  }
}

/**
 * Get all transactions for buyer (their own)
 */
export async function getMyTransactionsAction(): Promise<ActionResponse<any[]>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromUserId: dbUser.id }, { toUserId: dbUser.id }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: transactions };
  } catch (error: any) {
    console.error('Error in getMyTransactionsAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch orders' };
  }
}

/**
 * Get all transactions (Admin view)
 */
export async function getAllTransactionsAction(): Promise<ActionResponse<any[]>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: transactions };
  } catch (error: any) {
    console.error('Error in getAllTransactionsAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch all transactions' };
  }
}

/**
 * Get all users (Admin view)
 */
export async function getAllUsersAction(): Promise<ActionResponse<any[]>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const users = await prisma.user.findMany({
      include: {
        generatorProfile: true,
        buyerProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  } catch (error: any) {
    console.error('Error in getAllUsersAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch users' };
  }
}


/**
 * Get platform-wide analytics stats (Admin)
 */
export async function getAdminAnalyticsAction(): Promise<ActionResponse<any>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const [
      totalUsers,
      totalParcels,
      pendingReviews,
      totalCredits,
      issuedCredits,
      soldCredits,
      retiredCredits,
      totalTransactions,
      parcels,
      credits,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.landParcel.count(),
      prisma.landParcel.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.carbonCredit.count(),
      prisma.carbonCredit.count({ where: { status: 'ISSUED' } }),
      prisma.carbonCredit.count({ where: { status: 'SOLD' } }),
      prisma.carbonCredit.count({ where: { status: 'RETIRED' } }),
      prisma.transaction.count(),
      prisma.landParcel.findMany({ select: { totalAreaHa: true, claimedCredits: true } }),
      prisma.carbonCredit.findMany({
        where: { status: 'RETIRED' },
        select: { amount: true },
      }),
    ]);

    const totalAreaHa = parcels.reduce((acc, p) => acc + (p.totalAreaHa || 0), 0);
    const totalClaimedCredits = parcels.reduce((acc, p) => acc + (p.claimedCredits || 0), 0);
    const totalRetiredTco2e = credits.reduce((acc, c) => acc + (c.amount || 0), 0);

    return {
      success: true,
      data: {
        totalUsers,
        totalParcels,
        pendingReviews,
        totalCredits,
        issuedCredits,
        soldCredits,
        retiredCredits,
        totalTransactions,
        totalAreaHa,
        totalClaimedCredits,
        totalRetiredTco2e,
      },
    };
  } catch (error: any) {
    console.error('Error in getAdminAnalyticsAction:', error);
    return { success: false, error: error?.message || 'Failed to fetch analytics' };
  }
}
