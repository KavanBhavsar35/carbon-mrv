export interface EvidenceRecord {
  observationDate: string;
  baselineAreaHa: number;
  currentAreaHa: number;
  changePct: number;
  integrityHash: string;
  hashVerified: boolean;
  sensor: string;
  resolution: string;
  cloudCover: string;
}

export interface MLVerificationRecord {
  observedCarbon: number;
  submittedClaim: number;
  deviation: number;
  anomalyRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  anomalyScore: number;
  confidence: number;
  canopyCoverPct: number;
  statusText: string;
  modelVersion: string;
}

export interface CarbonClaimRecord {
  claimId: string;
  claimedQuantity: number;
  methodology: string;
  status: 'AWAITING_REVIEW' | 'VERIFIED' | 'REJECTED';
  submittedAt: string;
  generatorName: string;
  generatorWallet: string;
}

export interface AuditorRecord {
  id: string;
  name: string;
  organization: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedAt: string | null;
  signatureHash: string | null;
  txHash: string | null;
  notes: string;
}

export interface AuditTimelineItem {
  title: string;
  date: string;
  description: string;
  completed: boolean;
  current?: boolean;
}

export interface ProvenanceHistoryItem {
  step: 'ISSUED' | 'TRANSFERRED' | 'PARTIALLY_RETIRED';
  title: string;
  amount: number;
  date: string;
  txHash: string;
  from: string;
  to: string;
  certificateId?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  location: string;
  ecosystem: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  totalAreaHa: number;
  observedChangePct: number;
  estimatedCarbonTco2e: number;
  claimedCarbonTco2e: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: EvidenceRecord;
  mlVerification: MLVerificationRecord;
  claim: CarbonClaimRecord;
}

export interface ClaimReviewData {
  claimId: string;
  projectId: string;
  projectName: string;
  location: string;
  claimedTco2e: number;
  methodology: string;
  quorumRequired: number;
  quorumTotal: number;
  approvalsCurrent: number;
  auditors: AuditorRecord[];
  timeline: AuditTimelineItem[];
}

export interface CreditProvenanceData {
  creditId: string;
  tokenId: string;
  projectId: string;
  projectName: string;
  location: string;
  status: 'ACTIVE' | 'PARTIALLY_RETIRED' | 'FULLY_RETIRED';
  issuedTco2e: number;
  availableTco2e: number;
  retiredTco2e: number;
  reserveTco2e: number;
  vintage: number;
  methodology: string;
  blockchain: {
    network: string;
    chainId: number;
    contractAddress: string;
    registryAddress: string;
    governanceAddress: string;
    bufferPoolAddress: string;
    mintTxHash: string;
    blockNumber: number;
    statusText: string;
    explorerUrl: string;
  };
  history: ProvenanceHistoryItem[];
}

export interface VerificationCheckItem {
  name: string;
  verified: boolean;
  detail: string;
}

export interface RetirementCertificateData {
  certificateId: string;
  quantityTco2e: number;
  status: 'PERMANENTLY RETIRED';
  projectName: string;
  location: string;
  creditId: string;
  tokenId: string;
  vintage: number;
  methodology: string;
  retiredBy: string;
  retiredByEntity: string;
  retiredOn: string;
  reason: string;
  network: string;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  originalIssuedTco2e: number;
  previouslyRetiredTco2e: number;
  remainingAvailableTco2e: number;
  verificationChecks: VerificationCheckItem[];
}

// -------------------------------------------------------------
// PRIMARY DEMO DATASET (Unified Single-Project Journey)
// -------------------------------------------------------------

export const PRIMARY_PROJECT: ProjectData = {
  id: 'MRV-2026-001',
  name: 'Mangrove Restoration — Gujarat',
  location: 'Gujarat, India',
  ecosystem: 'Coastal Mangrove (Avicennia marina & Rhizophora)',
  status: 'VERIFIED',
  totalAreaHa: 42.7,
  observedChangePct: 21.57,
  estimatedCarbonTco2e: 125.7,
  claimedCarbonTco2e: 120.0,
  risk: 'LOW',
  evidence: {
    observationDate: '12 Aug 2026',
    baselineAreaHa: 38.2,
    currentAreaHa: 46.4,
    changePct: 21.57,
    integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    hashVerified: true,
    sensor: 'Sentinel-2 MSI Multi-Spectral & Drone Orthomosaic',
    resolution: '3.0m ground resolution',
    cloudCover: '< 1.2%'
  },
  mlVerification: {
    observedCarbon: 125.7,
    submittedClaim: 120.0,
    deviation: -4.5,
    anomalyRisk: 'LOW',
    anomalyScore: 0.08,
    confidence: 94.2,
    canopyCoverPct: 88.4,
    statusText: 'Consistent with observed biophysical evidence',
    modelVersion: 'UNet-Bitemporal-Biomass v2.4'
  },
  claim: {
    claimId: 'CL-1024',
    claimedQuantity: 120.0,
    methodology: 'IPCC Tier-2 Wetland Supplementary Guidance',
    status: 'VERIFIED',
    submittedAt: '18 Aug 2026',
    generatorName: 'Gujarat Coastal Ecology Commission',
    generatorWallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  }
};

