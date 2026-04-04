import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  Briefcase,
  Upload,
  FileText,
  Link2,
  Check,
  ArrowRight,
  Key,
  Copy,
  Terminal,
  Users,
  Sparkles,
  Bot,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Step = "welcome" | "about" | "workspace" | "ai-setup" | "import" | "done";

const STEP_ORDER: Step[] = ["welcome", "about", "workspace", "ai-setup", "import", "done"];

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

const variants = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("welcome");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const currentIndex = STEP_ORDER.indexOf(step);

  const { data: workspaces } = useQuery<Array<{ slug: string; name: string }>>({
    queryKey: ["/api/workspaces"],
  });
  const workspaceSlug = workspaces?.[0]?.slug;

  useEffect(() => {
    if (workspaces?.[0]?.name && !workspaceName) {
      setWorkspaceName(workspaces[0].name);
    }
  }, [workspaces]);

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

  const createTokenMutation = useMutation({
    mutationFn: async () => {
      const data = await apiRequest(`/api/workspaces/${workspaceSlug}/api-tokens`, {
        method: "POST",
        body: { name: "Claude Desktop" },
      });
      return data as { token: string };
    },
    onSuccess: (data) => {
      setGeneratedToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceSlug, "api-tokens"] });
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
    if (step === "workspace") {
      await saveProfileMutation.mutateAsync();
    }
    const next = STEP_ORDER[currentIndex + 1];
    if (next) setStep(next);
  };

  const goPrev = () => {
    const prev = STEP_ORDER[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const handleCopyToken = async () => {
    if (generatedToken) {
      await navigator.clipboard.writeText(generatedToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        tapestry: {
          command: "npx",
          args: ["-y", "mcp-remote", `${window.location.origin}/mcp`],
        },
      },
    },
    null,
    2
  );

  const handleCopyConfig = async () => {
    await navigator.clipboard.writeText(mcpConfig);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const canContinue = () => {
    if (step === "about") return !!role && !!useCase;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Tapestry</span>
        </div>

        {/* Step pills */}
        <div className="hidden sm:flex items-center gap-1.5">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i < currentIndex
                  ? "bg-primary w-3"
                  : i === currentIndex
                  ? "bg-primary w-5"
                  : "bg-border w-3"
              )}
            />
          ))}
        </div>

        <span className="text-xs text-muted-foreground tabular-nums">
          {currentIndex + 1} / {STEP_ORDER.length}
        </span>
      </div>

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-10 sm:py-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
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
              {step === "ai-setup" && (
                <AiSetupStep
                  workspaceSlug={workspaceSlug}
                  generatedToken={generatedToken}
                  copiedToken={copiedToken}
                  copiedConfig={copiedConfig}
                  isCreating={createTokenMutation.isPending}
                  onGenerateToken={() => createTokenMutation.mutate()}
                  onCopyToken={handleCopyToken}
                  onCopyConfig={handleCopyConfig}
                  mcpConfig={mcpConfig}
                />
              )}
              {step === "import" && <ImportStep />}
              {step === "done" && <DoneStep />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex-none border-t border-border bg-background px-6 py-3.5 flex items-center justify-between">
        <div>
          {currentIndex > 0 && step !== "done" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step === "ai-setup" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("import")}
              className="text-muted-foreground text-xs"
            >
              Skip for now
            </Button>
          )}
          {step === "import" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("done")}
              className="text-muted-foreground text-xs"
            >
              Skip for now
            </Button>
          )}
          {step !== "done" && (
            <Button
              size="sm"
              onClick={goNext}
              disabled={
                !canContinue() || saveProfileMutation.isPending
              }
            >
              {saveProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          )}
          {step === "done" && (
            <Button
              size="sm"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  Open Tapestry
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Welcome ─────────────────────────────────────────────────────────────── */

function WelcomeStep() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Badge variant="secondary" className="text-xs font-medium">
          Getting started
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          Welcome to Tapestry
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Your intelligent design talent platform. We'll get you set up in a few steps.
        </p>
      </div>

      {/* Loom intro video */}
      <div
        className="w-full rounded-xl overflow-hidden border border-border bg-muted"
        style={{ paddingBottom: "56.25%", position: "relative" }}
      >
        <iframe
          src="https://www.loom.com/embed/1967fe02ab1f418c811c14dfee97339e"
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          title="Welcome to Tapestry"
        />
      </div>

      {/* Value props */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Designer directory", desc: "Browse & filter talent" },
          { icon: Bot, label: "AI matchmaking", desc: "Describe what you need" },
          { icon: Terminal, label: "Claude integration", desc: "Ask in plain language" },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="rounded-lg border border-border p-3 flex flex-col items-center text-center gap-2"
          >
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── About you ───────────────────────────────────────────────────────────── */

function AboutStep({
  role, setRole, company, setCompany, useCase, setUseCase,
}: {
  role: string; setRole: (v: string) => void;
  company: string; setCompany: (v: string) => void;
  useCase: string; setUseCase: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="secondary" className="text-xs font-medium">About you</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Tell us a bit about yourself</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This helps us tailor Tapestry to how you actually work.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2.5">
          <Label className="text-sm font-medium">What's your role?</Label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <ChoiceButton
                key={r}
                label={r}
                selected={role === r}
                onClick={() => setRole(r)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company" className="text-sm font-medium">
            Company <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className="text-sm font-medium">What are you mainly using Tapestry for?</Label>
          <div className="space-y-2">
            {USE_CASES.map((uc) => (
              <ChoiceButton
                key={uc}
                label={uc}
                selected={useCase === uc}
                onClick={() => setUseCase(uc)}
                fullWidth
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Workspace ───────────────────────────────────────────────────────────── */

function WorkspaceStep({
  workspaceName, setWorkspaceName,
}: {
  workspaceName: string; setWorkspaceName: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="secondary" className="text-xs font-medium">Workspace</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Set up your workspace</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your workspace holds all your designers, lists, and activity. Name it after your team or company.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workspaceName" className="text-sm font-medium">Workspace name</Label>
          <Input
            id="workspaceName"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="e.g. Acme Talent, Design Team…"
          />
          <p className="text-xs text-muted-foreground">You can change this anytime in settings.</p>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">What's included</p>
          <ul className="space-y-2">
            {[
              "Searchable designer directory",
              "Curated lists & talent pipelines",
              "AI-powered candidate matching",
              "Claude & MCP integration",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
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

/* ─── AI / Token Setup ────────────────────────────────────────────────────── */

function AiSetupStep({
  workspaceSlug,
  generatedToken,
  copiedToken,
  copiedConfig,
  isCreating,
  onGenerateToken,
  onCopyToken,
  onCopyConfig,
  mcpConfig,
}: {
  workspaceSlug?: string;
  generatedToken: string | null;
  copiedToken: boolean;
  copiedConfig: boolean;
  isCreating: boolean;
  onGenerateToken: () => void;
  onCopyToken: () => void;
  onCopyConfig: () => void;
  mcpConfig: string;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="secondary" className="text-xs font-medium">AI setup</Badge>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          Connect Tapestry to your AI assistant
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The most powerful way to use Tapestry is through Claude. Ask it to find designers, create lists, and send outreach — all in plain language.
        </p>
      </div>

      {/* Highlight box */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-2.5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Works with Claude Desktop & Claude.ai</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Once connected, you can ask Claude things like <em>"Find me senior product designers in NYC"</em> or <em>"Add Maria to my SF shortlist."</em>
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-5">
        {/* Step 1 — Generate token */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              1
            </span>
            <p className="text-sm font-medium">Generate a Tapestry Token</p>
          </div>

          {!generatedToken ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateToken}
              disabled={isCreating || !workspaceSlug}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Key className="h-3.5 w-3.5 mr-2" />
                  Generate token
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border border-border font-mono text-xs break-all">
                <Key className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{generatedToken}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyToken}
                className="w-full"
              >
                {copiedToken ? (
                  <><Check className="h-3.5 w-3.5 mr-2 text-green-600" />Copied!</>
                ) : (
                  <><Copy className="h-3.5 w-3.5 mr-2" />Copy token</>
                )}
              </Button>
              <p className="text-[11px] text-amber-600 flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                Save this token now — you won't be able to see it again.
              </p>
            </div>
          )}
        </div>

        {/* Step 2 — Add MCP config */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              2
            </span>
            <p className="text-sm font-medium">Add to your Claude Desktop config</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Open <code className="bg-muted px-1 py-0.5 rounded text-[11px]">~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or <code className="bg-muted px-1 py-0.5 rounded text-[11px]">%APPDATA%\Claude\claude_desktop_config.json</code> (Windows) and add:
          </p>
          <div className="relative">
            <pre className="bg-muted rounded-lg p-3.5 text-[11px] font-mono overflow-x-auto border border-border leading-relaxed">
              {mcpConfig}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-7 px-2 text-xs"
              onClick={onCopyConfig}
            >
              {copiedConfig ? (
                <><Check className="h-3 w-3 mr-1 text-green-600" />Copied</>
              ) : (
                <><Copy className="h-3 w-3 mr-1" />Copy</>
              )}
            </Button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              3
            </span>
            <p className="text-sm font-medium">Restart Claude and authenticate</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            After restarting Claude Desktop, use the <code className="bg-muted px-1 py-0.5 rounded text-[11px]">authenticate</code> tool and paste your token when prompted.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Import ──────────────────────────────────────────────────────────────── */

function ImportStep() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="secondary" className="text-xs font-medium">Add designers</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Bring your designers in</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Start with designers you already know or explore the Tapestry directory. You can always do this later.
        </p>
      </div>

      <div className="space-y-2.5">
        {[
          {
            icon: FileText,
            title: "Import a CSV",
            desc: "Upload a spreadsheet of designer profiles you already have.",
            tag: "Popular",
          },
          {
            icon: Link2,
            title: "Paste a LinkedIn URL",
            desc: "Add a designer by sharing their LinkedIn profile link.",
            tag: null,
          },
          {
            icon: Users,
            title: "Browse the directory",
            desc: "Discover designers already in Tapestry and add them to lists.",
            tag: null,
          },
        ].map(({ icon: Icon, title, desc, tag }) => (
          <div
            key={title}
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{title}</p>
                {tag && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {tag}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        You can import designers anytime from the directory or capture page.
      </p>
    </div>
  );
}

/* ─── Done ────────────────────────────────────────────────────────────────── */

function DoneStep() {
  return (
    <div className="space-y-8 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex justify-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-primary" />
        </div>
      </motion.div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">You're all set!</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your workspace is ready. Start exploring the directory, run an AI match, or ask Claude to help.
        </p>
      </div>

      <div className="space-y-2.5 text-left">
        {[
          { icon: Users, title: "Explore the directory", desc: "Browse thousands of designer profiles" },
          { icon: Sparkles, title: "Try AI matchmaking", desc: "Describe a role and get instant recommendations" },
          { icon: Bot, title: "Ask Claude", desc: "Use natural language to manage your talent pipeline" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
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

/* ─── Shared components ───────────────────────────────────────────────────── */

function ChoiceButton({
  label, selected, onClick, fullWidth = false,
}: {
  label: string; selected: boolean; onClick: () => void; fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2",
        fullWidth && "w-full",
        selected
          ? "border-primary bg-primary/5 text-foreground font-medium"
          : "border-border hover:border-primary/40 hover:bg-muted/50 text-foreground"
      )}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
          selected ? "border-primary bg-primary" : "border-muted-foreground/40"
        )}
      >
        {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
      </div>
      {label}
    </button>
  );
}
