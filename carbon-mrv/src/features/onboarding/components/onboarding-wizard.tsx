'use client';

import * as React from 'react';
import { useState } from 'react';
import { RoleSelector, SelectedRole } from './role-selector';
import { GeneratorForm } from './generator-form';
import { BuyerForm } from './buyer-form';
import { RegistrationResult } from './registration-result';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface OnboardingWizardProps {
  initialRole?: SelectedRole | null;
  initialProfile?: Record<string, any> | null;
  isAlreadyOnboarded?: boolean;
}

export function OnboardingWizard({
  initialRole = null,
  initialProfile = null,
  isAlreadyOnboarded = false
}: OnboardingWizardProps) {
  const [step, setStep] = useState<'SELECT_ROLE' | 'FILL_FORM' | 'RESULT'>(
    isAlreadyOnboarded && initialProfile ? 'RESULT' : initialRole ? 'FILL_FORM' : 'SELECT_ROLE'
  );
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(initialRole);
  const [registrationResult, setRegistrationResult] = useState<{ role: string; profile: Record<string, any> } | null>(
    isAlreadyOnboarded && initialProfile && initialRole
      ? { role: initialRole, profile: initialProfile }
      : null
  );

  const handleRoleSelect = (role: SelectedRole) => {
    setSelectedRole(role);
  };

  const handleContinueToForm = () => {
    if (selectedRole) {
      setStep('FILL_FORM');
    }
  };

  const handleBackToRoleSelect = () => {
    setStep('SELECT_ROLE');
  };

  const handleFormSuccess = (result: { role: string; profile: any }) => {
    setRegistrationResult(result);
    setStep('RESULT');
  };

  return (
    <div className='w-full min-h-[calc(100vh-12rem)] flex flex-col justify-start py-6 px-2 sm:px-4'>
      {/* Step Indicator Header */}
      <div className='w-full max-w-xl mx-auto mb-8'>
        <div className='flex items-center justify-between relative'>
          <div className='absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-border -z-10' />
          <div
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 -z-10',
              step === 'SELECT_ROLE' ? 'w-0' : step === 'FILL_FORM' ? 'w-1/2' : 'w-full'
            )}
          />

          {/* Step 1 Circle */}
          <div className='flex flex-col items-center gap-1.5 bg-background px-2'>
            <div
              className={cn(
                'h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                step === 'SELECT_ROLE'
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-primary bg-primary/10 text-primary'
              )}
            >
              {step !== 'SELECT_ROLE' ? <Check className='h-4 w-4 stroke-[3]' /> : '1'}
            </div>
            <span className='text-[11px] font-medium text-muted-foreground'>Choose Role</span>
          </div>

          {/* Step 2 Circle */}
          <div className='flex flex-col items-center gap-1.5 bg-background px-2'>
            <div
              className={cn(
                'h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                step === 'FILL_FORM'
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : step === 'RESULT'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {step === 'RESULT' ? <Check className='h-4 w-4 stroke-[3]' /> : '2'}
            </div>
            <span className='text-[11px] font-medium text-muted-foreground'>Profile Details</span>
          </div>

          {/* Step 3 Circle */}
          <div className='flex flex-col items-center gap-1.5 bg-background px-2'>
            <div
              className={cn(
                'h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                step === 'RESULT'
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              3
            </div>
            <span className='text-[11px] font-medium text-muted-foreground'>Activated</span>
          </div>
        </div>
      </div>

      {/* Step Views */}
      {step === 'SELECT_ROLE' && (
        <RoleSelector
          selectedRole={selectedRole}
          onSelectRole={handleRoleSelect}
          onContinue={handleContinueToForm}
        />
      )}

      {step === 'FILL_FORM' && selectedRole === 'GENERATOR' && (
        <GeneratorForm
          initialData={initialProfile || undefined}
          onBack={handleBackToRoleSelect}
          onSuccess={handleFormSuccess}
        />
      )}

      {step === 'FILL_FORM' && selectedRole === 'BUYER' && (
        <BuyerForm
          initialData={initialProfile || undefined}
          onBack={handleBackToRoleSelect}
          onSuccess={handleFormSuccess}
        />
      )}

      {step === 'RESULT' && registrationResult && (
        <RegistrationResult
          role={registrationResult.role}
          profile={registrationResult.profile}
          onReset={() => setStep('SELECT_ROLE')}
        />
      )}
    </div>
  );
}
