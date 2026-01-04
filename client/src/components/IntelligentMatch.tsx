import { useState } from "react";
import { useLocation } from "wouter";
import { useMatchmaker, type MatchRecommendation } from "@/hooks/use-matchmaker";
import { useCreateList } from "@/hooks/use-lists";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Mail,
  User,
  MapPin,
  Shuffle,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
} from "lucide-react";
import RecommendationFeedbackModal from "./RecommendationFeedbackModal";

export default function IntelligentMatch() {
  const [, navigate] = useLocation();
  const [roleDescription, setRoleDescription] = useState("");
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>(
    []
  );
  const [analysis, setAnalysis] = useState("");
  const [selectedDesigners, setSelectedDesigners] = useState<Set<number>>(
    new Set()
  );
  const [showCreateList, setShowCreateList] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedDesignerForFeedback, setSelectedDesignerForFeedback] =
    useState<any>(null);
  const [initialFeedbackType, setInitialFeedbackType] = useState<string | null>(
    null
  );
  const [showResults, setShowResults] = useState(false);

  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [isPromptFocused, setIsPromptFocused] = useState(false);

  const samplePrompts = [
    "We're looking for a senior product designer with 5+ years of experience in B2B SaaS. They should be skilled in user research, prototyping, and design systems. Experience with Figma and familiarity with React components is a plus...",
    "Seeking a creative UI/UX designer for mobile app development. Must have experience with iOS and Android design patterns, animation, and user testing. Portfolio should showcase consumer-facing apps...",
    "Need a design systems expert to lead our component library. Should have experience with Storybook, Figma tokens, and working with engineering teams. 3+ years of design systems experience required...",
    "Looking for a brand designer with strong typography and visual identity skills. Experience with packaging design, marketing materials, and brand guidelines. Agency or in-house experience preferred...",
    "Seeking a freelance web designer for e-commerce projects. Must be proficient in Shopify, have conversion optimization experience, and understand accessibility standards. Remote work available...",
  ];

  const randomizePrompt = () => {
    const nextPrompt = (currentPrompt + 1) % samplePrompts.length;
    setCurrentPrompt(nextPrompt);
    setRoleDescription(samplePrompts[nextPrompt]);
  };

  const matchmaker = useMatchmaker();
  const createList = useCreateList();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!roleDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a role description",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await matchmaker.mutateAsync(roleDescription);
      setRecommendations(result.recommendations);
      setAnalysis(result.analysis);
      setSelectedDesigners(new Set());
      setShowResults(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze role",
        variant: "destructive",
      });
    }
  };

  const handleCreateList = async () => {
    if (!listName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a list name",
        variant: "destructive",
      });
      return;
    }

    if (selectedDesigners.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one designer",
        variant: "destructive",
      });
      return;
    }

    try {
      await createList.mutateAsync({
        name: listName,
        description: listDescription,
        designerIds: Array.from(selectedDesigners),
      });

      toast({
        title: "Success",
        description: "List created successfully",
      });

      setShowCreateList(false);
      setListName("");
      setListDescription("");
      setSelectedDesigners(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-green-400";
    if (score >= 70) return "bg-yellow-400";
    return "bg-orange-400";
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setRecommendations([]);
    setAnalysis("");
    setSelectedDesigners(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Intelligent Match
        </h2>
        <p className="text-muted-foreground">
          Enter a description to find the best candidate match
        </p>
      </div>

      <div
        className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${
          isPromptFocused ? "border-primary/50 shadow-md" : "border-gray-200"
        }`}
      >
        <div className="p-6">
          <Textarea
            placeholder={samplePrompts[currentPrompt]}
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            onFocus={() => setIsPromptFocused(true)}
            onBlur={() => setIsPromptFocused(false)}
            rows={4}
            className="w-full border-0 bg-transparent text-base leading-relaxed placeholder:text-gray-400 focus:ring-0 resize-none px-0"
            style={{
              boxShadow: "none",
              outline: "none",
            }}
          />

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={randomizePrompt}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Try example
            </Button>

            <Button
              onClick={handleAnalyze}
              disabled={matchmaker.isPending || !roleDescription.trim()}
              className="px-6 py-2 rounded-full"
            >
              {matchmaker.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding matches...
                </>
              ) : (
                "Find matches"
              )}
            </Button>
          </div>
        </div>
      </div>

      {showResults && (analysis || recommendations.length > 0) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Match Results</h3>
              <div className="flex items-center gap-2">
                {selectedDesigners.size > 0 && (
                  <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Create list ({selectedDesigners.size})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create new list</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="list-name">List name</Label>
                          <Input
                            id="list-name"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            placeholder="e.g., Senior Product Designers"
                          />
                        </div>
                        <div>
                          <Label htmlFor="list-description">
                            Description (optional)
                          </Label>
                          <Textarea
                            id="list-description"
                            value={listDescription}
                            onChange={(e) => setListDescription(e.target.value)}
                            placeholder="Brief description of this list..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowCreateList(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateList}
                            disabled={
                              !listName.trim() || createList.isPending
                            }
                          >
                            {createList.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create list"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button variant="ghost" size="icon" onClick={handleCloseResults}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {analysis && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">AI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{analysis}</p>
                  </CardContent>
                </Card>
              )}

              {recommendations.length === 0 && analysis && (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    No matches found for this role description.
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Try adjusting your requirements or adding more details.
                  </div>
                </div>
              )}

              {recommendations.map((rec) => (
                <div
                  key={rec.designer.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedDesigners.has(rec.designer.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedDesigners);
                        if (checked) {
                          newSelected.add(rec.designer.id);
                        } else {
                          newSelected.delete(rec.designer.id);
                        }
                        setSelectedDesigners(newSelected);
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {rec.designer.name}
                          </h3>
                          {rec.designer.title && (
                            <p className="text-sm text-gray-600">
                              {rec.designer.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getMatchScoreColor(rec.matchScore)}`}
                          />
                          <span className="text-xs font-medium text-gray-700">
                            {rec.matchScore}%
                          </span>
                        </div>
                      </div>

                      {rec.designer.location && (
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {rec.designer.location}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(() => {
                          const skills: string[] = (() => {
                            if (Array.isArray(rec.designer.skills)) {
                              return rec.designer.skills;
                            }
                            if (
                              typeof rec.designer.skills === "string" &&
                              rec.designer.skills.trim()
                            ) {
                              try {
                                return JSON.parse(
                                  rec.designer.skills
                                ) as string[];
                              } catch {
                                return rec.designer.skills
                                  .split(",")
                                  .map((s: string) => s.trim())
                                  .filter((s: string) => s);
                              }
                            }
                            return [];
                          })();
                          return (
                            <>
                              {skills.slice(0, 3).map((skill: string, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5"
                                >
                                  #{skill}
                                </Badge>
                              ))}
                              {skills.length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5"
                                >
                                  +{skills.length - 3}
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                        {rec.reasoning}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {rec.designer.email && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Contact
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            <User className="h-3 w-3 mr-1" />
                            View profile
                          </Button>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDesignerForFeedback(rec);
                              setInitialFeedbackType("good_match");
                              setFeedbackModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                            title="Good match"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDesignerForFeedback(rec);
                              setInitialFeedbackType("irrelevant_experience");
                              setFeedbackModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                            title="Poor match"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedDesignerForFeedback && (
        <RecommendationFeedbackModal
          open={feedbackModalOpen}
          onOpenChange={(open) => {
            setFeedbackModalOpen(open);
            if (!open) {
              setSelectedDesignerForFeedback(null);
              setInitialFeedbackType(null);
            }
          }}
          designerId={selectedDesignerForFeedback.designer.id}
          designerName={selectedDesignerForFeedback.designer.name}
          matchScore={selectedDesignerForFeedback.matchScore}
          aiReasoning={selectedDesignerForFeedback.reasoning}
          initialFeedbackType={initialFeedbackType}
        />
      )}
    </div>
  );
}
