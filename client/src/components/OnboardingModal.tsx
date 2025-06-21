import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Sparkles, Users, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content?: React.ReactNode;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: "welcome",
    title: "Welcome to Tapestry",
    description: "",
    icon: Sparkles,
    content: (
      <div className="w-full max-w-lg mx-auto">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
          <iframe
            src="https://www.loom.com/embed/1967fe02ab1f418c811c14dfee97339e"
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            frameBorder="0"
            allowFullScreen
            title="Welcome to Tapestry"
          />
        </div>
      </div>
    ),
  },
  {
    id: "directory",
    title: "Explore the Directory",
    description: "Browse through our curated collection of talented designers. Filter by skills, experience, and availability to find the perfect match.",
    icon: Users,
  },
  {
    id: "matchmaker",
    title: "AI-Powered Matching",
    description: "Describe your project needs and let our AI matchmaker recommend the best designers for your specific requirements.",
    icon: MessageSquare,
  },
  {
    id: "search",
    title: "Smart Search & Lists",
    description: "Create custom lists, save favorites, and use advanced search to organize and track your design talent pipeline.",
    icon: Search,
  },
];

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  const nextSlide = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skipOnboarding = () => {
    onOpenChange(false);
  };

  const completeOnboarding = async () => {
    if (onComplete) {
      await onComplete();
    } else {
      onOpenChange(false);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = onboardingSlides[currentSlide];
  const Icon = slide.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Onboarding</DialogTitle>
        </VisuallyHidden>
        
        {/* Main content */}
        <div className="relative min-h-[500px] flex flex-col">
          {/* Slide content */}
          <div className="flex-1 p-8 pt-8 text-center">
            <div className="max-w-md mx-auto space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Title and description */}
              <div className="space-y-3">
                <h2 className="text-2xl font-bold">{slide.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {slide.description}
                </p>
              </div>

              {/* Custom content */}
              {slide.content && (
                <div className="mt-6">
                  {slide.content}
                </div>
              )}
            </div>
          </div>

          {/* Progress dots - at bottom of content area */}
          <div className="flex justify-center space-x-2 pb-6">
            {onboardingSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentSlide
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons with border-top */}
          <div className="border-t border-border px-6 py-4 flex justify-between items-center">
            {/* Back button - floating left */}
            {currentSlide > 0 ? (
              <Button
                variant="outline"
                onClick={prevSlide}
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <div></div> // Empty div to maintain spacing
            )}

            {/* Next/Get Started button - floating right */}
            {currentSlide < onboardingSlides.length - 1 ? (
              <Button onClick={nextSlide} size="sm">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={completeOnboarding} size="sm">
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}