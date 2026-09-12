import PageContainer from '@/components/layout/page-container';
import { OnboardingWizard } from '@/features/onboarding';
import { getRegistrationStatusAction } from '@/features/onboarding/actions/onboarding-actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Generator Registration | Carbon MRV',
  description: 'Register and update your Carbon Generator profile.'
};

export default async function GeneratorOnboardingPage() {
  const statusRes = await getRegistrationStatusAction();
  const statusData = statusRes.success ? statusRes.data : undefined;

  return (
    <PageContainer>
      <OnboardingWizard
        initialRole='GENERATOR'
        initialProfile={statusData?.generatorProfile}
        isAlreadyOnboarded={!!statusData?.generatorProfile}
      />
    </PageContainer>
  );
}
