import { auth } from '@clerk/nextjs/server';
import { Role, UserRoleData } from '@/types/roles';
import { redirect } from 'next/navigation';

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
