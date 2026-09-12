const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // We use string IDs to mock cuid
  const genId = 'cuid_gen_01';
  const buyId = 'cuid_buy_01';
  const genProfileId = 'cuid_gen_prof_01';
  const buyProfileId = 'cuid_buy_prof_01';
  const parcelId = 'cuid_parcel_01';
  const estId = 'cuid_est_01';

  db.run(`
    INSERT OR IGNORE INTO "User" (id, clerkId, email, name, role, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `, [genId, 'clerk_gen_mock', 'generator@demo.com', 'Demo Generator', 'GENERATOR']);

  db.run(`
    INSERT OR IGNORE INTO "GeneratorProfile" (id, userId, entityType, organizationName, contactPerson, contactPhone, state, district, village, hasLegalPermits, hasSurveyReport, hasEnvironmentalClearance, locked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 0)
  `, [genProfileId, genId, 'NGO', 'Green Earth NGO', 'Jane Doe', '+919876543210', 'Maharashtra', 'Pune', 'Bhor']);

  db.run(`
    INSERT OR IGNORE INTO "LandParcel" (id, generatorId, parcelName, ecosystemType, geofence, totalAreaHa, claimedCredits, status, totalCreditsIssued, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [parcelId, genProfileId, 'Bhor Mangrove Reserve', 'MANGROVE', '[{"lat":18.1,"lng":73.8}]', 150.5, 500.0, 'APPROVED', 500.0]);

  db.run(`
    INSERT OR IGNORE INTO "CarbonEstimate" (id, parcelId, source, sourceImages, estimatedCredits, vegetationCoverPct, estimatedBiomass, confidence, modelVersion, deltaPct, decision, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `, [estId, parcelId, 'SATELLITE', '["https://example.com/sat.jpg"]', 510.0, 85.5, 1200.0, 0.92, 'v1.2.0', 2.0, 'AUTO_APPROVED']);

  db.run(`
    INSERT OR IGNORE INTO "User" (id, clerkId, email, name, role, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `, [buyId, 'clerk_buy_mock', 'buyer@demo.com', 'Demo Buyer', 'BUYER']);

  db.run(`
    INSERT OR IGNORE INTO "BuyerProfile" (id, userId, buyerType, companyName, industry, annualEmissionsTco2e, wantedCredits)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [buyProfileId, buyId, 'COMPANY', 'Acme Corp', 'Manufacturing', 10000.0, 2000.0]);
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Successfully seeded dev.db with SQLite.');
});
