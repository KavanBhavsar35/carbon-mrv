-- Carbon MRV Seed Data
-- Passwords: admin123, owner123, verifier123, user123 (bcrypt hashed)
-- Run after init_db.py has created the schema.

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO users (id, email, hashed_password, name, phone, role, wallet_address, organization, country, is_active, created_at, updated_at)
VALUES
  ('u-admin-0001', 'admin@carbonmrv.io',
   '$2b$12$KIXQ3J5z8F1mZ0T5Wq3X4OQkK1RjGvL9mVdN6bYcPsD2hEtFwA5Zy',
   'Admin User', '+91-9000000001', 'ADMIN',
   '0xAdminWalletAddress000000000000000000001', 'Carbon MRV Foundation', 'India',
   1, datetime('now'), datetime('now')),

  ('u-owner-0001', 'ravi.sharma@sundarbans-ngo.org',
   '$2b$12$A3kzPQm7RXjY2LnB9CvT8eHqD4sWgM1NpEuF6oUiJb0yVwOlKcRtS',
   'Ravi Sharma', '+91-9000000002', 'PROJECT_OWNER',
   '0xOwnerWallet00000000000000000000000002', 'Sundarbans Conservation NGO', 'India',
   1, datetime('now'), datetime('now')),

  ('u-owner-0002', 'priya.nair@keralacoast.com',
   '$2b$12$A3kzPQm7RXjY2LnB9CvT8eHqD4sWgM1NpEuF6oUiJb0yVwOlKcRtS',
   'Priya Nair', '+91-9000000003', 'PROJECT_OWNER',
   '0xOwnerWallet00000000000000000000000003', 'Kerala Coastal Communities', 'India',
   1, datetime('now'), datetime('now')),

  ('u-verifier-0001', 'ananya.verma@greencert.in',
   '$2b$12$B5qrMNs8SYlZ3UoC0DwU9fIrE5tXhN2OpFvG7pViKc1zWhPmLdSmT',
   'Ananya Verma', '+91-9000000004', 'VERIFIER',
   '0xVerifierWallet0000000000000000000004', 'GreenCert India', 'India',
   1, datetime('now'), datetime('now')),

  ('u-user-0001', 'buyer@corporategreen.com',
   '$2b$12$C7stNOt9TZmA4VpD1ExV0gJsF6uYiO3PqGwH8qWjLd2AXiQnMeVnU',
   'Corporate Buyer', '+91-9000000005', 'USER',
   '0xBuyerWallet000000000000000000000005', 'GreenCorp Ltd', 'India',
   1, datetime('now'), datetime('now'));

-- ─────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO projects (
  id, owner_id, organization_name, organization_type,
  contact_person, email, phone,
  project_name, description, project_type,
  state, district, village,
  coordinates, total_area, estimated_credits_per_year,
  registration_number,
  has_legal_permits, has_survey_report, has_environmental_clearance,
  contract_address, token_id,
  status, total_credits_generated,
  created_at, updated_at
)
VALUES
  ('p-mangrove-001', 'u-owner-0001', 'Sundarbans Conservation NGO', 'NGO',
   'Ravi Sharma', 'ravi.sharma@sundarbans-ngo.org', '+91-9000000002',
   'Sundarbans Mangrove Restoration', 
   'Restoration and conservation of mangrove ecosystems in the Sundarbans delta to sequester CO2 and protect coastal biodiversity.',
   'MANGROVE',
   'West Bengal', '24 Parganas South', 'Gosaba',
   '{"type":"Polygon","coordinates":[[[88.4,21.9],[88.8,21.9],[88.8,22.2],[88.4,22.2],[88.4,21.9]]]}',
   450.0, 900.0,
   'REG-WB-2024-001',
   1, 1, 1,
   NULL, NULL,
   'ACTIVE', 1800.0,
   datetime('now','-180 days'), datetime('now')),

  ('p-seagrass-001', 'u-owner-0002', 'Kerala Coastal Communities', 'COMMUNITY',
   'Priya Nair', 'priya.nair@keralacoast.com', '+91-9000000003',
   'Vembanad Seagrass Conservation',
   'Protection and restoration of seagrass meadows in Vembanad lake to improve blue carbon sequestration and water quality.',
   'SEAGRASS',
   'Kerala', 'Alappuzha', 'Kuttanad',
   '{"type":"Polygon","coordinates":[[[76.3,9.4],[76.6,9.4],[76.6,9.7],[76.3,9.7],[76.3,9.4]]]}',
   180.0, 360.0,
   'REG-KL-2024-002',
   1, 1, 0,
   NULL, NULL,
   'PENDING', 0.0,
   datetime('now','-30 days'), datetime('now')),

  ('p-saltmarsh-001', 'u-owner-0001', 'Sundarbans Conservation NGO', 'NGO',
   'Ravi Sharma', 'ravi.sharma@sundarbans-ngo.org', '+91-9000000002',
   'Odisha Salt Marsh Protection',
   'Conservation of salt marsh habitats along the Odisha coastline for carbon sequestration and storm surge protection.',
   'SALT_MARSH',
   'Odisha', 'Kendrapara', 'Rajnagar',
   '{"type":"Polygon","coordinates":[[[86.7,20.5],[87.0,20.5],[87.0,20.8],[86.7,20.8],[86.7,20.5]]]}',
   280.0, 560.0,
   NULL,
   1, 0, 0,
   NULL, NULL,
   'APPROVED', 0.0,
   datetime('now','-60 days'), datetime('now'));

