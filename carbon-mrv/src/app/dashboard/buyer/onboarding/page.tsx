import PageContainer from '@/components/layout/page-container';
import { OnboardingWizard } from '@/features/onboarding';
import { getRegistrationStatusAction } from '@/features/onboarding/actions/onboarding-actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buyer Registration | Carbon MRV',
  description: 'Register and update your Credit Buyer profile.'
};

export default async function BuyerOnboardingPage() {
  const statusRes = await getRegistrationStatusAction();
  const statusData = statusRes.success ? statusRes.data : undefined;

  return (
    <PageContainer>
      <OnboardingWizard
        initialRole='BUYER'
        initialProfile={statusData?.buyerProfile}
        isAlreadyOnboarded={!!statusData?.buyerProfile}
      />
    </PageContainer>
  );
}
