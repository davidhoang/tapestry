import { useState } from "react";
import { useMatchmaker, type MatchRecommendation } from "@/hooks/use-matchmaker";
import { useCreateList } from "@/hooks/use-lists";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Star, ExternalLink, Plus, Mail, User, MapPin, Shuffle } from "lucide-react";
import Navigation from "../components/Navigation";

export default function MatchmakerPage() {
  const [roleDescription, setRoleDescription] = useState("We're looking for a senior product designer with 5+ years of experience in B2B SaaS. They should be skilled in user research, prototyping, and design systems. Experience with Figma and familiarity with React components is a plus...");
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [selectedDesigners, setSelectedDesigners] = useState<Set<number>>(new Set());
  const [showCreateList, setShowCreateList] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  
  // Random background image selection
  const [backgroundImage] = useState(() => {
    const imageCount = 18; // We have img-cover-1.png through img-cover-18.png
    const randomNumber = Math.floor(Math.random() * imageCount) + 1;
    return `/images/card-covers/img-cover-${randomNumber}.png`;
  });

  // Random prompt examples
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [isPromptFocused, setIsPromptFocused] = useState(false);
  
  const samplePrompts = [
    "We're looking for a senior product designer with 5+ years of experience in B2B SaaS. They should be skilled in user research, prototyping, and design systems. Experience with Figma and familiarity with React components is a plus...",
    "Seeking a creative UI/UX designer for mobile app development. Must have experience with iOS and Android design patterns, animation, and user testing. Portfolio should showcase consumer-facing apps...",
    "Need a design systems expert to lead our component library. Should have experience with Storybook, Figma tokens, and working with engineering teams. 3+ years of design systems experience required...",
    "Looking for a brand designer with strong typography and visual identity skills. Experience with packaging design, marketing materials, and brand guidelines. Agency or in-house experience preferred...",
    "Seeking a freelance web designer for e-commerce projects. Must be proficient in Shopify, have conversion optimization experience, and understand accessibility standards. Remote work available..."
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze role",
        variant: "destructive",
      });
    }
  };

  const toggleDesignerSelection = (designerId: number) => {
    const newSelected = new Set(selectedDesigners);
    if (newSelected.has(designerId)) {
      newSelected.delete(designerId);
    } else {
      newSelected.add(designerId);
    }
    setSelectedDesigners(newSelected);
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
      const formData = new FormData();
      formData.append("name", listName);
      formData.append("description", listDescription);
      formData.append("designerIds", JSON.stringify(Array.from(selectedDesigners)));

      await createList.mutateAsync(formData);
      
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

  return (
    <div className="min-h-screen relative">
      {/* Background with random cover image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url('${backgroundImage}')`
        }}
      />
      
      <Navigation />
      
      <div className={`flex transition-all duration-300 relative z-10 ${recommendations.length > 0 ? 'pr-96' : ''}`}>
        <div className="flex-1 container mx-auto px-4 pt-24 pb-8 max-w-4xl">
          <div className="text-center space-y-6 mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">AI Design Matchmaker</h1>
            <p className="text-xl text-gray-200 leading-relaxed drop-shadow">
              Paste your role description and let AI find the perfect designer matches from your database
            </p>
          </div>

          <div className="relative">
            <div className={`bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border transition-all duration-300 overflow-hidden ${
              isPromptFocused 
                ? 'border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] transform -translate-y-1' 
                : 'border-white/20'
            }`}>
              <div className="p-8">
                <div className="relative">
                  <Textarea
                    id="role-description"
                    placeholder={samplePrompts[currentPrompt]}
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    onFocus={() => setIsPromptFocused(true)}
                    onBlur={() => setIsPromptFocused(false)}
                    rows={5}
                    className="w-full border-0 bg-transparent text-base leading-relaxed placeholder:text-gray-400 focus:ring-0 resize-none px-0 py-4"
                    style={{ 
                      boxShadow: 'none',
                      outline: 'none'
                    }}
                  />
                  
                  <div className="flex justify-between items-center mt-6">
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
                      className="px-8 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </div>

          {analysis && (
            <Card className="shadow-lg mt-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-base">{analysis}</p>
              </CardContent>
            </Card>
          )}

          {recommendations.length === 0 && analysis && (
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden p-6 mt-6">
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg">No matches found for this role description.</div>
                <div className="text-gray-400 text-sm mt-2">Try adjusting your requirements or adding more details.</div>
              </div>
            </div>
          )}
        </div>

        {recommendations.length > 0 && (
          <div className="fixed right-0 top-16 bottom-0 w-96 bg-white/95 backdrop-blur-sm border-l border-white/20 shadow-xl overflow-y-auto z-30">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recommended Designers</h2>
                {selectedDesigners.size > 0 && (
                  <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Create List ({selectedDesigners.size})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New List</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="list-name">List Name</Label>
                          <Input
                            id="list-name"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            placeholder="e.g., Senior Product Designers"
                          />
                        </div>
                        <div>
                          <Label htmlFor="list-description">Description (optional)</Label>
                          <Textarea
                            id="list-description"
                            value={listDescription}
                            onChange={(e) => setListDescription(e.target.value)}
                            placeholder="Brief description of this list..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowCreateList(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateList} disabled={!listName.trim() || createList.isPending}>
                            {createList.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create List"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.designer.id} className="bg-white rounded-xl border border-gray-200 p-4">
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
                            <h3 className="font-medium text-gray-900 truncate">{rec.designer.name}</h3>
                            {rec.designer.title && (
                              <p className="text-sm text-gray-600">{rec.designer.title}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <div className={`w-2 h-2 rounded-full ${getMatchScoreColor(rec.matchScore)}`} />
                            <span className="text-xs font-medium text-gray-700">{rec.matchScore}%</span>
                          </div>
                        </div>

                        {rec.designer.location && (
                          <div className="flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{rec.designer.location}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mb-3">
                          {rec.designer.skills?.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                              #{skill}
                            </Badge>
                          ))}
                          {rec.designer.skills && rec.designer.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              +{rec.designer.skills.length - 3}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">{rec.reasoning}</p>

                        <div className="flex gap-2">
                          {rec.designer.email && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                              <Mail className="h-3 w-3 mr-1" />
                              Contact
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <User className="h-3 w-3 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}