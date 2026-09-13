import PageContainer from '@/components/layout/page-container';
import { OnboardingWizard } from '@/features/onboarding';
import { getRegistrationStatusAction } from '@/features/onboarding/actions/onboarding-actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding & Registration | VanaDhara',
  description: 'Complete your registration as a Carbon Generator or Credit Buyer.'
};

export default async function OnboardingPage() {
  const statusRes = await getRegistrationStatusAction();
  const statusData = statusRes.success ? statusRes.data : undefined;

  const initialRole =
    statusData?.role === 'GENERATOR' || statusData?.role === 'BUYER'
      ? (statusData.role as 'GENERATOR' | 'BUYER')
      : null;

  const initialProfile =
    initialRole === 'GENERATOR'
      ? statusData?.generatorProfile
      : initialRole === 'BUYER'
      ? statusData?.buyerProfile
      : null;

  return (
    <PageContainer>
      <OnboardingWizard
        initialRole={initialRole}
        initialProfile={initialProfile}
        isAlreadyOnboarded={statusData?.isOnboarded ?? false}
      />
    </PageContainer>
  );
}
