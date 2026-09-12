import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
  console.log('Cleaning all test parcels, estimates, reviews, credits, and transactions...');

  await prisma.transaction.deleteMany({});
  await prisma.carbonCredit.deleteMany({});
  await prisma.reviewRequest.deleteMany({});
  await prisma.carbonEstimate.deleteMany({});
  await prisma.parcelExtension.deleteMany({});
  await prisma.landParcel.deleteMany({});
  await prisma.purchaseRequest.deleteMany({});

  console.log('Successfully cleared all test data from SQLite database.');
  
  // Verify counts
  const parcelsCount = await prisma.landParcel.count();
  const creditsCount = await prisma.carbonCredit.count();
  const txCount = await prisma.transaction.count();
  console.log(`Current DB Counts: Parcels: ${parcelsCount}, Credits: ${creditsCount}, Transactions: ${txCount}`);
}

cleanData()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