-- ─────────────────────────────────────────────
-- PROJECT USERS (Memberships)
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO project_users (id, project_id, user_id, role, joined_at)
VALUES
  ('pu-001', 'p-mangrove-001', 'u-owner-0001', 'OWNER',   datetime('now','-180 days')),
  ('pu-002', 'p-mangrove-001', 'u-verifier-0001', 'VIEWER', datetime('now','-90 days')),
  ('pu-003', 'p-seagrass-001', 'u-owner-0002', 'OWNER',   datetime('now','-30 days')),
  ('pu-004', 'p-saltmarsh-001', 'u-owner-0001', 'OWNER',  datetime('now','-60 days'));

-- ─────────────────────────────────────────────
-- IOT DEVICES
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO iot_devices (id, project_id, device_id, name, type, status, last_ping, metadata_json)
VALUES
  ('dev-001', 'p-mangrove-001', 'DEVICE-MNG-001', 'Mangrove Sensor Node Alpha', 'SENSOR', 'ACTIVE',
   datetime('now','-1 hours'),
   '{"manufacturer":"AquaSense","firmware":"2.1.4","battery_pct":87}'),

  ('dev-002', 'p-mangrove-001', 'DEVICE-MNG-002', 'Mangrove Weather Station', 'WEATHER_STATION', 'ACTIVE',
   datetime('now','-2 hours'),
   '{"manufacturer":"EnviroTech","firmware":"3.0.1","battery_pct":95}'),

  ('dev-003', 'p-mangrove-001', 'DEVICE-MNG-003', 'Drone Camera Unit 1', 'CAMERA', 'INACTIVE',
   datetime('now','-7 days'),
   '{"manufacturer":"AeroVision","firmware":"1.8.0","storage_gb":64}'),

  ('dev-004', 'p-seagrass-001', 'DEVICE-SEA-001', 'Seagrass Dissolved Oxygen Probe', 'SENSOR', 'ACTIVE',
   datetime('now','-30 minutes'),
   '{"manufacturer":"AquaSense","firmware":"2.1.4","battery_pct":72}');

-- ─────────────────────────────────────────────
-- MEASUREMENTS (representative time-series)
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO measurements (id, device_id, project_id, measurement_type, value, unit, timestamp, metadata_json)
VALUES
  -- Temperature readings
  ('m-001','dev-001','p-mangrove-001','TEMPERATURE', 28.4, 'celsius', datetime('now','-6 hours'), NULL),
  ('m-002','dev-001','p-mangrove-001','TEMPERATURE', 29.1, 'celsius', datetime('now','-5 hours'), NULL),
  ('m-003','dev-001','p-mangrove-001','TEMPERATURE', 29.7, 'celsius', datetime('now','-4 hours'), NULL),
  ('m-004','dev-001','p-mangrove-001','TEMPERATURE', 28.9, 'celsius', datetime('now','-3 hours'), NULL),
  ('m-005','dev-001','p-mangrove-001','TEMPERATURE', 28.2, 'celsius', datetime('now','-2 hours'), NULL),
  ('m-006','dev-001','p-mangrove-001','TEMPERATURE', 27.8, 'celsius', datetime('now','-1 hours'), NULL),

  -- Salinity readings
  ('m-007','dev-001','p-mangrove-001','SALINITY', 22.1, 'ppt', datetime('now','-6 hours'), NULL),
  ('m-008','dev-001','p-mangrove-001','SALINITY', 22.4, 'ppt', datetime('now','-4 hours'), NULL),
  ('m-009','dev-001','p-mangrove-001','SALINITY', 21.9, 'ppt', datetime('now','-2 hours'), NULL),

  -- pH readings
  ('m-010','dev-001','p-mangrove-001','PH', 7.8, 'pH', datetime('now','-6 hours'), NULL),
  ('m-011','dev-001','p-mangrove-001','PH', 7.9, 'pH', datetime('now','-3 hours'), NULL),
  ('m-012','dev-001','p-mangrove-001','PH', 7.7, 'pH', datetime('now','-1 hours'), NULL),

  -- Biomass estimate
  ('m-013','dev-001','p-mangrove-001','BIOMASS', 42.6, 'tonnes_per_ha', datetime('now','-24 hours'), '{"method":"allometric"}'),

  -- Dissolved Oxygen for seagrass project
  ('m-014','dev-004','p-seagrass-001','DISSOLVED_OXYGEN', 6.8, 'mg/L', datetime('now','-4 hours'), NULL),
  ('m-015','dev-004','p-seagrass-001','DISSOLVED_OXYGEN', 7.1, 'mg/L', datetime('now','-2 hours'), NULL),
  ('m-016','dev-004','p-seagrass-001','DISSOLVED_OXYGEN', 6.9, 'mg/L', datetime('now','-30 minutes'), NULL);