export const PRIMARY_CLAIM_REVIEW: ClaimReviewData = {
  claimId: 'CL-1024',
  projectId: 'MRV-2026-001',
  projectName: 'Mangrove Restoration — Gujarat',
  location: 'Gujarat, India',
  claimedTco2e: 120.0,
  methodology: 'IPCC Tier-2',
  quorumRequired: 2,
  quorumTotal: 3,
  approvalsCurrent: 2,
  auditors: [
    {
      id: 'auditor-1',
      name: 'Auditor A (Bureau Veritas Marine)',
      organization: 'Bureau Veritas Quality Assurance',
      status: 'APPROVED',
      approvedAt: '20 Aug 2026, 14:32 UTC',
      signatureHash: '0x4a18b9f71c998c3e2910fa7281903c71a0129fec81923',
      txHash: '0x4a18b9f71c998c3e2910fa7281903c71a0129fec81923',
      notes: 'Biomass density cross-checked with SAR radar backscatter. Geofence boundaries verified against State Coastal Zone Authority registry.'
    },
    {
      id: 'auditor-2',
      name: 'Auditor B (DNV Climate Integrity)',
      organization: 'DNV GL Verification AS',
      status: 'APPROVED',
      approvedAt: '22 Aug 2026, 09:15 UTC',
      signatureHash: '0x9e22c81729da4719038ba718903c61529a9103c8471',
      txHash: '0x9e22c81729da4719038ba718903c61529a9103c8471',
      notes: 'ML anomaly score 0.08 is well within acceptable variance. Baseline NDVI threshold confirmed.'
    },
    {
      id: 'auditor-3',
      name: 'Auditor C (TÜV SÜD Carbon Services)',
      organization: 'TÜV SÜD South Asia',
      status: 'PENDING',
      approvedAt: null,
      signatureHash: null,
      txHash: null,
      notes: 'Soil core field telemetry audit in progress. Quorum threshold already satisfied by Auditors A and B.'
    }
  ],
  timeline: [
    {
      title: 'Claim Submitted',
      date: '18 Aug 2026',
      description: 'Submitted by Gujarat Coastal Ecology Commission with 120.0 tCO₂e claim',
      completed: true
    },
    {
      title: 'ML Verification Completed',
      date: '19 Aug 2026',
      description: 'UNet bi-temporal estimation: 125.7 tCO₂e, Anomaly score: 0.08 (LOW)',
      completed: true
    },
    {
      title: 'Auditor A Approved',
      date: '20 Aug 2026',
      description: 'Bureau Veritas confirmed biophysical evidence and boundary geofence',
      completed: true
    },
    {
      title: 'Auditor B Approved',
      date: '22 Aug 2026',
      description: 'DNV confirmed quorum threshold reached (2 of 3 independent approvals)',
      completed: true
    },
    {
      title: 'Auditor C Pending',
      date: 'In Review',
      description: 'TÜV SÜD field telemetry in validation queue',
      completed: false,
      current: true
    },
    {
      title: 'Credit Eligible for Issuance',
      date: 'Ready',
      description: 'Threshold satisfied (2/3). Ready for on-chain ERC-1155 minting',
      completed: false
    }
  ]
};

