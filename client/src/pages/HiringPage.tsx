import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Briefcase,
  Users,
  Sparkles,
  FileText,
  Loader2,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import DesignerCard from "../components/DesignerCard";
import SlimDesignerCard from "../components/SlimDesignerCard";

interface Designer {
  id: number;
  userId: number | null;
  workspaceId: number;
  name: string;
  title: string;
  location: string | null;
  company: string | null;
  level: string;
  website: string | null;
  linkedIn: string | null;
  email: string | null;
  photoUrl: string | null;
  skills: string[];
  available: boolean | null;
  description: string | null;
  notes: string | null;
  createdAt: Date | null;
}

interface MatchRecommendation {
  designerId: number;
  matchScore: number;
  reasoning: string;
  matchedSkills: string[];
  concerns?: string;
  designer: Designer;
}

interface Job {
  id: number;
  userId: number;
  workspaceId: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface JobMatchResponse {
  analysis: string;
  recommendations: MatchRecommendation[];
  jobId: number;
}

export default function HiringPage() {
  const [location] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract workspace slug from URL path
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDescription, setNewJobDescription] = useState(
    `# Senior Product Designer

We're looking for a senior product designer with 5+ years of experience in B2B SaaS. 

## What you'll do
- Lead design for core product features
- Collaborate with engineering and product teams
- Conduct user research and usability testing
- Maintain and evolve our design system

## Requirements
- 5+ years in product design
- Experience with Figma and design systems
- Strong portfolio showing B2B SaaS work
- Experience with user research methodologies

## Nice to have
- Familiarity with React components
- Experience with design tokens
- Background in enterprise software`,
  );
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDesigners, setSelectedDesigners] = useState<Set<number>>(
    new Set(),
  );
  const [showCreateListDialog, setShowCreateListDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());

  // Fetch user's jobs
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/jobs", workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (workspaceSlug && workspaceSlug.length > 0) {
        headers["x-workspace-slug"] = workspaceSlug;
      }

      const response = await fetch("/api/jobs", {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
    enabled: !!user && !!workspaceSlug && workspaceSlug.length > 0,
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (workspaceSlug && workspaceSlug.length > 0) {
        headers["x-workspace-slug"] = workspaceSlug;
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ title, description }),
      });
      if (!response.ok) throw new Error("Failed to create job");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", workspaceSlug] });
      setShowCreateJobDialog(false);
      setNewJobTitle("");
      setNewJobDescription("");
      toast({ title: "Job created successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to create job",
        variant: "destructive",
      });
    },
  });

  // Find matches mutation
  const findMatchesMutation = useMutation({
    mutationFn: async (jobId: number): Promise<JobMatchResponse> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (workspaceSlug && workspaceSlug.length > 0) {
        headers["x-workspace-slug"] = workspaceSlug;
      }

      const response = await fetch("/api/jobs/matches", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });
      if (!response.ok) throw new Error("Failed to find matches");
      return response.json();
    },
    onSuccess: (data) => {
      setMatches(data.recommendations || []);
      setAnalysis(data.analysis || "");
      toast({
        title: `Found ${data.recommendations?.length || 0} designer matches`,
        description: data.recommendations?.length
          ? "Check the matches below"
          : "Try adjusting your job description",
      });
    },
    onError: () => {
      toast({
        title: "Failed to find matches",
        description: "Please try again or check your connection",
        variant: "destructive",
      });
    },
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async ({
      name,
      designerIds,
    }: {
      name: string;
      designerIds: number[];
    }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (workspaceSlug && workspaceSlug.length > 0) {
        headers["x-workspace-slug"] = workspaceSlug;
      }

      const response = await fetch("/api/lists", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          name,
          summary: `Job candidates for ${selectedJob?.title || "position"}`,
          isPublic: false,
        }),
      });
      if (!response.ok) throw new Error("Failed to create list");
      const list = await response.json();

      // Add designers to the list
      for (const designerId of designerIds) {
        await fetch("/api/lists/designers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ listId: list.id, designerId }),
        });
      }

      return list;
    },
    onSuccess: () => {
      toast({ title: "List created successfully" });
      setShowCreateListDialog(false);
      setNewListName("");
      setSelectedDesigners(new Set());
    },
    onError: () => {
      toast({
        title: "Failed to create list",
        variant: "destructive",
      });
    },
  });

  const handleCreateJob = () => {
    if (!newJobTitle.trim() || !newJobDescription.trim()) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate({
      title: newJobTitle,
      description: newJobDescription,
    });
  };

  const handleFindMatches = (job: Job) => {
    setSelectedJob(job);
    setMatches([]);
    setAnalysis("");
    setSelectedDesigners(new Set());
    // Collapse the job description during analysis
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(job.id);
      return newSet;
    });
    findMatchesMutation.mutate(job.id);
  };

  const toggleJobExpansion = (jobId: number) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleToggleDesigner = (designerId: number) => {
    const newSelected = new Set(selectedDesigners);
    if (newSelected.has(designerId)) {
      newSelected.delete(designerId);
    } else {
      newSelected.add(designerId);
    }
    setSelectedDesigners(newSelected);
  };

  const handleCreateList = () => {
    if (!newListName.trim()) {
      toast({
        title: "Please enter a list name",
        variant: "destructive",
      });
      return;
    }
    createListMutation.mutate({
      name: newListName,
      designerIds: Array.from(selectedDesigners),
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to access hiring features</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 font-serif">Hiring</h1>
          <p className="text-muted-foreground font-serif">
            Create job descriptions and find matching designers from your
            directory
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = `/${workspaceSlug}/feedback-analytics`}
            className="gap-2"
          >
            <Star className="h-4 w-4" />
            RLHF Analytics
          </Button>
          <Button onClick={() => setShowCreateJobDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create job
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Jobs List */}
        <div className="lg:col-span-1">

          {/* Jobs List */}
          <div className="space-y-3">
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No jobs created yet</p>
                  <p className="text-sm text-muted-foreground/80 mt-2">
                    Click "Create job" above to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job: Job) => (
                <Card
                  key={job.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedJob?.id === job.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold font-serif">{job.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description.split("\n")[0].replace(/^#+\s*/, "")}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Job Details & Matches */}
        <div className="lg:col-span-2">
          {selectedJob ? (
            <div className="space-y-6">
              {/* Job Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif">
                      {selectedJob.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleFindMatches(selectedJob)}
                        disabled={isAnalyzing || findMatchesMutation.isPending}
                        size="sm"
                        className="gap-2"
                      >
                        {isAnalyzing || findMatchesMutation.isPending ? (
                          <>
                            <Sparkles className="h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            Find Matches
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleJobExpansion(selectedJob.id)}
                        className="h-8 w-8 p-0"
                      >
                        {expandedJobs.has(selectedJob.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedJobs.has(selectedJob.id) && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <MDEditor.Markdown
                        source={selectedJob.description}
                        style={{ whiteSpace: "pre-wrap" }}
                      />
                    </div>
                  </CardContent>
                )}

              </Card>

              {/* Analysis & Matches */}
              {(analysis || matches.length > 0) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 font-serif">
                        <Users className="h-5 w-5" />
                        Designer Matches ({matches.length})
                      </CardTitle>
                      {matches.length > 0 && selectedDesigners.size > 0 && (
                        <Button
                          onClick={() => setShowCreateListDialog(true)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create List ({selectedDesigners.size})
                        </Button>
                      )}
                    </div>
                    {analysis && (
                      <p className="text-sm text-muted-foreground">
                        {analysis}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {matches.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No matches found. Try adjusting your job description
                          or add more designers to your directory.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {matches.map((match) => (
                          <SlimDesignerCard
                            key={match.designerId}
                            match={match}
                            isSelected={selectedDesigners.has(match.designerId)}
                            onSelectionChange={() =>
                              handleToggleDesigner(match.designerId)
                            }
                            showSelection={true}
                            jobId={selectedJob?.id}
                            showFeedback={true}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 font-serif">
                  Select a Job
                </h3>
                <p className="text-muted-foreground">
                  Choose a job from the list to view details and find matching
                  designers
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Analyzing Dialog */}
      <Dialog open={findMatchesMutation.isPending} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          aria-describedby="analyzing-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Finding Designer Matches
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                  <div className="absolute -top-1 -right-1">
                    <div className="h-3 w-3 bg-primary rounded-full animate-ping"></div>
                  </div>
                </div>
              </div>
              <p id="analyzing-description" className="text-muted-foreground">
                Using AI to analyze your job requirements and match them with
                designers in your directory...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create List Dialog */}
      <Dialog
        open={showCreateListDialog}
        onOpenChange={setShowCreateListDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              Create List from Matches
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder={`Candidates for ${selectedJob?.title || "position"}`}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedDesigners.size} designer
              {selectedDesigners.size !== 1 ? "s" : ""} selected
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateListDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateList}
                disabled={createListMutation.isPending || !newListName.trim()}
              >
                {createListMutation.isPending ? "Creating..." : "Create List"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Job Modal */}
      <Dialog open={showCreateJobDialog} onOpenChange={setShowCreateJobDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Create New Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="e.g. Senior Product Designer"
              />
            </div>
            <div>
              <Label htmlFor="jobDescription">Job Description</Label>
              <div className="mt-2">
                <MDEditor
                  value={newJobDescription}
                  onChange={(value) => setNewJobDescription(value || "")}
                  height={400}
                  data-color-mode="light"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateJobDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateJob}
                disabled={createJobMutation.isPending}
              >
                {createJobMutation.isPending ? "Creating..." : "Create job"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
