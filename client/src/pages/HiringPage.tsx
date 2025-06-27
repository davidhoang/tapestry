import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Briefcase, Users, Sparkles, FileText } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { MatchRecommendation } from "../hooks/use-matchmaker";
import DesignerCard from "../components/DesignerCard";

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
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showNewJobForm, setShowNewJobForm] = useState(false);
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
- Background in enterprise software`
  );
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch user's jobs
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const response = await fetch("/api/jobs", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
    enabled: !!user,
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description }),
      });
      if (!response.ok) throw new Error("Failed to create job");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setShowNewJobForm(false);
      setNewJobTitle("");
      setNewJobDescription("");
      toast({ title: "Job created successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to create job", 
        variant: "destructive" 
      });
    },
  });

  // Find matches mutation
  const findMatchesMutation = useMutation({
    mutationFn: async (jobId: number): Promise<JobMatchResponse> => {
      const response = await fetch("/api/jobs/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });
      if (!response.ok) throw new Error("Failed to find matches");
      return response.json();
    },
    onSuccess: (data) => {
      setMatches(data.recommendations);
      setAnalysis(data.analysis);
      toast({ title: "Found designer matches" });
    },
    onError: () => {
      toast({ 
        title: "Failed to find matches", 
        variant: "destructive" 
      });
    },
  });

  const handleCreateJob = () => {
    if (!newJobTitle.trim() || !newJobDescription.trim()) {
      toast({ 
        title: "Please fill in all fields", 
        variant: "destructive" 
      });
      return;
    }
    createJobMutation.mutate({ title: newJobTitle, description: newJobDescription });
  };

  const handleFindMatches = (job: Job) => {
    setSelectedJob(job);
    setIsAnalyzing(true);
    findMatchesMutation.mutate(job.id);
    setIsAnalyzing(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 font-serif">Hiring</h1>
        <p className="text-muted-foreground font-serif">
          Create job descriptions and find matching designers from your directory
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Jobs List */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold font-serif">Job Postings</h2>
            <Button 
              onClick={() => setShowNewJobForm(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Job
            </Button>
          </div>

          {/* New Job Form */}
          {showNewJobForm && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Create New Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      height={300}
                      data-color-mode="light"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateJob}
                    disabled={createJobMutation.isPending}
                    className="flex-1"
                  >
                    {createJobMutation.isPending ? "Creating..." : "Create Job"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewJobForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <p className="text-muted-foreground mb-4">No jobs created yet</p>
                  <Button onClick={() => setShowNewJobForm(true)} size="sm">
                    Create your first job
                  </Button>
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
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold font-serif">{job.title}</h3>
                      <Badge variant="outline">{job.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description.split('\n')[0].replace(/^#+\s*/, '')}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFindMatches(job);
                        }}
                        disabled={findMatchesMutation.isPending}
                        className="gap-2"
                      >
                        <Search className="h-3 w-3" />
                        Find Matches
                      </Button>
                    </div>
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
                    <CardTitle className="font-serif">{selectedJob.title}</CardTitle>
                    <Badge variant="outline">{selectedJob.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <MDEditor.Markdown 
                      source={selectedJob.description} 
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Created {new Date(selectedJob.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      onClick={() => handleFindMatches(selectedJob)}
                      disabled={isAnalyzing || findMatchesMutation.isPending}
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
                  </div>
                </CardContent>
              </Card>

              {/* Analysis & Matches */}
              {(analysis || matches.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <Users className="h-5 w-5" />
                      Designer Matches
                    </CardTitle>
                    {analysis && (
                      <p className="text-sm text-muted-foreground">{analysis}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {matches.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No matches found. Try adjusting your job description or add more designers to your directory.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {matches.map((match) => (
                          <div key={match.designerId} className="border rounded-lg p-4">
                            <DesignerCard designer={match.designer} />
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary">
                                  {match.matchScore}% match
                                </Badge>
                                <div className="flex gap-1">
                                  {match.matchedSkills.map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <strong>Why this match:</strong> {match.reasoning}
                              </p>
                              {match.concerns && (
                                <p className="text-sm text-orange-600">
                                  <strong>Considerations:</strong> {match.concerns}
                                </p>
                              )}
                            </div>
                          </div>
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
                <h3 className="text-lg font-semibold mb-2 font-serif">Select a Job</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a job from the list to view details and find matching designers
                </p>
                {jobs.length === 0 && (
                  <Button onClick={() => setShowNewJobForm(true)}>
                    Create Your First Job
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}