export const PRIMARY_CREDIT: CreditProvenanceData = {
  creditId: 'CC-001',
  tokenId: '1',
  projectId: 'MRV-2026-001',
  projectName: 'Mangrove Restoration — Gujarat',
  location: 'Gujarat, India',
  status: 'ACTIVE',
  issuedTco2e: 1000.0,
  availableTco2e: 850.0,
  retiredTco2e: 150.0,
  reserveTco2e: 150.0,
  vintage: 2026,
  methodology: 'IPCC Tier-2',
  blockchain: {
    network: 'Ethereum Sepolia',
    chainId: 11155111,
    contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    registryAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    governanceAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    bufferPoolAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    mintTxHash: '0x89f2d847120aefbc7812903847ab8901237c18903847ab8901237c18903847ab',
    blockNumber: 6482914,
    statusText: 'Confirmed',
    explorerUrl: 'https://sepolia.etherscan.io/address/0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  },
  history: [
    {
      step: 'ISSUED',
      title: 'Initial Batch Minted',
      amount: 1000.0,
      date: '26 Aug 2026',
      txHash: '0x89f2d847120aefbc7812903847ab8901237c18903847ab8901237c18903847ab',
      from: '0x0000000000000000000000000000000000000000',
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (Registry Custody)'
    },
    {
      step: 'TRANSFERRED',
      title: '15% Buffer Reserve Allocation',
      amount: 150.0,
      date: '26 Aug 2026',
      txHash: '0x12a9ef903847120aefbc7812903847ab8901237c18903847ab8901237c189038',
      from: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      to: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 (CarbonBufferPool)'
    },
    {
      step: 'TRANSFERRED',
      title: 'Institutional Transfer to Buyer',
      amount: 300.0,
      date: '02 Sep 2026',
      txHash: '0x55bc120aefbc7812903847ab8901237c18903847ab8901237c18903847ab8901',
      from: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199 (EcoTech Global Holdings)'
    },
    {
      step: 'PARTIALLY_RETIRED',
      title: 'Partial Retirement Executed',
      amount: 25.0,
      date: '13 Sep 2026',
      txHash: '0x3c71289ae04f56193796b1b72e9a5312384a86df790184b91238914028394018',
      from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      to: '0x000000000000000000000000000000000000dEaD (Permanent Burn)',
      certificateId: 'RC-2026-00421'
    }
  ]
};

export const PRIMARY_RETIREMENT: RetirementCertificateData = {
  certificateId: 'RC-2026-00421',
  quantityTco2e: 25.0,
  status: 'PERMANENTLY RETIRED',
  projectName: 'Mangrove Restoration Project',
  location: 'Gujarat, India',
  creditId: 'CC-001',
  tokenId: '1',
  vintage: 2026,
  methodology: 'IPCC Tier-2 Wetland Supplementary Guidance',
  retiredBy: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
  retiredByEntity: 'EcoTech Global Holdings (Corporate Net-Zero 2026 Scope 1 & 2 Neutralization)',
  retiredOn: '13 Sep 2026',
  reason: 'Corporate Net-Zero 2026 Scope 1 & 2 Neutralization Audit Cycle',
  network: 'Ethereum Sepolia',
  contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  txHash: '0x3c71289ae04f56193796b1b72e9a5312384a86df790184b91238914028394018',
  blockNumber: 6483119,
  originalIssuedTco2e: 1000.0,
  previouslyRetiredTco2e: 125.0,
  remainingAvailableTco2e: 850.0,
  verificationChecks: [
    {
      name: 'Project exists',
      verified: true,
      detail: 'Mangrove Restoration — Gujarat registered under ID MRV-2026-001'
    },
    {
      name: 'Carbon claim verified',
      verified: true,
      detail: '120.0 tCO₂e validated by UNet bi-temporal biomass estimator with 94.2% confidence'
    },
    {
      name: 'Auditor approval recorded',
      verified: true,
      detail: 'M-of-N governance quorum reached with 2 of 3 independent auditor signatures'
    },
    {
      name: 'Credit issuance recorded',
      verified: true,
      detail: 'ProductionCarbonCredit1155 Token #1 minted and scaled to 1,000,000 sub-units'
    },
    {
      name: 'Retirement transaction confirmed',
      verified: true,
      detail: 'Permanent burn transaction verified on Ethereum Sepolia (342 block confirmations)'
    },
    {
      name: 'Retired quantity burned',
      verified: true,
      detail: '25,000 sub-units (25.000 tCO₂e) burned to null address. Balance decremented.'
    },
    {
      name: 'Double-retirement prevented',
      verified: true,
      detail: 'Smart contract enforces burn irreversibility and prohibits re-minting or secondary transfers'
    }
  ]
};

// -------------------------------------------------------------
// GETTER HELPERS (Supports Dynamic IDs with Fallback to Demo Data)
// -------------------------------------------------------------

export function getProjectData(id?: string): ProjectData {
  if (!id || id === 'MRV-2026-001' || id === 'demo' || id === '1') {
    return PRIMARY_PROJECT;
  }
  // Return adapted project
  return {
    ...PRIMARY_PROJECT,
    id: id,
    name: id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  };
}

export function getClaimData(id?: string): ClaimReviewData {
  if (!id || id === 'CL-1024' || id === 'demo' || id === '1') {
    return PRIMARY_CLAIM_REVIEW;
  }
  return {
    ...PRIMARY_CLAIM_REVIEW,
    claimId: id
  };
}

export function getCreditData(id?: string): CreditProvenanceData {
  if (!id || id === 'CC-001' || id === 'demo' || id === '1') {
    return PRIMARY_CREDIT;
  }
  return {
    ...PRIMARY_CREDIT,
    creditId: id
  };
}

export function getRetirementData(id?: string): RetirementCertificateData {
  if (!id || id === 'RC-2026-00421' || id === 'demo' || id === '1') {
    return PRIMARY_RETIREMENT;
  }
  return {
    ...PRIMARY_RETIREMENT,
    certificateId: id
  };
}
