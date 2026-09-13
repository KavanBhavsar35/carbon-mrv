import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Carbon MRV Prisma database seeding...');

  // 1. Clerk Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'kvbhavsar35@gmail.com' },
    update: {
      role: 'ADMIN',
      name: 'Kavan Bhavsar (Admin)',
      isActive: true,
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    },
    create: {
      id: 'user_admin_01',
      clerkId: 'user_3JAY3ORequT7Juje7yVsMcVA8wo',
      email: 'kvbhavsar35@gmail.com',
      name: 'Kavan Bhavsar (Admin)',
      role: 'ADMIN',
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      isActive: true
    }
  });

  // Generator user (support both email spellings)
  let generatorUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'kavanbhavsargpa@gmail.com' },
        { email: 'kavanbhavasrgpa@gmail.com' }
      ]
    }
  });

  if (generatorUser) {
    generatorUser = await prisma.user.update({
      where: { id: generatorUser.id },
      data: {
        role: 'GENERATOR',
        name: 'Kavan Bhavsar (Generator)',
        walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        isActive: true
      }
    });
  } else {
    generatorUser = await prisma.user.create({
      data: {
        id: 'user_gen_01',
        clerkId: 'user_3JExuOdgBFddWHZY4RJ5CfyWAFo',
        email: 'kavanbhavsargpa@gmail.com',
        name: 'Kavan Bhavsar (Generator)',
        role: 'GENERATOR',
        walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        isActive: true
      }
    });
  }

  const buyerUser = await prisma.user.upsert({
    where: { email: 'contact.kavanbhavsar@gmail.com' },
    update: {
      role: 'BUYER',
      name: 'Kavan Bhavsar (Buyer)',
      isActive: true,
      walletAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'
    },
    create: {
      id: 'user_buyer_01',
      clerkId: 'user_3JE2ias7q6Dq9sTUdoBgXxcXASi',
      email: 'contact.kavanbhavsar@gmail.com',
      name: 'Kavan Bhavsar (Buyer)',
      role: 'BUYER',
      walletAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      isActive: true
    }
  });

  const approverUser = await prisma.user.upsert({
    where: { email: 'photoskavanbhavsar@gmail.com' },
    update: {
      role: 'APPROVER',
      name: 'Kavan Bhavsar (Approver)',
      isActive: true,
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    },
    create: {
      id: 'user_approver_01',
      clerkId: 'user_3JF8RrHThiX0MczlrVzs5t2MGSi',
      email: 'photoskavanbhavsar@gmail.com',
      name: 'Kavan Bhavsar (Approver)',
      role: 'APPROVER',
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      isActive: true
    }
  });

  console.log(`✓ Seeded Users: ${adminUser.email}, ${generatorUser.email}, ${buyerUser.email}, ${approverUser.email}`);

  // 2. Generator Profile
  const generatorProfile = await prisma.generatorProfile.upsert({
    where: { userId: generatorUser.id },
    update: {
      organizationName: 'Gujarat Coastal Ecology Commission',
      contactPerson: 'Kavan Bhavsar',
      contactPhone: '+919876543210',
      state: 'Gujarat',
      district: 'Kutch',
      village: 'Mundra',
      registrationNumber: 'REG-GUJ-MRV-2026-001',
      hasLegalPermits: true,
      hasSurveyReport: true,
      hasEnvironmentalClearance: true,
      locked: false
    },
    create: {
      id: 'gen_prof_01',
      userId: generatorUser.id,
      entityType: 'COMPANY',
      organizationName: 'Gujarat Coastal Ecology Commission',
      contactPerson: 'Kavan Bhavsar',
      contactPhone: '+919876543210',
      state: 'Gujarat',
      district: 'Kutch',
      village: 'Mundra',
      registrationNumber: 'REG-GUJ-MRV-2026-001',
      hasLegalPermits: true,
      hasSurveyReport: true,
      hasEnvironmentalClearance: true,
      locked: false
    }
  });
  console.log(`✓ Seeded Generator Profile: ${generatorProfile.organizationName}`);

  // 3. Buyer Profile
  const buyerProfile = await prisma.buyerProfile.upsert({
    where: { userId: buyerUser.id },
    update: {
      companyName: 'EcoTech Global Holdings',
      industry: 'Technology & Renewable Infrastructure',
      annualEmissionsTco2e: 25000,
      wantedCredits: 1000
    },
    create: {
      id: 'buy_prof_01',
      userId: buyerUser.id,
      buyerType: 'COMPANY',
      companyName: 'EcoTech Global Holdings',
      industry: 'Technology & Renewable Infrastructure',
      annualEmissionsTco2e: 25000,
      wantedCredits: 1000
    }
  });
  console.log(`✓ Seeded Buyer Profile: ${buyerProfile.companyName}`);

  // 4. Land Parcels
  const primaryParcel = await prisma.landParcel.upsert({
    where: { id: 'MRV-2026-001' },
    update: {
      generatorId: generatorProfile.id,
      parcelName: 'Mangrove Restoration — Gujarat',
      ecosystemType: 'MANGROVE',
      state: 'Gujarat',
      district: 'Kutch',
      village: 'Mundra',
      totalAreaHa: 42.7,
      claimedCredits: 120.0,
      contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      tokenId: '1',
      status: 'APPROVED',
      totalCreditsIssued: 1000.0
    },
    create: {
      id: 'MRV-2026-001',
      generatorId: generatorProfile.id,
      parcelName: 'Mangrove Restoration — Gujarat',
      ecosystemType: 'MANGROVE',
      state: 'Gujarat',
      district: 'Kutch',
      village: 'Mundra',
      geofence: JSON.stringify([
        { lat: 22.825, lng: 69.712 },
        { lat: 22.845, lng: 69.735 },
        { lat: 22.835, lng: 69.755 },
        { lat: 22.815, lng: 69.732 }
      ]),
      totalAreaHa: 42.7,
      claimedCredits: 120.0,
      contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      tokenId: '1',
      status: 'APPROVED',
      totalCreditsIssued: 1000.0
    }
  });

  const secondParcel = await prisma.landParcel.upsert({
    where: { id: 'parcel_sundarbans_02' },
    update: {
      generatorId: generatorProfile.id
    },
    create: {
      id: 'parcel_sundarbans_02',
      generatorId: generatorProfile.id,
      parcelName: 'Sundarbans Tidal Conservation Reserve',
      ecosystemType: 'MANGROVE',
      state: 'West Bengal',
      district: 'South 24 Parganas',
      village: 'Gosaba',
      geofence: JSON.stringify([
        { lat: 21.945, lng: 88.825 },
        { lat: 21.965, lng: 88.845 }
      ]),
      totalAreaHa: 85.0,
      claimedCredits: 250.0,
      status: 'PENDING_REVIEW',
      totalCreditsIssued: 0.0
    }
  });
  console.log(`✓ Seeded Land Parcels: ${primaryParcel.parcelName}, ${secondParcel.parcelName}`);

  // 5. Parcel Extension
  const extension = await prisma.parcelExtension.upsert({
    where: { id: 'ext_01' },
    update: {},
    create: {
      id: 'ext_01',
      parcelId: primaryParcel.id,
      additionalGeofence: JSON.stringify([
        { lat: 22.846, lng: 69.736 },
        { lat: 22.855, lng: 69.745 }
      ]),
      claimedCredits: 35.0,
      status: 'APPROVED'
    }
  });
  console.log(`✓ Seeded Parcel Extension: ${extension.id}`);

  // 6. Carbon Estimates
  const estimateSat = await prisma.carbonEstimate.upsert({
    where: { id: 'est_sat_01' },
    update: {},
    create: {
      id: 'est_sat_01',
      parcelId: primaryParcel.id,
      source: 'SATELLITE',
      sourceImages: JSON.stringify([
        'https://sentinel-hub.com/sample/sentinel2-gujarat-aug2026.tif',
        'https://planet.com/ortho/mundra-coastal-3m.tif'
      ]),
      estimatedCredits: 125.7,
      vegetationCoverPct: 88.4,
      estimatedBiomass: 1480.0,
      confidence: 0.942,
      modelVersion: 'UNet-Bitemporal-Biomass v2.4',
      deltaPct: 21.57,
      decision: 'AUTO_APPROVED'
    }
  });

  const estimateDrone = await prisma.carbonEstimate.upsert({
    where: { id: 'est_drone_01' },
    update: {},
    create: {
      id: 'est_drone_01',
      parcelId: primaryParcel.id,
      source: 'DRONE',
      sourceImages: JSON.stringify([
        'https://drone-telemetry.local/ortho/mundra-lidar-2026.las'
      ]),
      estimatedCredits: 128.2,
      vegetationCoverPct: 91.2,
      estimatedBiomass: 1510.0,
      confidence: 0.965,
      modelVersion: 'Drone-Canopy-LiDAR v1.8',
      deltaPct: 22.8,
      decision: 'AUTO_APPROVED'
    }
  });
  console.log(`✓ Seeded Carbon Estimates: ${estimateSat.id}, ${estimateDrone.id}`);

  // 7. Review Request
  const reviewRequest = await prisma.reviewRequest.upsert({
    where: { id: 'rev_req_01' },
    update: {
      reviewedById: approverUser.id
    },
    create: {
      id: 'rev_req_01',
      parcelId: primaryParcel.id,
      estimateId: estimateSat.id,
      isRerequest: false,
      flaggedReason: null,
      status: 'APPROVED',
      reviewedById: approverUser.id,
      comments: 'Biomass density and biophysical growth delta confirmed against Sentinel-2 MSI multi-spectral imagery. 2/3 independent auditor consensus reached.',
      reviewedAt: new Date('2026-08-22T09:15:00Z')
    }
  });
  console.log(`✓ Seeded Review Request: ${reviewRequest.id}`);

  // 8. Carbon Credits
  const activeCredit = await prisma.carbonCredit.upsert({
    where: { id: 'CC-001' },
    update: {
      status: 'ISSUED',
      amount: 1000.0,
      ownerWalletAddress: generatorUser.walletAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    },
    create: {
      id: 'CC-001',
      parcelId: primaryParcel.id,
      onchainCreditId: '1',
      amount: 1000.0,
      vintage: 2026,
      status: 'ISSUED',
      blockchainTxHash: '0x89f2d847120aefbc7812903847ab8901237c18903847ab8901237c18903847ab',
      ownerWalletAddress: generatorUser.walletAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      mintedAt: new Date('2026-08-26T10:00:00Z')
    }
  });

  const retiredCredit = await prisma.carbonCredit.upsert({
    where: { id: 'RC-2026-00421' },
    update: {},
    create: {
      id: 'RC-2026-00421',
      parcelId: primaryParcel.id,
      onchainCreditId: '1-ret-00421',
      amount: 25.0,
      vintage: 2026,
      status: 'RETIRED',
      blockchainTxHash: '0x3c71289ae04f56193796b1b72e9a5312384a86df790184b91238914028394018',
      ownerWalletAddress: buyerUser.walletAddress || '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      mintedAt: new Date('2026-08-26T10:00:00Z'),
      retiredAt: new Date('2026-09-13T11:42:08Z'),
      retiredReason: 'Corporate Net-Zero 2026 Scope 1 & 2 Neutralization Audit Cycle'
    }
  });
  console.log(`✓ Seeded Carbon Credits: ${activeCredit.id}, ${retiredCredit.id}`);

  // 9. Purchase Requests
  const purchaseReq1 = await prisma.purchaseRequest.upsert({
    where: { id: 'purch_req_01' },
    update: {},
    create: {
      id: 'purch_req_01',
      buyerId: buyerProfile.id,
      requestedAmount: 300.0,
      maxPricePerCredit: 45.0,
      status: 'FULFILLED'
    }
  });
  console.log(`✓ Seeded Purchase Request: ${purchaseReq1.id}`);

  // 10. Transactions
  const tx1 = await prisma.transaction.upsert({
    where: { id: 'tx_mint_01' },
    update: {},
    create: {
      id: 'tx_mint_01',
      type: 'MINT',
      fromUserId: null,
      toUserId: generatorUser.id,
      parcelId: primaryParcel.id,
      creditId: activeCredit.id,
      amount: 1000.0,
      pricePerCredit: null,
      totalPrice: null,
      currency: 'ETH',
      txHash: '0x89f2d847120aefbc7812903847ab8901237c18903847ab8901237c18903847ab',
      blockNumber: 6482914,
      status: 'COMPLETED'
    }
  });

  const tx4 = await prisma.transaction.upsert({
    where: { id: 'tx_retire_04' },
    update: {},
    create: {
      id: 'tx_retire_04',
      type: 'RETIRE',
      fromUserId: buyerUser.id,
      toUserId: null,
      parcelId: primaryParcel.id,
      creditId: retiredCredit.id,
      amount: 25.0,
      pricePerCredit: null,
      totalPrice: null,
      currency: 'ETH',
      txHash: '0x3c71289ae04f56193796b1b72e9a5312384a86df790184b91238914028394018',
      blockNumber: 6483119,
      status: 'COMPLETED'
    }
  });
  console.log(`✓ Seeded Transactions: ${tx1.id}, ${tx4.id}`);

  console.log('\n🎉 Prisma database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during Prisma seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
