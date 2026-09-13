#!/usr/bin/env python3
"""
Manual Database Seeding Script for Circular Carbon MRV
Directly populates SQLite tables with Clerk test data and demo ecosystem records.
Works completely standalone using Python's built-in sqlite3.
"""

import sqlite3
import json
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Locate databases
ROOT_DIR = Path(__file__).resolve().parent.parent if Path(__file__).resolve().parent.name == "scripts" else Path(__file__).resolve().parent
DB_PATHS = [
    ROOT_DIR / "carbon-mrv" / "prisma" / "dev.db",
    ROOT_DIR / "carbon-mrv" / "dev.db",
]

CLERK_USERS = [
    {
        "fallback_id": "user_admin_01",
        "clerkId": "user_3JAY3ORequT7Juje7yVsMcVA8wo",
        "email": "kvbhavsar35@gmail.com",
        "name": "Kavan Bhavsar (Admin)",
        "role": "ADMIN",
        "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "isActive": 1
    },
    {
        "fallback_id": "user_gen_01",
        "clerkId": "user_3JExuOdgBFddWHZY4RJ5CfyWAFo",
        "email": "kavanbhavsargpa@gmail.com",
        "aliases": ["kavanbhavasrgpa@gmail.com"],
        "name": "Kavan Bhavsar (Generator)",
        "role": "GENERATOR",
        "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "isActive": 1
    },
    {
        "fallback_id": "user_buyer_01",
        "clerkId": "user_3JE2ias7q6Dq9sTUdoBgXxcXASi",
        "email": "contact.kavanbhavsar@gmail.com",
        "name": "Kavan Bhavsar (Buyer)",
        "role": "BUYER",
        "walletAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
        "isActive": 1
    },
    {
        "fallback_id": "user_approver_01",
        "clerkId": "user_3JF8RrHThiX0MczlrVzs5t2MGSi",
        "email": "photoskavanbhavsar@gmail.com",
        "name": "Kavan Bhavsar (Approver)",
        "role": "APPROVER",
        "walletAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "isActive": 1
    }
]


