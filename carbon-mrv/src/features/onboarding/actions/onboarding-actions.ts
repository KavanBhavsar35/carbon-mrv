'use server';

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import {
  generatorRegistrationSchema,
  buyerRegistrationSchema,
  GeneratorRegistrationInput,
  BuyerRegistrationInput
} from '../schemas/onboarding-schema';
import { ActionResponse } from '@/lib/actions';

export type GeneratorProfileData = {
  id: string;
  userId: string;
  entityType: string;
  organizationName?: string | null;
  contactPerson: string;
  contactPhone: string;
  state: string;
  district: string;
  village: string;
  registrationNumber?: string | null;
  hasLegalPermits: boolean;
  hasSurveyReport: boolean;
  hasEnvironmentalClearance: boolean;
  locked: boolean;
};

export type BuyerProfileData = {
  id: string;
  userId: string;
  buyerType: string;
  companyName?: string | null;
  industry?: string | null;
  annualEmissionsTco2e?: number | null;
  wantedCredits: number;
};

export type RegistrationStatusResult = {
  isOnboarded: boolean;
  role?: string;
  user?: {
    id: string;
    clerkId: string;
    name: string;
    email: string;
    role: string;
    walletAddress?: string | null;
  };
  generatorProfile?: GeneratorProfileData | null;
  buyerProfile?: BuyerProfileData | null;
};

import { getAuthenticatedUser } from '@/lib/auth';

/**
 * Check current user onboarding / registration status
 */
export async function getRegistrationStatusAction(): Promise<ActionResponse<RegistrationStatusResult>> {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return { success: false, error: 'Unauthorized: User not logged in' };
    }

    const hasProfile =
      (dbUser.role === 'GENERATOR' && !!dbUser.generatorProfile) ||
      (dbUser.role === 'BUYER' && !!dbUser.buyerProfile) ||
      dbUser.role === 'ADMIN' ||
      dbUser.role === 'APPROVER';

    return {
      success: true,
      data: {
        isOnboarded: hasProfile,
        role: dbUser.role,
        user: {
          id: dbUser.id,
          clerkId: dbUser.clerkId,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          walletAddress: dbUser.walletAddress
        },
        generatorProfile: dbUser.generatorProfile,
        buyerProfile: dbUser.buyerProfile
      }
    };
  } catch (error: any) {
    console.error('Error in getRegistrationStatusAction:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch registration status'
    };
  }
}

/**
 * Register user as a Carbon Generator
 */
export async function registerGeneratorAction(
  rawInput: GeneratorRegistrationInput
): Promise<ActionResponse<{ profileId: string; role: string; profile: any }>> {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: 'Unauthorized: Please log in to complete registration' };
    }

    // Validate input with Zod
    const validated = generatorRegistrationSchema.safeParse(rawInput);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid form input';
      return { success: false, error: errorMsg };
    }

    const data = validated.data;
    const email = user.emailAddresses?.[0]?.emailAddress || '';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || data.contactPerson;

    // 1. Upsert User in database
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email,
        name,
        phone: data.contactPhone,
        role: 'GENERATOR',
        walletAddress: data.walletAddress || null
      },
      create: {
        clerkId: userId,
        email,
        name,
        phone: data.contactPhone,
        role: 'GENERATOR',
        walletAddress: data.walletAddress || null
      }
    });

    // 2. Upsert GeneratorProfile in database
    const generatorProfile = await prisma.generatorProfile.upsert({
      where: { userId: dbUser.id },
      update: {
        entityType: data.entityType,
        organizationName: data.organizationName || null,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        state: data.state,
        district: data.district,
        village: data.village,
        registrationNumber: data.registrationNumber || null,
        hasLegalPermits: data.hasLegalPermits,
        hasSurveyReport: data.hasSurveyReport,
        hasEnvironmentalClearance: data.hasEnvironmentalClearance
      },
      create: {
        userId: dbUser.id,
        entityType: data.entityType,
        organizationName: data.organizationName || null,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        state: data.state,
        district: data.district,
        village: data.village,
        registrationNumber: data.registrationNumber || null,
        hasLegalPermits: data.hasLegalPermits,
        hasSurveyReport: data.hasSurveyReport,
        hasEnvironmentalClearance: data.hasEnvironmentalClearance
      }
    });

    // 3. Update Clerk publicMetadata
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: 'GENERATOR',
          onboarded: true
        }
      });
    } catch (clerkErr) {
      console.warn('Warning: Failed to update Clerk publicMetadata directly:', clerkErr);
    }

    return {
      success: true,
      data: {
        profileId: generatorProfile.id,
        role: 'GENERATOR',
        profile: {
          ...generatorProfile,
          email: dbUser.email,
          name: dbUser.name,
          walletAddress: dbUser.walletAddress
        }
      }
    };
  } catch (error: any) {
    console.error('Error in registerGeneratorAction:', error);
    return {
      success: false,
      error: error?.message || 'Failed to complete Generator registration'
    };
  }
}

/**
 * Register user as a Credit Buyer
 */
export async function registerBuyerAction(
  rawInput: BuyerRegistrationInput
): Promise<ActionResponse<{ profileId: string; role: string; profile: any }>> {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: 'Unauthorized: Please log in to complete registration' };
    }

    // Validate input with Zod
    const validated = buyerRegistrationSchema.safeParse(rawInput);
    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid form input';
      return { success: false, error: errorMsg };
    }

    const data = validated.data;
    const email = user.emailAddresses?.[0]?.emailAddress || '';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || data.companyName || 'Credit Buyer';

    // 1. Upsert User in database
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email,
        name,
        phone: data.contactPhone,
        role: 'BUYER',
        walletAddress: data.walletAddress || null
      },
      create: {
        clerkId: userId,
        email,
        name,
        phone: data.contactPhone,
        role: 'BUYER',
        walletAddress: data.walletAddress || null
      }
    });

    // 2. Upsert BuyerProfile in database
    const buyerProfile = await prisma.buyerProfile.upsert({
      where: { userId: dbUser.id },
      update: {
        buyerType: data.buyerType,
        companyName: data.companyName || null,
        industry: data.industry || null,
        annualEmissionsTco2e: data.annualEmissionsTco2e ?? null,
        wantedCredits: data.wantedCredits
      },
      create: {
        userId: dbUser.id,
        buyerType: data.buyerType,
        companyName: data.companyName || null,
        industry: data.industry || null,
        annualEmissionsTco2e: data.annualEmissionsTco2e ?? null,
        wantedCredits: data.wantedCredits
      }
    });

    // 3. Update Clerk publicMetadata
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: 'BUYER',
          onboarded: true
        }
      });
    } catch (clerkErr) {
      console.warn('Warning: Failed to update Clerk publicMetadata directly:', clerkErr);
    }

    return {
      success: true,
      data: {
        profileId: buyerProfile.id,
        role: 'BUYER',
        profile: {
          ...buyerProfile,
          email: dbUser.email,
          name: dbUser.name,
          walletAddress: dbUser.walletAddress
        }
      }
    };
  } catch (error: any) {
    console.error('Error in registerBuyerAction:', error);
    return {
      success: false,
      error: error?.message || 'Failed to complete Credit Buyer registration'
    };
  }
}
