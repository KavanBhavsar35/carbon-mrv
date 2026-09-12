import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getRegistrationStatusAction } from '@/features/onboarding/actions/onboarding-actions';

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    return redirect('/auth/sign-in');
  }

  const status = await getRegistrationStatusAction();
  if (!status.success || !status.data?.isOnboarded) {
    redirect('/dashboard/onboarding');
  } else {
    redirect('/dashboard/overview');
  }
}
