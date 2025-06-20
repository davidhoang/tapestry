import { useState, useEffect } from "react";
import { useUser } from "../hooks/use-user";
import { useOnboarding } from "../hooks/use-onboarding";
import OnboardingModal from "./OnboardingModal";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export default function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user } = useUser();
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only show onboarding for authenticated users
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
      console.error('Failed to complete onboarding:', error);
      setShowOnboarding(false);
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      {children}
      <OnboardingModal 
        open={showOnboarding} 
        onOpenChange={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}