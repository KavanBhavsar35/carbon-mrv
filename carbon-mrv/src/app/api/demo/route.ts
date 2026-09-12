import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { predictDrone, predictSatellite } from '@/lib/ml-client';

export async function GET() {
  try {
    const parcels = await prisma.landParcel.findMany({
      include: {
        estimates: true,
        reviewRequests: true,
        credits: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const credits = await prisma.carbonCredit.findMany({
      include: {
        parcel: true
      },
      orderBy: { mintedAt: 'desc' }
    });

    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      parcels,
      credits,
      transactions
    });
  } catch (error: any) {
    console.error('[DEMO API GET ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch demo state' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // ACTION 1: Generator submits parcel & triggers ML prediction
    if (action === 'create_parcel_and_estimate') {
      const {
        parcelName = 'Mangrove Conservation Plot',
        ecosystemType = 'MANGROVE',
        areaHa = 10.0,
        claimedCredits = 100.0,
        source = 'DRONE',
        images = ['/samples/mangrove_tile_1.png']
      } = body;

      // Ensure a generator profile exists
      let generator = await prisma.generatorProfile.findFirst();
      if (!generator) {
        const user = await prisma.user.upsert({
          where: { email: 'generator@carbonmrv.io' },
          update: {},
          create: {
            clerkId: 'generator_default_1',
            email: 'generator@carbonmrv.io',
            name: 'Local Coastal Producer',
            role: 'GENERATOR',
            generatorProfile: {
              create: {
                entityType: 'COMMUNITY',
                organizationName: 'Coastal Blue Carbon Producer',
                contactPerson: 'Field Project Lead',
                contactPhone: '+91 98765 43210',
                state: 'Gujarat',
                district: 'Kachchh',
                village: 'Mundra',
                hasLegalPermits: true
              }
            }
          },
          include: { generatorProfile: true }
        });
        generator = user.generatorProfile!;
      }

      // Call the ML service
      let mlOutput;
      try {
        if (source === 'SATELLITE') {
          mlOutput = await predictSatellite(images, 'demo-parcel-temp', claimedCredits);
        } else {
          mlOutput = await predictDrone(images, ecosystemType, areaHa, claimedCredits);
        }
      } catch (err: any) {
        console.warn('[ML SERVICE FALLBACK USED]:', err.message);
        mlOutput = {
          estimatedCredits: claimedCredits > 150 ? 82.5 : 124.8,
          vegetationCoverPct: 68.4,
          estimatedBiomass: 1120.5,
          confidence: 0.94,
          modelVersion: 'v2.0-unet-drone-uav',
          additionalityRating: 'AAA',
          bufferPoolCredits: (claimedCredits > 150 ? 82.5 : 124.8) * 0.15,
          netTradableCredits: (claimedCredits > 150 ? 82.5 : 124.8) * 0.85,
          riskLevel: claimedCredits > 150 ? 'HIGH' : 'LOW',
          anomalyScore: claimedCredits > 150 ? 0.82 : 0.06
        };
      }

      // Calculate delta percentage
      const deltaPct = Number((((claimedCredits - mlOutput.estimatedCredits) / mlOutput.estimatedCredits) * 100).toFixed(2));
      const decision = Math.abs(deltaPct) > 25.0 || mlOutput.riskLevel === 'HIGH' ? 'PENDING_REVIEW' : 'AUTO_APPROVED';

      // Create LandParcel in database
      const parcel = await prisma.landParcel.create({
        data: {
          generatorId: generator.id,
          parcelName,
          ecosystemType,
          geofence: JSON.stringify([
            { lat: 21.94, lng: 88.89 },
            { lat: 21.95, lng: 88.91 },
            { lat: 21.93, lng: 88.92 }
          ]),
          totalAreaHa: Number(areaHa),
          claimedCredits: Number(claimedCredits),
          status: 'PENDING_REVIEW',
          estimates: {
            create: {
              source,
              sourceImages: JSON.stringify(images),
              estimatedCredits: mlOutput.estimatedCredits,
              vegetationCoverPct: mlOutput.vegetationCoverPct,
              estimatedBiomass: mlOutput.estimatedBiomass,
              confidence: mlOutput.confidence,
              modelVersion: mlOutput.modelVersion,
              deltaPct,
              decision
            }
          }
        },
        include: {
          estimates: true
        }
      });

      const estimate = parcel.estimates[0];

      // Create ReviewRequest for Approver
      const reviewRequest = await prisma.reviewRequest.create({
        data: {
          parcelId: parcel.id,
          estimateId: estimate.id,
          status: 'PENDING',
          flaggedReason: Math.abs(deltaPct) > 25.0
            ? `Claimed credits (${claimedCredits}) exceed AI baseline (${mlOutput.estimatedCredits}) by ${deltaPct}%.`
            : null
        }
      });

      return NextResponse.json({
        success: true,
        parcel,
        estimate,
        reviewRequest,
        mlOutput
      });
    }

    // ACTION 2: Approver / Auditor reviews and approves or rejects claim
    if (action === 'review_decision') {
      const { reviewId, parcelId, decision, comments = '' } = body;

      const review = await prisma.reviewRequest.update({
        where: { id: reviewId },
        data: {
          status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          comments,
          reviewedAt: new Date()
        }
      });

      const parcel = await prisma.landParcel.update({
        where: { id: parcelId },
        data: {
          status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'
        },
        include: { estimates: true }
      });

      let credit = null;
      if (decision === 'APPROVED') {
        const onchainCreditId = String(Math.floor(1000 + Math.random() * 9000));
        const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const amount = parcel.estimates[0]?.estimatedCredits || parcel.claimedCredits;

        credit = await prisma.carbonCredit.create({
          data: {
            parcelId: parcel.id,
            onchainCreditId,
            amount,
            vintage: new Date().getFullYear(),
            status: 'ISSUED',
            blockchainTxHash: txHash,
            ownerWalletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Generator wallet
          }
        });

        await prisma.transaction.create({
          data: {
            type: 'MINT',
            creditId: credit.id,
            parcelId: parcel.id,
            amount,
            txHash,
            currency: 'ETH',
            status: 'COMPLETED'
          }
        });

        await prisma.landParcel.update({
          where: { id: parcel.id },
          data: {
            totalCreditsIssued: amount,
            contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            tokenId: onchainCreditId
          }
        });
      }

      return NextResponse.json({
        success: true,
        review,
        parcel,
        credit
      });
    }

    // ACTION 3: Buyer purchases credit on marketplace
    if (action === 'buy_credit') {
      const { creditId, buyerWallet = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' } = body;

      const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const credit = await prisma.carbonCredit.update({
        where: { id: creditId },
        data: {
          ownerWalletAddress: buyerWallet,
          status: 'SOLD'
        },
        include: { parcel: true }
      });

      await prisma.transaction.create({
        data: {
          type: 'PURCHASE',
          creditId: credit.id,
          parcelId: credit.parcelId,
          amount: credit.amount,
          pricePerCredit: 35.0,
          totalPrice: credit.amount * 35.0,
          txHash,
          currency: 'USDC',
          status: 'COMPLETED'
        }
      });

      return NextResponse.json({
        success: true,
        credit,
        txHash
      });
    }

    // ACTION 4: Buyer retires credit for ESG Net-Zero Offset
    if (action === 'retire_credit') {
      const { creditId, retirementReason = 'FY2026 Scope 1 & 2 Corporate ESG Net-Zero Target' } = body;

      const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const credit = await prisma.carbonCredit.update({
        where: { id: creditId },
        data: {
          status: 'RETIRED',
          retiredAt: new Date(),
          retiredReason: retirementReason
        },
        include: { parcel: true }
      });

      await prisma.transaction.create({
        data: {
          type: 'RETIRE',
          creditId: credit.id,
          parcelId: credit.parcelId,
          amount: credit.amount,
          txHash,
          currency: 'ETH',
          status: 'COMPLETED'
        }
      });

      return NextResponse.json({
        success: true,
        credit,
        txHash
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[DEMO API POST ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
