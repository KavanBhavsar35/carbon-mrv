import { auth } from '@clerk/nextjs/server';
import { Role } from '@/types/roles';

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Creates a server action that requires authentication and optionally specific roles.
 */
export function actionClient<TInput, TOutput>(
  handler: (input: TInput, userId: string, role?: Role) => Promise<TOutput>,
  allowedRoles?: Role[]
) {
  return async (input: TInput): Promise<ActionResponse<TOutput>> => {
    try {
      const { userId, sessionClaims } = await auth();

      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      const userRole = (sessionClaims as any)?.metadata?.role as Role | undefined;

      if (allowedRoles && allowedRoles.length > 0) {
        if (!userRole || !allowedRoles.includes(userRole)) {
          return { success: false, error: 'Forbidden: Insufficient role' };
        }
      }

      const result = await handler(input, userId, userRole);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Server action error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };
}
