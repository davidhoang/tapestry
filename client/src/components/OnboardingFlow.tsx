import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Users,
  ChevronRight,
  ChevronLeft,
  Building2,
  Briefcase,
  Upload,
  FileText,
  Link,
  Check,
  ArrowRight,
} from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Step = "welcome" | "about" | "workspace" | "import" | "done";

const ROLES = [
  "Recruiter / Talent Acquisition",
  "Hiring Manager",
  "Design Lead / Manager",
  "Founder / Executive",
  "Operations",
  "Other",
];

const USE_CASES = [
  "Finding design talent for full-time roles",
  "Sourcing freelancers for projects",
  "Building a design talent pipeline",
  "Managing an existing roster of designers",
  "Other",
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i < current
              ? "bg-primary w-4"
              : i === current
              ? "bg-primary w-6"
              : "bg-muted w-4"
          )}
        />
      ))}
    </div>
  );
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("welcome");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const stepOrder: Step[] = ["welcome", "about", "workspace", "import", "done"];
  const currentIndex = stepOrder.indexOf(step);
  const totalSteps = stepOrder.length;

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, useCase, workspaceName }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      onComplete();
    },
  });

  const goNext = async () => {
    const next = stepOrder[currentIndex + 1];
    if (step === "workspace") {
      await saveProfileMutation.mutateAsync();
    }
    if (next) setStep(next);
  };

  const goPrev = () => {
    const prev = stepOrder[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const handleFinish = async () => {
    await completeMutation.mutateAsync();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Tapestry</span>
        </div>
        <StepIndicator current={currentIndex} total={totalSteps} />
        <div className="w-24 text-right text-xs text-muted-foreground">
          {currentIndex + 1} of {totalSteps}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-12">
          {step === "welcome" && <WelcomeStep />}
          {step === "about" && (
            <AboutStep
              role={role}
              setRole={setRole}
              company={company}
              setCompany={setCompany}
              useCase={useCase}
              setUseCase={setUseCase}
            />
          )}
          {step === "workspace" && (
            <WorkspaceStep
              workspaceName={workspaceName}
              setWorkspaceName={setWorkspaceName}
            />
          )}
          {step === "import" && <ImportStep />}
          {step === "done" && <DoneStep />}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border/50 px-6 py-4 flex items-center justify-between bg-background">
        <div>
          {currentIndex > 0 && step !== "done" && (
            <Button variant="ghost" size="sm" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {step === "import" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("done")}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
          )}
          {step !== "done" && (
            <Button
              onClick={step === "import" ? () => setStep("done") : goNext}
              disabled={
                saveProfileMutation.isPending ||
                (step === "about" && (!role || !useCase))
              }
              size="sm"
            >
              {saveProfileMutation.isPending ? (
                "Saving..."
              ) : step === "import" ? (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}
          {step === "done" && (
            <Button
              onClick={handleFinish}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? "Loading..." : "Go to Tapestry"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
          <Sparkles className="h-3.5 w-3.5" />
          Welcome to Tapestry
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Your intelligent design talent platform
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Tapestry helps you discover, track, and match design talent — powered by AI.
          Let's take a quick look at what you can do.
        </p>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src="https://www.loom.com/embed/1967fe02ab1f418c811c14dfee97339e"
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          title="Welcome to Tapestry"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Designer directory", desc: "Browse & filter talent" },
          { icon: Sparkles, label: "AI matchmaking", desc: "Describe what you need" },
          { icon: Briefcase, label: "Lists & pipeline", desc: "Organize & track" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-lg border border-border p-3 space-y-1.5 text-center">
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-xs font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutStep({
  role,
  setRole,
  company,
  setCompany,
  useCase,
  setUseCase,
}: {
  role: string;
  setRole: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  useCase: string;
  setUseCase: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
          <Briefcase className="h-3.5 w-3.5" />
          About you
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Tell us about yourself</h1>
        <p className="text-muted-foreground">
          This helps us tailor your experience from day one.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">What's your role?</Label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "text-left px-3 py-2.5 rounded-lg border text-sm transition-all",
                  role === r
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                {role === r && <Check className="h-3.5 w-3.5 inline mr-1.5" />}
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company" className="text-sm font-medium">
            Company or organization <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Inc."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">What are you primarily using Tapestry for?</Label>
          <div className="space-y-2">
            {USE_CASES.map((uc) => (
              <button
                key={uc}
                onClick={() => setUseCase(uc)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2",
                  useCase === uc
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                    useCase === uc ? "border-primary bg-primary" : "border-muted-foreground/40"
                  )}
                >
                  {useCase === uc && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </div>
                {uc}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceStep({
  workspaceName,
  setWorkspaceName,
}: {
  workspaceName: string;
  setWorkspaceName: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
          <Building2 className="h-3.5 w-3.5" />
          Your workspace
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Set up your workspace</h1>
        <p className="text-muted-foreground">
          Your workspace is where all your designers, lists, and activity live. Give it a name that represents your team or company.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workspaceName" className="text-sm font-medium">
            Workspace name
          </Label>
          <Input
            id="workspaceName"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="e.g. Acme Talent, My Studio, Design Team..."
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">
            You can always change this later in your workspace settings.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What's included</p>
          <ul className="space-y-2">
            {[
              "Designer directory and profiles",
              "Curated lists and pipelines",
              "AI-powered talent matching",
              "Team collaboration tools",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="h-2.5 w-2.5 text-primary" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ImportStep() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
          <Upload className="h-3.5 w-3.5" />
          Add your first designers
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Bring your designers in</h1>
        <p className="text-muted-foreground">
          Start with designers you already know, or explore Tapestry's directory. You can do this now or anytime later.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            icon: FileText,
            title: "Import a CSV",
            desc: "Upload a spreadsheet of designer profiles you already have.",
            badge: "Most popular",
            href: null,
          },
          {
            icon: Link,
            title: "Paste a LinkedIn URL",
            desc: "Add designers one at a time by sharing their LinkedIn profile.",
            badge: null,
            href: null,
          },
          {
            icon: Users,
            title: "Browse the directory",
            desc: "Discover designers already in Tapestry and add them to your lists.",
            badge: null,
            href: null,
          },
        ].map(({ icon: Icon, title, desc, badge }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{title}</p>
                {badge && (
                  <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 self-center" />
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        You can import designers at any time from the directory or capture page.
      </p>
    </div>
  );
}

function DoneStep() {
  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-10 w-10 text-primary" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">You're all set!</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Your workspace is ready. Start exploring the designer directory, run an AI match, or invite your team.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-left">
        {[
          { icon: Users, title: "Explore the directory", desc: "Browse thousands of designer profiles" },
          { icon: Sparkles, title: "Try AI matchmaking", desc: "Describe a role and get instant recommendations" },
          { icon: Briefcase, title: "Create a list", desc: "Organize designers into curated pipelines" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
