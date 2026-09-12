export interface CarbonEstimateResponse {
  estimatedCredits: number;
  vegetationCoverPct: number;
  estimatedBiomass: number;
  confidence: number;
  modelVersion: string;
  additionalityRating?: string;
  bufferPoolCredits?: number;
  netTradableCredits?: number;
  riskLevel?: string;
  anomalyScore?: number;
}

const getBaseUrl = () => {
  const url = process.env.ML_SERVICE_URL;
  if (!url) {
    return 'http://localhost:8000';
  }
  return url;
};

export async function predictDrone(
  images: string[],
  ecosystemType: string = 'MANGROVE',
  areaHa?: number,
  claimedCredits?: number
): Promise<CarbonEstimateResponse> {
  const response = await fetch(`${getBaseUrl()}/predict/drone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images, ecosystemType, areaHa, claimedCredits })
  });

  if (!response.ok) {
    throw new Error(`Drone prediction failed: ${response.statusText}`);
  }

  return response.json();
}

export async function predictSatellite(images: string[], parcelId: string, priorEstimate: number): Promise<CarbonEstimateResponse> {
  const response = await fetch(`${getBaseUrl()}/predict/satellite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images, parcelId, priorEstimate })
  });

  if (!response.ok) {
    throw new Error(`Satellite prediction failed: ${response.statusText}`);
  }

  return response.json();
}
