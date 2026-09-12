import { z } from 'zod';

export const parcelRegistrationSchema = z.object({
  parcelName: z.string().min(3, 'Parcel name must be at least 3 characters'),
  ecosystemType: z.enum(['MANGROVE', 'SEAGRASS', 'SALT_MARSH', 'CORAL_REEF', 'KELP_FOREST'], {
    error: 'Please select an ecosystem type',
  }),
  state: z.string().min(2, 'State / Province is required'),
  district: z.string().min(2, 'District / Region is required'),
  village: z.string().min(2, 'Village / Local Body is required'),
  claimedCredits: z
    .number({ error: 'Please enter claimed credits' })
    .min(1, 'Must claim at least 1 credit'),
  geofence: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      // Basic check for GeoJSON Feature or FeatureCollection of Polygons
      if (parsed.type === 'FeatureCollection' && parsed.features?.length > 0) {
        return true;
      }
      if (parsed.type === 'Feature' && parsed.geometry?.type === 'Polygon') {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, 'Invalid geofence data (must be valid GeoJSON Polygon)'),
});

export type ParcelRegistrationInput = z.infer<typeof parcelRegistrationSchema>;
