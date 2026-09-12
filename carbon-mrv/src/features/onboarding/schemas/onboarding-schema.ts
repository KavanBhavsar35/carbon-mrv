import { z } from 'zod';

export const generatorRegistrationSchema = z
  .object({
    entityType: z.enum(['INDIVIDUAL', 'NGO', 'PANCHAYAT', 'COMMUNITY', 'COMPANY'], {
      error: 'Please select an entity type'
    }),
    organizationName: z.string(),
    contactPerson: z.string().min(2, 'Contact person name must be at least 2 characters'),
    contactPhone: z.string().min(7, 'Please provide a valid contact phone number'),
    state: z.string().min(2, 'State is required'),
    district: z.string().min(2, 'District is required'),
    village: z.string().min(2, 'Village or locality is required'),
    registrationNumber: z.string(),
    walletAddress: z
      .string()
      .refine(
        (val) => !val || /^0x[a-fA-F0-9]{40}$/.test(val),
        'Invalid EVM wallet address format (should start with 0x followed by 40 hex chars)'
      ),
    hasLegalPermits: z.boolean(),
    hasSurveyReport: z.boolean(),
    hasEnvironmentalClearance: z.boolean()
  })
  .refine(
    (data) => {
      if (data.entityType !== 'INDIVIDUAL' && (!data.organizationName || data.organizationName.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Organization name is required for non-individual entities',
      path: ['organizationName']
    }
  );

export type GeneratorRegistrationInput = z.infer<typeof generatorRegistrationSchema>;

export const buyerRegistrationSchema = z
  .object({
    buyerType: z.enum(['INDIVIDUAL', 'COMPANY'], {
      error: 'Please select buyer type'
    }),
    companyName: z.string(),
    industry: z.string(),
    annualEmissionsTco2e: z
      .number({ error: 'Please enter annual emissions in tCO2e' })
      .min(0, 'Emissions must be 0 or greater')
      .optional(),
    wantedCredits: z
      .number({ error: 'Please enter target carbon credits needed' })
      .min(1, 'Target credits must be at least 1'),
    contactPhone: z.string().min(7, 'Please provide a valid contact phone number'),
    walletAddress: z
      .string()
      .refine(
        (val) => !val || /^0x[a-fA-F0-9]{40}$/.test(val),
        'Invalid EVM wallet address format (should start with 0x followed by 40 hex chars)'
      )
  })
  .refine(
    (data) => {
      if (data.buyerType === 'COMPANY' && (!data.companyName || data.companyName.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Company name is required for corporate buyers',
      path: ['companyName']
    }
  );

export type BuyerRegistrationInput = z.infer<typeof buyerRegistrationSchema>;
