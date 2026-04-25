import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface OnboardingSettings {
  debugMode: boolean;
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  debugMode: boolean;
}

async function fetchOnboardingState(): Promise<OnboardingState> {
  const response = await fetch('/api/onboarding/state', {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function updateOnboardingSettings(settings: OnboardingSettings): Promise<void> {
  const response = await fetch('/api/onboarding/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }
}

async function completeOnboarding(): Promise<void> {
  const response = await fetch('/api/onboarding/complete', {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }
}

export function useOnboarding() {
  const queryClient = useQueryClient();

  const { data: onboardingState, isLoading } = useQuery<OnboardingState>({
    queryKey: ['onboarding'],
    queryFn: fetchOnboardingState,
    staleTime: 30 * 1000, // 30 seconds for admin debugging
    retry: false
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateOnboardingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const shouldShowOnboarding = () => {
    if (!onboardingState) return false;
    
    // Always show if debug mode is on
    if (onboardingState.debugMode) return true;
    
    // Show if user hasn't completed onboarding
    return !onboardingState.hasCompletedOnboarding;
  };

  return {
    onboardingState,
    isLoading,
    shouldShowOnboarding: shouldShowOnboarding(),
    completeOnboarding: completeOnboardingMutation.mutateAsync,
    updateSettings: updateSettingsMutation.mutateAsync,
    isCompleting: completeOnboardingMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
}