"""
Seed script — populates the SQLite database with realistic development data.

Usage (from backend/):
    uv run python seed.py

Run init_db.py first if the DB/tables don't exist yet.
The script regenerates bcrypt hashes at seed time so the passwords are always
correct regardless of bcrypt rounds configured elsewhere.
"""

import uuid
from datetime import datetime, timezone, timedelta

import bcrypt

# Fix passlib 1.7.4 compatibility with bcrypt 4.x/5.x
if not hasattr(bcrypt, "__about__"):
    class __about__:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = __about__

from passlib.context import CryptContext

from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.models.models import (
    User, Project, ProjectUser, IoTDevice,
    Measurement, MLReport, VerificationReview, CarbonCredit, Transaction,
)
from app.models.enums import (
    UserRole, OrganizationType, ProjectType, ProjectStatus, ProjectUserRole,
    DeviceType, DeviceStatus, MeasurementType, VerificationStatus,
    CreditStatus, TransactionType, TransactionStatus,
)

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def h(password: str) -> str:
    return pwd_ctx.hash(password)

def now_minus(days: int = 0, hours: int = 0, minutes: int = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days, hours=hours, minutes=minutes)

def main() -> None:
    print("Initialising schema…")
    init_db()

    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded — skipping.")
            return

        print("Seeding users…")
        admin = User(
            id="u-admin-0001", email="admin@carbonmrv.io",
            hashed_password=h("admin123"), name="Admin User",
            phone="+91-9000000001", role=UserRole.ADMIN,
            wallet_address="0xAdminWalletAddress000000000000000000001",
            organization="Carbon MRV Foundation", country="India", is_active=True,
            created_at=now_minus(days=365), updated_at=now_minus(days=1),
        )
        owner1 = User(
            id="u-owner-0001", email="ravi.sharma@sundarbans-ngo.org",
            hashed_password=h("owner123"), name="Ravi Sharma",
            phone="+91-9000000002", role=UserRole.PROJECT_OWNER,
            wallet_address="0xOwnerWallet00000000000000000000000002",
            organization="Sundarbans Conservation NGO", country="India", is_active=True,
            created_at=now_minus(days=200), updated_at=now_minus(days=1),
        )
        owner2 = User(
            id="u-owner-0002", email="priya.nair@keralacoast.com",
            hashed_password=h("owner123"), name="Priya Nair",
            phone="+91-9000000003", role=UserRole.PROJECT_OWNER,
            wallet_address="0xOwnerWallet00000000000000000000000003",
            organization="Kerala Coastal Communities", country="India", is_active=True,
            created_at=now_minus(days=60), updated_at=now_minus(days=1),
        )
        verifier = User(
            id="u-verifier-0001", email="ananya.verma@greencert.in",
            hashed_password=h("verifier123"), name="Ananya Verma",
            phone="+91-9000000004", role=UserRole.VERIFIER,
            wallet_address="0xVerifierWallet0000000000000000000004",
            organization="GreenCert India", country="India", is_active=True,
            created_at=now_minus(days=300), updated_at=now_minus(days=1),
        )
        buyer = User(
            id="u-user-0001", email="buyer@corporategreen.com",
            hashed_password=h("user123"), name="Corporate Buyer",
            phone="+91-9000000005", role=UserRole.USER,
            wallet_address="0xBuyerWallet000000000000000000000005",
            organization="GreenCorp Ltd", country="India", is_active=True,
            created_at=now_minus(days=90), updated_at=now_minus(days=1),
        )
        db.add_all([admin, owner1, owner2, verifier, buyer])
        db.flush()

        print("Seeding projects…")
        mangrove = Project(
            id="p-mangrove-001", owner_id=owner1.id,
            organization_name="Sundarbans Conservation NGO",
            organization_type=OrganizationType.NGO,
            contact_person="Ravi Sharma",
            email="ravi.sharma@sundarbans-ngo.org", phone="+91-9000000002",
            project_name="Sundarbans Mangrove Restoration",
            description=(
                "Restoration and conservation of mangrove ecosystems in the Sundarbans "
                "delta to sequester CO2 and protect coastal biodiversity."
            ),
            project_type=ProjectType.MANGROVE,
            state="West Bengal", district="24 Parganas South", village="Gosaba",
            coordinates={"type": "Polygon", "coordinates": [[[88.4, 21.9], [88.8, 21.9], [88.8, 22.2], [88.4, 22.2], [88.4, 21.9]]]},
            total_area=450.0, estimated_credits_per_year=900.0,
            registration_number="REG-WB-2024-001",
            has_legal_permits=True, has_survey_report=True, has_environmental_clearance=True,
            status=ProjectStatus.ACTIVE, total_credits_generated=1800.0,
            created_at=now_minus(days=180), updated_at=now_minus(days=1),
        )
        seagrass = Project(
            id="p-seagrass-001", owner_id=owner2.id,
            organization_name="Kerala Coastal Communities",
            organization_type=OrganizationType.COMMUNITY,
            contact_person="Priya Nair",
            email="priya.nair@keralacoast.com", phone="+91-9000000003",
            project_name="Vembanad Seagrass Conservation",
            description=(
                "Protection and restoration of seagrass meadows in Vembanad lake to "
                "improve blue carbon sequestration and water quality."
            ),
            project_type=ProjectType.SEAGRASS,
            state="Kerala", district="Alappuzha", village="Kuttanad",
            coordinates={"type": "Polygon", "coordinates": [[[76.3, 9.4], [76.6, 9.4], [76.6, 9.7], [76.3, 9.7], [76.3, 9.4]]]},
            total_area=180.0, estimated_credits_per_year=360.0,
            registration_number="REG-KL-2024-002",
            has_legal_permits=True, has_survey_report=True, has_environmental_clearance=False,
            status=ProjectStatus.PENDING, total_credits_generated=0.0,
            created_at=now_minus(days=30), updated_at=now_minus(days=1),
        )
        saltmarsh = Project(
            id="p-saltmarsh-001", owner_id=owner1.id,
            organization_name="Sundarbans Conservation NGO",
            organization_type=OrganizationType.NGO,
            contact_person="Ravi Sharma",
            email="ravi.sharma@sundarbans-ngo.org", phone="+91-9000000002",
            project_name="Odisha Salt Marsh Protection",
            description=(
                "Conservation of salt marsh habitats along the Odisha coastline for "
                "carbon sequestration and storm surge protection."
            ),
            project_type=ProjectType.SALT_MARSH,
            state="Odisha", district="Kendrapara", village="Rajnagar",
            coordinates={"type": "Polygon", "coordinates": [[[86.7, 20.5], [87.0, 20.5], [87.0, 20.8], [86.7, 20.8], [86.7, 20.5]]]},
            total_area=280.0, estimated_credits_per_year=560.0,
            registration_number=None,
            has_legal_permits=True, has_survey_report=False, has_environmental_clearance=False,
            status=ProjectStatus.APPROVED, total_credits_generated=0.0,
            created_at=now_minus(days=60), updated_at=now_minus(days=1),
        )
        db.add_all([mangrove, seagrass, saltmarsh])
        db.flush()

        print("Seeding project memberships…")
        db.add_all([
            ProjectUser(id="pu-001", project_id=mangrove.id, user_id=owner1.id, role=ProjectUserRole.OWNER, joined_at=now_minus(days=180)),
            ProjectUser(id="pu-002", project_id=mangrove.id, user_id=verifier.id, role=ProjectUserRole.VIEWER, joined_at=now_minus(days=90)),
            ProjectUser(id="pu-003", project_id=seagrass.id, user_id=owner2.id, role=ProjectUserRole.OWNER, joined_at=now_minus(days=30)),
            ProjectUser(id="pu-004", project_id=saltmarsh.id, user_id=owner1.id, role=ProjectUserRole.OWNER, joined_at=now_minus(days=60)),
        ])
        db.flush()

        print("Seeding IoT devices…")
        sensor_a = IoTDevice(
            id="dev-001", project_id=mangrove.id,
            device_id="DEVICE-MNG-001", name="Mangrove Sensor Node Alpha",
            type=DeviceType.SENSOR, status=DeviceStatus.ACTIVE,
            last_ping=now_minus(hours=1),
            metadata_json={"manufacturer": "AquaSense", "firmware": "2.1.4", "battery_pct": 87},
        )
        weather_a = IoTDevice(
            id="dev-002", project_id=mangrove.id,
            device_id="DEVICE-MNG-002", name="Mangrove Weather Station",
            type=DeviceType.WEATHER_STATION, status=DeviceStatus.ACTIVE,
            last_ping=now_minus(hours=2),
            metadata_json={"manufacturer": "EnviroTech", "firmware": "3.0.1", "battery_pct": 95},
        )
        camera_a = IoTDevice(
            id="dev-003", project_id=mangrove.id,
            device_id="DEVICE-MNG-003", name="Drone Camera Unit 1",
            type=DeviceType.CAMERA, status=DeviceStatus.INACTIVE,
            last_ping=now_minus(days=7),
            metadata_json={"manufacturer": "AeroVision", "firmware": "1.8.0", "storage_gb": 64},
        )
        sensor_b = IoTDevice(
            id="dev-004", project_id=seagrass.id,
            device_id="DEVICE-SEA-001", name="Seagrass Dissolved Oxygen Probe",
            type=DeviceType.SENSOR, status=DeviceStatus.ACTIVE,
            last_ping=now_minus(minutes=30),
            metadata_json={"manufacturer": "AquaSense", "firmware": "2.1.4", "battery_pct": 72},
        )
        db.add_all([sensor_a, weather_a, camera_a, sensor_b])
        db.flush()

        print("Seeding measurements…")
        temps = [
            (now_minus(hours=6), 28.4), (now_minus(hours=5), 29.1),
            (now_minus(hours=4), 29.7), (now_minus(hours=3), 28.9),
            (now_minus(hours=2), 28.2), (now_minus(hours=1), 27.8),
        ]
        measurements = [
            Measurement(id=f"m-t-{i}", device_id=sensor_a.id, project_id=mangrove.id,
                        measurement_type=MeasurementType.TEMPERATURE, value=v, unit="celsius",
                        timestamp=ts)
            for i, (ts, v) in enumerate(temps)
        ]
        salinities = [(now_minus(hours=6), 22.1), (now_minus(hours=4), 22.4), (now_minus(hours=2), 21.9)]
        measurements += [
            Measurement(id=f"m-s-{i}", device_id=sensor_a.id, project_id=mangrove.id,
                        measurement_type=MeasurementType.SALINITY, value=v, unit="ppt", timestamp=ts)
            for i, (ts, v) in enumerate(salinities)
        ]
        phs = [(now_minus(hours=6), 7.8), (now_minus(hours=3), 7.9), (now_minus(hours=1), 7.7)]
        measurements += [
            Measurement(id=f"m-p-{i}", device_id=sensor_a.id, project_id=mangrove.id,
                        measurement_type=MeasurementType.PH, value=v, unit="pH", timestamp=ts)
            for i, (ts, v) in enumerate(phs)
        ]
        measurements.append(
            Measurement(id="m-bio-0", device_id=sensor_a.id, project_id=mangrove.id,
                        measurement_type=MeasurementType.BIOMASS, value=42.6,
                        unit="tonnes_per_ha", timestamp=now_minus(hours=24),
                        metadata_json={"method": "allometric"})
        )
        dos = [(now_minus(hours=4), 6.8), (now_minus(hours=2), 7.1), (now_minus(minutes=30), 6.9)]
        measurements += [
            Measurement(id=f"m-do-{i}", device_id=sensor_b.id, project_id=seagrass.id,
                        measurement_type=MeasurementType.DISSOLVED_OXYGEN, value=v, unit="mg/L", timestamp=ts)
            for i, (ts, v) in enumerate(dos)
        ]
        db.add_all(measurements)
        db.flush()

        print("Seeding ML reports…")
        report1 = MLReport(
            id="mlr-001", project_id=mangrove.id,
            source_images=["https://storage.carbonmrv.io/images/mangrove-001-site1.jpg",
                            "https://storage.carbonmrv.io/images/mangrove-001-site2.jpg"],
            vegetation_cover_pct=73.5, estimated_biomass=42.6,
            anomaly_flags=[], model_version="v1.0", confidence=0.89,
            created_at=now_minus(days=90),
        )
        report2 = MLReport(
            id="mlr-002", project_id=mangrove.id,
            source_images=["https://storage.carbonmrv.io/images/mangrove-001-q2-1.jpg"],
            vegetation_cover_pct=76.2, estimated_biomass=44.1,
            anomaly_flags=[{"measurement_id": "m-bio-0", "reason": "Biomass increase >10% month-on-month; flag for manual review"}],
            model_version="v1.0", confidence=0.85,
            created_at=now_minus(days=30),
        )
        db.add_all([report1, report2])
        db.flush()

        print("Seeding verification reviews…")
        db.add_all([
            VerificationReview(
                id="vr-001", project_id=mangrove.id, verifier_id=verifier.id,
                status=VerificationStatus.APPROVED,
                comments="ML report confirms >70% vegetation cover. IoT data consistent with active mangrove ecosystem. Legal permits verified. Approving for credit issuance.",
                ml_report_id=report1.id, reviewed_at=now_minus(days=85),
            ),
            VerificationReview(
                id="vr-002", project_id=mangrove.id, verifier_id=verifier.id,
                status=VerificationStatus.PENDING,
                comments=None, ml_report_id=report2.id, reviewed_at=now_minus(hours=1),
            ),
        ])
        db.flush()

        print("Seeding carbon credits…")
        cc1 = CarbonCredit(
            id="cc-001", project_id=mangrove.id, onchain_credit_id="1",
            amount=900.0, vintage=2024, status=CreditStatus.SOLD,
            blockchain_tx_hash="0xTxHash001aabbccddee0000000000000000000000000000000000000000000001",
            owner_wallet_address=buyer.wallet_address,
            minted_at=now_minus(days=80), retired_at=None, retired_reason=None,
            certification_body="Verra", certification_id="VCS-2024-MNG-001",
            created_at=now_minus(days=80), updated_at=now_minus(days=10),
        )
        cc2 = CarbonCredit(
            id="cc-002", project_id=mangrove.id, onchain_credit_id="2",
            amount=900.0, vintage=2024, status=CreditStatus.ISSUED,
            blockchain_tx_hash="0xTxHash002aabbccddee0000000000000000000000000000000000000000000002",
            owner_wallet_address=owner1.wallet_address,
            minted_at=now_minus(days=30), retired_at=None, retired_reason=None,
            certification_body="Verra", certification_id="VCS-2024-MNG-002",
            created_at=now_minus(days=30), updated_at=now_minus(days=30),
        )
        db.add_all([cc1, cc2])
        db.flush()

        print("Seeding transactions…")
        db.add_all([
            Transaction(
                id="tx-001", type=TransactionType.MINT,
                from_user_id=None, to_user_id=owner1.id,
                project_id=mangrove.id, credit_id=cc1.id,
                amount=900.0, price_per_credit=None, total_price=None, currency="ETH",
                tx_hash="0xTxHash001aabbccddee0000000000000000000000000000000000000000000001",
                block_number=12001, status=TransactionStatus.COMPLETED,
                metadata_json={"event": "CreditIssued"}, created_at=now_minus(days=80),
            ),
            Transaction(
                id="tx-002", type=TransactionType.PURCHASE,
                from_user_id=owner1.id, to_user_id=buyer.id,
                project_id=mangrove.id, credit_id=cc1.id,
                amount=900.0, price_per_credit=0.005, total_price=4.5, currency="ETH",
                tx_hash="0xTxHash003purchase000000000000000000000000000000000000000000000003",
                block_number=12050, status=TransactionStatus.COMPLETED,
                metadata_json={"marketplace": "Carbon MRV"}, created_at=now_minus(days=10),
            ),
            Transaction(
                id="tx-003", type=TransactionType.MINT,
                from_user_id=None, to_user_id=owner1.id,
                project_id=mangrove.id, credit_id=cc2.id,
                amount=900.0, price_per_credit=None, total_price=None, currency="ETH",
                tx_hash="0xTxHash002aabbccddee0000000000000000000000000000000000000000000002",
                block_number=12100, status=TransactionStatus.COMPLETED,
                metadata_json={"event": "CreditIssued"}, created_at=now_minus(days=30),
            ),
        ])
        db.commit()
        print("Done! Database seeded successfully.")
        print("\nSeed accounts:")
        print("  admin@carbonmrv.io          / admin123    (ADMIN)")
        print("  ravi.sharma@sundarbans-ngo.org / owner123 (PROJECT_OWNER)")
        print("  priya.nair@keralacoast.com  / owner123    (PROJECT_OWNER)")
        print("  ananya.verma@greencert.in   / verifier123 (VERIFIER)")
        print("  buyer@corporategreen.com    / user123     (USER)")

    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    main()
