import { useState, useEffect } from "react";
import { useUser } from "../hooks/use-user";
import { useOnboarding } from "../hooks/use-onboarding";
import OnboardingFlow from "./OnboardingFlow";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export default function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user } = useUser();
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && shouldShowOnboarding) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user, shouldShowOnboarding]);

  const handleOnboardingComplete = async () => {
    try {
      await completeOnboarding();
      setShowOnboarding(false);
    } catch (error) {
      setShowOnboarding(false);
    }
  };

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}