def seed_database(db_path: Path):
    print(f"\n==================================================")
    print(f" Connecting to SQLite database at:\n {db_path}")
    print(f"==================================================")

    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Upsert Users
    for u in CLERK_USERS:
        # Check if user exists by email or aliases
        emails_to_check = [u["email"]] + u.get("aliases", [])
        placeholders = ",".join(["?"] * len(emails_to_check))
        row = cursor.execute(
            f'SELECT id FROM "User" WHERE email IN ({placeholders}) LIMIT 1;',
            emails_to_check
        ).fetchone()

        if row:
            user_id = row[0]
            cursor.execute("""
                UPDATE "User"
                SET role = ?,
                    name = ?,
                    walletAddress = ?,
                    isActive = ?,
                    updatedAt = datetime('now')
                WHERE id = ?;
            """, (u["role"], u["name"], u["walletAddress"], u["isActive"], user_id))
        else:
            user_id = u["fallback_id"]
            cursor.execute("""
                INSERT INTO "User" (id, clerkId, email, name, role, walletAddress, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));
            """, (user_id, u["clerkId"], u["email"], u["name"], u["role"], u["walletAddress"], u["isActive"]))

    # Also insert alias email if missing
    for u in CLERK_USERS:
        for alias in u.get("aliases", []):
            row = cursor.execute('SELECT id FROM "User" WHERE email = ?;', (alias,)).fetchone()
            if not row:
                cursor.execute("""
                    INSERT OR IGNORE INTO "User" (id, clerkId, email, name, role, walletAddress, isActive, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));
                """, (f"{u['fallback_id']}_alias", f"{u['clerkId']}_alias", alias, u["name"], u["role"], u["walletAddress"], u["isActive"]))

    print(f"✓ Seeded and updated Clerk Users")

    # Resolve active User IDs
    def get_user_id(emails):
        if isinstance(emails, str):
            emails = [emails]
        placeholders = ",".join(["?"] * len(emails))
        res = cursor.execute(f'SELECT id FROM "User" WHERE email IN ({placeholders}) LIMIT 1;', emails).fetchone()
        return res[0] if res else None

    gen_user_id = get_user_id(["kavanbhavsargpa@gmail.com", "kavanbhavasrgpa@gmail.com"])
    buy_user_id = get_user_id("contact.kavanbhavsar@gmail.com")
    app_user_id = get_user_id("photoskavanbhavsar@gmail.com")
    admin_user_id = get_user_id("kvbhavsar35@gmail.com")

    # 2. Generator Profile
    gen_prof_id = "gen_prof_01"
    existing_gp = cursor.execute('SELECT id FROM "GeneratorProfile" WHERE userId = ?;', (gen_user_id,)).fetchone()
    if existing_gp:
        gen_prof_id = existing_gp[0]
        cursor.execute("""
            UPDATE "GeneratorProfile"
            SET organizationName = ?,
                contactPerson = ?,
                contactPhone = ?,
                state = ?,
                district = ?,
                village = ?,
                registrationNumber = ?,
                hasLegalPermits = 1,
                hasSurveyReport = 1,
                hasEnvironmentalClearance = 1,
                locked = 0
            WHERE id = ?;
        """, (
            "Gujarat Coastal Ecology Commission", "Kavan Bhavsar", "+919876543210",
            "Gujarat", "Kutch", "Mundra", "REG-GUJ-MRV-2026-001", gen_prof_id
        ))
    else:
        cursor.execute("""
            INSERT INTO "GeneratorProfile" (
                id, userId, entityType, organizationName, contactPerson, contactPhone,
                state, district, village, registrationNumber, hasLegalPermits,
                hasSurveyReport, hasEnvironmentalClearance, locked
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 0);
        """, (
            gen_prof_id, gen_user_id, "COMPANY", "Gujarat Coastal Ecology Commission",
            "Kavan Bhavsar", "+919876543210", "Gujarat", "Kutch", "Mundra", "REG-GUJ-MRV-2026-001"
        ))
    print(f"✓ Seeded Generator Profile: gen_prof_id={gen_prof_id} for user={gen_user_id}")

    # 3. Buyer Profile
    buy_prof_id = "buy_prof_01"
    existing_bp = cursor.execute('SELECT id FROM "BuyerProfile" WHERE userId = ?;', (buy_user_id,)).fetchone()
    if existing_bp:
        buy_prof_id = existing_bp[0]
        cursor.execute("""
            UPDATE "BuyerProfile"
            SET companyName = ?,
                industry = ?,
                annualEmissionsTco2e = ?,
                wantedCredits = ?
            WHERE id = ?;
        """, ("EcoTech Global Holdings", "Technology & Renewable Infrastructure", 25000.0, 1000.0, buy_prof_id))
    else:
        cursor.execute("""
            INSERT INTO "BuyerProfile" (
                id, userId, buyerType, companyName, industry, annualEmissionsTco2e, wantedCredits
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (
            buy_prof_id, buy_user_id, "COMPANY", "EcoTech Global Holdings",
            "Technology & Renewable Infrastructure", 25000.0, 1000.0
        ))
    print(f"✓ Seeded Buyer Profile: buy_prof_id={buy_prof_id} for user={buy_user_id}")

    # 4. Land Parcels
    parcels = [
        {
            "id": "MRV-2026-001",
            "generatorId": gen_prof_id,
            "parcelName": "Mangrove Restoration — Gujarat",
            "ecosystemType": "MANGROVE",
            "state": "Gujarat",
            "district": "Kutch",
            "village": "Mundra",
            "geofence": json.dumps([
                {"lat": 22.825, "lng": 69.712},
                {"lat": 22.845, "lng": 69.735},
                {"lat": 22.835, "lng": 69.755},
                {"lat": 22.815, "lng": 69.732}
            ]),
            "totalAreaHa": 42.7,
            "claimedCredits": 120.0,
            "contractAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            "tokenId": "1",
            "status": "APPROVED",
            "totalCreditsIssued": 1000.0
        },
        {
            "id": "parcel_sundarbans_02",
            "generatorId": gen_prof_id,
            "parcelName": "Sundarbans Tidal Conservation Reserve",
            "ecosystemType": "MANGROVE",
            "state": "West Bengal",
            "district": "South 24 Parganas",
            "village": "Gosaba",
            "geofence": json.dumps([
                {"lat": 21.945, "lng": 88.825},
                {"lat": 21.965, "lng": 88.845}
            ]),
            "totalAreaHa": 85.0,
            "claimedCredits": 250.0,
            "contractAddress": None,
            "tokenId": None,
            "status": "PENDING_REVIEW",
            "totalCreditsIssued": 0.0
        }
    ]

    for lp in parcels:
        cursor.execute("""
            INSERT INTO "LandParcel" (
                id, generatorId, parcelName, ecosystemType, state, district, village,
                geofence, totalAreaHa, claimedCredits, contractAddress, tokenId,
                status, totalCreditsIssued, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                generatorId=excluded.generatorId,
                parcelName=excluded.parcelName,
                ecosystemType=excluded.ecosystemType,
                totalAreaHa=excluded.totalAreaHa,
                claimedCredits=excluded.claimedCredits,
                contractAddress=excluded.contractAddress,
                tokenId=excluded.tokenId,
                status=excluded.status,
                totalCreditsIssued=excluded.totalCreditsIssued,
                updatedAt=datetime('now');
        """, (
            lp["id"], lp["generatorId"], lp["parcelName"], lp["ecosystemType"],
            lp["state"], lp["district"], lp["village"], lp["geofence"],
            lp["totalAreaHa"], lp["claimedCredits"], lp["contractAddress"],
            lp["tokenId"], lp["status"], lp["totalCreditsIssued"]
        ))
    print(f"✓ Seeded {len(parcels)} Land Parcels")

    # 5. Parcel Extension
    cursor.execute("""
        INSERT INTO "ParcelExtension" (
            id, parcelId, additionalGeofence, claimedCredits, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
            additionalGeofence=excluded.additionalGeofence,
            claimedCredits=excluded.claimedCredits,
            status=excluded.status,
            updatedAt=datetime('now');
    """, (
        "ext_01", "MRV-2026-001",
        json.dumps([{"lat": 22.846, "lng": 69.736}, {"lat": 22.855, "lng": 69.745}]),
        35.0, "APPROVED"
    ))
    print("✓ Seeded Parcel Extension: ext_01")

    # 6. Carbon Estimates
    estimates = [
        {
            "id": "est_sat_01",
            "parcelId": "MRV-2026-001",
            "extensionId": None,
            "source": "SATELLITE",
            "sourceImages": json.dumps([
                "https://sentinel-hub.com/sample/sentinel2-gujarat-aug2026.tif",
                "https://planet.com/ortho/mundra-coastal-3m.tif"
            ]),
            "estimatedCredits": 125.7,
            "vegetationCoverPct": 88.4,
            "estimatedBiomass": 1480.0,
            "confidence": 0.942,
            "modelVersion": "UNet-Bitemporal-Biomass v2.4",
            "deltaPct": 21.57,
            "decision": "AUTO_APPROVED"
        },
        {
            "id": "est_drone_01",
            "parcelId": "MRV-2026-001",
            "extensionId": None,
            "source": "DRONE",
            "sourceImages": json.dumps([
                "https://drone-telemetry.local/ortho/mundra-lidar-2026.las"
            ]),
            "estimatedCredits": 128.2,
            "vegetationCoverPct": 91.2,
            "estimatedBiomass": 1510.0,
            "confidence": 0.965,
            "modelVersion": "Drone-Canopy-LiDAR v1.8",
            "deltaPct": 22.8,
            "decision": "AUTO_APPROVED"
        },
        {
            "id": "est_ext_01",
            "parcelId": "MRV-2026-001",
            "extensionId": "ext_01",
            "source": "SATELLITE",
            "sourceImages": json.dumps(["https://sentinel-hub.com/sample/extension.tif"]),
            "estimatedCredits": 36.5,
            "vegetationCoverPct": 82.1,
            "estimatedBiomass": 420.0,
            "confidence": 0.91,
            "modelVersion": "UNet-Bitemporal-Biomass v2.4",
            "deltaPct": 5.2,
            "decision": "PENDING_REVIEW"
        }
    ]

    for est in estimates:
        cursor.execute("""
            INSERT INTO "CarbonEstimate" (
                id, parcelId, extensionId, source, sourceImages, estimatedCredits,
                vegetationCoverPct, estimatedBiomass, confidence, modelVersion,
                deltaPct, decision, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                estimatedCredits=excluded.estimatedCredits,
                confidence=excluded.confidence,
                decision=excluded.decision;
        """, (
            est["id"], est["parcelId"], est["extensionId"], est["source"],
            est["sourceImages"], est["estimatedCredits"], est["vegetationCoverPct"],
            est["estimatedBiomass"], est["confidence"], est["modelVersion"],
            est["deltaPct"], est["decision"]
        ))
    print(f"✓ Seeded {len(estimates)} Carbon Estimates")

    # 7. Review Requests
    reviews = [
        {
            "id": "rev_req_01",
            "parcelId": "MRV-2026-001",
            "extensionId": None,
            "estimateId": "est_sat_01",
            "isRerequest": 0,
            "flaggedReason": None,
            "status": "APPROVED",
            "reviewedById": app_user_id,
            "comments": "Biomass density and biophysical growth delta confirmed against Sentinel-2 MSI multi-spectral imagery. 2/3 independent auditor consensus reached.",
            "reviewedAt": "2026-08-22 09:15:00"
        },
        {
            "id": "rev_req_02",
            "parcelId": "MRV-2026-001",
            "extensionId": "ext_01",
            "estimateId": "est_ext_01",
            "isRerequest": 0,
            "flaggedReason": None,
            "status": "PENDING",
            "reviewedById": None,
            "comments": "Geofence boundary expansion queued for auditor review.",
            "reviewedAt": None
        }
    ]

    for rr in reviews:
        cursor.execute("""
            INSERT INTO "ReviewRequest" (
                id, parcelId, extensionId, estimateId, isRerequest, flaggedReason,
                status, reviewedById, comments, reviewedAt, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                status=excluded.status,
                reviewedById=excluded.reviewedById,
                comments=excluded.comments,
                reviewedAt=excluded.reviewedAt;
        """, (
            rr["id"], rr["parcelId"], rr["extensionId"], rr["estimateId"],
            rr["isRerequest"], rr["flaggedReason"], rr["status"], rr["reviewedById"],
            rr["comments"], rr["reviewedAt"]
        ))
    print(f"✓ Seeded {len(reviews)} Review Requests (Auditor: {app_user_id})")

    # 8. Carbon Credits
    credits = [
        {
            "id": "CC-001",
            "parcelId": "MRV-2026-001",
            "onchainCreditId": "1",
            "amount": 1000.0,
            "vintage": 2026,
            "status": "ISSUED",
            "blockchainTxHash": "0x89f2d847120aefbc7812903847ab8901237c18903847ab8901237c18903847ab",
            "ownerWalletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "mintedAt": "2026-08-26 10:00:00",
            "retiredAt": None,
            "retiredReason": None
        },
        {
            "id": "RC-2026-00421",
            "parcelId": "MRV-2026-001",
            "onchainCreditId": "1-ret-00421",
            "amount": 25.0,
            "vintage": 2026,
            "status": "RETIRED",
            "blockchainTxHash": "0x3c71289ae04f56193796b1b72e9a5312384a86df790184b91238914028394018",
            "ownerWalletAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
            "mintedAt": "2026-08-26 10:00:00",
            "retiredAt": "2026-09-13 11:42:08",
            "retiredReason": "Corporate Net-Zero 2026 Scope 1 & 2 Neutralization Audit Cycle"
        }
    ]

    for cc in credits:
        cursor.execute("""
            INSERT INTO "CarbonCredit" (
                id, parcelId, onchainCreditId, amount, vintage, status,
                blockchainTxHash, ownerWalletAddress, mintedAt, retiredAt, retiredReason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                amount=excluded.amount,
                status=excluded.status,
                blockchainTxHash=excluded.blockchainTxHash,
                ownerWalletAddress=excluded.ownerWalletAddress,
                retiredAt=excluded.retiredAt,
                retiredReason=excluded.retiredReason;
        """, (
            cc["id"], cc["parcelId"], cc["onchainCreditId"], cc["amount"],
            cc["vintage"], cc["status"], cc["blockchainTxHash"], cc["ownerWalletAddress"],
            cc["mintedAt"], cc["retiredAt"], cc["retiredReason"]
        ))
    print(f"✓ Seeded {len(credits)} Carbon Credits (CC-001 & RC-2026-00421)")

    # 9. Purchase Requests
    purchases = [
        {
            "id": "purch_req_01",
            "buyerId": buy_prof_id,
            "requestedAmount": 300.0,
            "maxPricePerCredit": 45.0,
            "status": "FULFILLED"
        },
        {
            "id": "purch_req_02",
            "buyerId": buy_prof_id,
            "requestedAmount": 200.0,
            "maxPricePerCredit": 48.0,
            "status": "OPEN"
        }
    ]

    for pr in purchases:
        cursor.execute("""
            INSERT INTO "PurchaseRequest" (
                id, buyerId, requestedAmount, maxPricePerCredit, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                buyerId=excluded.buyerId,
                requestedAmount=excluded.requestedAmount,
                maxPricePerCredit=excluded.maxPricePerCredit,
                status=excluded.status,
                updatedAt=datetime('now');
        """, (pr["id"], pr["buyerId"], pr["requestedAmount"], pr["maxPricePerCredit"], pr["status"]))
    print(f"✓ Seeded {len(purchases)} Purchase Requests (Buyer: {buy_prof_id})")

    # 10. Transactions
    transactions = [
        {
            "id": "tx_mint_01",
            "type": "MINT",
            "fromUserId": None,
            "toUserId": gen_user_id,
            "parcelId": "MRV-2026-001",
            "creditId": "CC-001",
            "amount": 1000.0,
            "pricePerCredit": None,
            "totalPrice": None,
            "currency": "ETH",
            "txHash": "0x89f2d847120aefbc7812903847ab8901237c18903847ab8901237c18903847ab",
            "blockNumber": 6482914,
            "status": "COMPLETED"
        },
        {
            "id": "tx_buffer_02",
            "type": "TRANSFER",
            "fromUserId": gen_user_id,
            "toUserId": None,
            "parcelId": "MRV-2026-001",
            "creditId": "CC-001",
            "amount": 150.0,
            "pricePerCredit": 0.0,
            "totalPrice": 0.0,
            "currency": "ETH",
            "txHash": "0x12a9ef903847120aefbc7812903847ab8901237c18903847ab8901237c189038",
            "blockNumber": 6482920,
            "status": "COMPLETED"
        },
        {
            "id": "tx_transfer_03",
            "type": "TRANSFER",
            "fromUserId": gen_user_id,
            "toUserId": buy_user_id,
            "parcelId": "MRV-2026-001",
            "creditId": "CC-001",
            "amount": 300.0,
            "pricePerCredit": 45.0,
            "totalPrice": 13500.0,
            "currency": "ETH",
            "txHash": "0x55bc120aefbc7812903847ab8901237c18903847ab8901237c18903847ab8901",
            "blockNumber": 6483050,
            "status": "COMPLETED"
        },
        {
            "id": "tx_retire_04",
            "type": "RETIRE",
            "fromUserId": buy_user_id,
            "toUserId": None,
            "parcelId": "MRV-2026-001",
            "creditId": "RC-2026-00421",
            "amount": 25.0,
            "pricePerCredit": None,
            "totalPrice": None,
            "currency": "ETH",
            "txHash": "0x3c71289ae04f56193796b1b72e9a5312384a86df790184b91238914028394018",
            "blockNumber": 6483119,
            "status": "COMPLETED"
        }
    ]

    for tx in transactions:
        cursor.execute("""
            INSERT INTO "Transaction" (
                id, type, fromUserId, toUserId, parcelId, creditId, amount,
                pricePerCredit, totalPrice, currency, txHash, blockNumber, status, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                fromUserId=excluded.fromUserId,
                toUserId=excluded.toUserId,
                status=excluded.status,
                txHash=excluded.txHash;
        """, (
            tx["id"], tx["type"], tx["fromUserId"], tx["toUserId"], tx["parcelId"],
            tx["creditId"], tx["amount"], tx["pricePerCredit"], tx["totalPrice"],
            tx["currency"], tx["txHash"], tx["blockNumber"], tx["status"]
        ))
    print(f"✓ Seeded {len(transactions)} Blockchain Transactions")

    conn.commit()

    # Print summary counts for all tables
    print("\n--------------------------------------------------")
    print(" SQLite Database Table Row Count Verification:")
    print("--------------------------------------------------")
    tables = [
        "User", "GeneratorProfile", "BuyerProfile", "LandParcel",
        "ParcelExtension", "CarbonEstimate", "ReviewRequest",
        "CarbonCredit", "PurchaseRequest", "Transaction"
    ]
    for table in tables:
        count = cursor.execute(f'SELECT COUNT(*) FROM "{table}";').fetchone()[0]
        print(f" • {table:<22} : {count:>3} rows")
    print("--------------------------------------------------")

    conn.close()


def main():
    print("==================================================")
    print(" Circular Carbon MRV - Standalone Database Seeder")
    print("==================================================")

    primary_db = DB_PATHS[0]
    seed_database(primary_db)

    secondary_db = DB_PATHS[1]
    if secondary_db != primary_db and secondary_db.exists():
        shutil.copy2(primary_db, secondary_db)
        print(f"\n✓ Synchronized database mirror to:\n  {secondary_db}")

    print("\n🎉 All 10 database tables seeded and verified successfully!")


if __name__ == "__main__":
    main()
