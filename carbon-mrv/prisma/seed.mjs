import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create a dummy Generator User
  const generator = await prisma.user.upsert({
    where: { email: 'generator@demo.com' },
    update: {},
    create: {
      clerkId: 'demo_gen_1',
      email: 'generator@demo.com',
      name: 'Demo Generator',
      role: 'GENERATOR',
      generatorProfile: {
        create: {
          entityType: 'NGO',
          organizationName: 'Green Earth NGO',
          contactPerson: 'Jane Doe',
          contactPhone: '+919876543210',
          state: 'Maharashtra',
          district: 'Pune',
          village: 'Bhor',
          hasLegalPermits: true,
        }
      }
    }
  });

  console.log('Created Generator:', generator.email);

  // 2. Fetch the profile
  const profile = await prisma.generatorProfile.findUnique({
    where: { userId: generator.id }
  });

  if (profile) {
    // 3. Create a Land Parcel
    const parcel = await prisma.landParcel.create({
      data: {
        generatorId: profile.id,
        parcelName: 'Bhor Mangrove Reserve',
        ecosystemType: 'MANGROVE',
        geofence: JSON.stringify([{ lat: 18.1, lng: 73.8 }, { lat: 18.2, lng: 73.9 }]),
        totalAreaHa: 150.5,
        claimedCredits: 500,
        status: 'APPROVED',
        totalCreditsIssued: 500,
        estimates: {
          create: {
            source: 'SATELLITE',
            sourceImages: JSON.stringify(['https://example.com/sat1.jpg']),
            estimatedCredits: 510,
            vegetationCoverPct: 85.5,
            estimatedBiomass: 1200,
            confidence: 0.92,
            modelVersion: 'v1.2.0',
            deltaPct: 2.0,
            decision: 'AUTO_APPROVED'
          }
        }
      }
    });
    console.log('Created Parcel:', parcel.parcelName);
  }

  // 4. Create a dummy Buyer
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@demo.com' },
    update: {},
    create: {
      clerkId: 'demo_buy_1',
      email: 'buyer@demo.com',
      name: 'Demo Buyer',
      role: 'BUYER',
      buyerProfile: {
        create: {
          buyerType: 'COMPANY',
          companyName: 'Acme Corp',
          industry: 'Manufacturing',
          annualEmissionsTco2e: 10000,
          wantedCredits: 2000,
        }
      }
    }
  });

  console.log('Created Buyer:', buyer.email);
  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
