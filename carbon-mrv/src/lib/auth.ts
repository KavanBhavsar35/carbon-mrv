import { auth, currentUser } from '@clerk/nextjs/server';
import { Role, UserRoleData } from '@/types/roles';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function requireRole(...roles: Role[]) {
  const { sessionClaims } = await auth();
  const userRole = (sessionClaims?.metadata as UserRoleData)?.role;

  if (!userRole || (roles.length > 0 && !roles.includes(userRole))) {
    redirect('/dashboard/overview');
  }

  return userRole;
}

export async function getCurrentUserRole(): Promise<Role | undefined> {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as UserRoleData)?.role;
}

/**
 * Ensures user is authenticated and synchronized with the local Prisma DB.
 * If user exists in Clerk but not in SQLite (common in local dev without webhooks),
 * it auto-syncs them from Clerk session/currentUser.
 */
export async function getAuthenticatedUser() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const sessionRole = (sessionClaims?.metadata as UserRoleData)?.role;

  let dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      generatorProfile: true,
      buyerProfile: true,
    },
  });

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.username ||
      'User';
    const role =
      sessionRole ||
      ((clerkUser.publicMetadata as any)?.role as string) ||
      'GENERATOR';

    dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email,
        name,
        role,
      },
      create: {
        clerkId: userId,
        email,
        name,
        role,
      },
      include: {
        generatorProfile: true,
        buyerProfile: true,
      },
    });
  } else if (sessionRole && sessionRole !== dbUser.role) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: sessionRole },
      include: {
        generatorProfile: true,
        buyerProfile: true,
      },
    });
  }

  return dbUser;
}