-- ─────────────────────────────────────────────
-- ML REPORTS
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO ml_reports (id, project_id, source_images, vegetation_cover_pct, estimated_biomass, anomaly_flags, model_version, confidence, created_at)
VALUES
  ('mlr-001', 'p-mangrove-001',
   '["https://storage.carbonmrv.io/images/mangrove-001-site1.jpg","https://storage.carbonmrv.io/images/mangrove-001-site2.jpg"]',
   73.5, 42.6, '[]', 'v1.0', 0.89,
   datetime('now','-90 days')),

  ('mlr-002', 'p-mangrove-001',
   '["https://storage.carbonmrv.io/images/mangrove-001-q2-1.jpg"]',
   76.2, 44.1, '[{"measurement_id":"m-013","reason":"Biomass increase >10% month-on-month; flag for manual review"}]',
   'v1.0', 0.85,
   datetime('now','-30 days'));

-- ─────────────────────────────────────────────
-- VERIFICATION REVIEWS
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO verification_reviews (id, project_id, verifier_id, status, comments, ml_report_id, reviewed_at)
VALUES
  ('vr-001', 'p-mangrove-001', 'u-verifier-0001', 'APPROVED',
   'ML report confirms >70% vegetation cover. IoT data consistent with active mangrove ecosystem. Legal permits verified. Approving for credit issuance.',
   'mlr-001', datetime('now','-85 days')),

  ('vr-002', 'p-mangrove-001', 'u-verifier-0001', 'PENDING',
   NULL,
   'mlr-002', datetime('now'));

-- ─────────────────────────────────────────────
-- CARBON CREDITS
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO carbon_credits (
  id, project_id, onchain_credit_id, amount, vintage, status,
  blockchain_tx_hash, owner_wallet_address,
  minted_at, retired_at, retired_reason,
  certification_body, certification_id,
  created_at, updated_at
)
VALUES
  ('cc-001', 'p-mangrove-001', '1', 900.0, 2024, 'SOLD',
   '0xTxHash001aabbccddee0000000000000000000000000000000000000000000001',
   '0xBuyerWallet000000000000000000000005',
   datetime('now','-80 days'), NULL, NULL,
   'Verra', 'VCS-2024-MNG-001',
   datetime('now','-80 days'), datetime('now','-10 days')),

  ('cc-002', 'p-mangrove-001', '2', 900.0, 2024, 'ISSUED',
   '0xTxHash002aabbccddee0000000000000000000000000000000000000000000002',
   '0xOwnerWallet00000000000000000000000002',
   datetime('now','-30 days'), NULL, NULL,
   'Verra', 'VCS-2024-MNG-002',
   datetime('now','-30 days'), datetime('now','-30 days'));

-- ─────────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO transactions (
  id, type, from_user_id, to_user_id, project_id, credit_id,
  amount, price_per_credit, total_price, currency,
  tx_hash, block_number, status, metadata_json, created_at
)
VALUES
  ('tx-001', 'MINT', NULL, 'u-owner-0001', 'p-mangrove-001', 'cc-001',
   900.0, NULL, NULL, 'ETH',
   '0xTxHash001aabbccddee0000000000000000000000000000000000000000000001',
   12001, 'COMPLETED', '{"event":"CreditIssued"}',
   datetime('now','-80 days')),

  ('tx-002', 'PURCHASE', 'u-owner-0001', 'u-user-0001', 'p-mangrove-001', 'cc-001',
   900.0, 0.005, 4.5, 'ETH',
   '0xTxHash003purchase000000000000000000000000000000000000000000000003',
   12050, 'COMPLETED', '{"marketplace":"Carbon MRV"}',
   datetime('now','-10 days')),

  ('tx-003', 'MINT', NULL, 'u-owner-0001', 'p-mangrove-001', 'cc-002',
   900.0, NULL, NULL, 'ETH',
   '0xTxHash002aabbccddee0000000000000000000000000000000000000000000002',
   12100, 'COMPLETED', '{"event":"CreditIssued"}',
   datetime('now','-30 days'));
