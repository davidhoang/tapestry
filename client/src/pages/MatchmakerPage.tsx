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
import { Loader2, Star, ExternalLink, Plus, Mail, User, MapPin } from "lucide-react";
import Navigation from "../components/Navigation";

export default function MatchmakerPage() {
  const [roleDescription, setRoleDescription] = useState("");
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [selectedDesigners, setSelectedDesigners] = useState<Set<number>>(new Set());
  const [showCreateList, setShowCreateList] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  
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
    <div className="min-h-screen">
      <Navigation />
      
      <div className={`flex transition-all duration-300 ${recommendations.length > 0 ? 'pr-96' : ''}`}>
        <div className="flex-1 container mx-auto px-4 pt-24 pb-8 max-w-4xl">
          <div className="text-center space-y-6 mb-8">
            <h1 className="text-4xl font-bold tracking-tight">AI Design Matchmaker</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Paste your role description and let AI find the perfect designer matches from your database
            </p>
          </div>

          <div className="relative">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <div className="relative">
                  <Textarea
                    id="role-description"
                    placeholder="We're looking for a senior product designer with 5+ years of experience in B2B SaaS. They should be skilled in user research, prototyping, and design systems. Experience with Figma and familiarity with React components is a plus..."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    rows={5}
                    className="w-full border-0 bg-transparent text-base leading-relaxed placeholder:text-gray-400 focus:ring-0 resize-none px-0 py-4"
                    style={{ 
                      boxShadow: 'none',
                      outline: 'none'
                    }}
                  />
                  
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-500">
                      {roleDescription.length > 0 && `${roleDescription.length} characters`}
                    </div>
                    
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
                        <>
                          <Star className="mr-2 h-4 w-4" />
                          Find matches
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {analysis && (
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Star className="h-5 w-5 text-primary" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-base">{analysis}</p>
              </CardContent>
            </Card>
          )}

          {recommendations.length === 0 && analysis && (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-lg">No suitable matches found for this role description.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your requirements or adding more designers to your database.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations Sidebar */}
        {recommendations.length > 0 && (
          <div className="fixed right-0 top-16 bottom-0 w-96 bg-background border-l border-border shadow-lg z-30 flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Results</p>
                  <h2 className="text-xl font-semibold">
                    {recommendations.length} Matches
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRecommendations([]);
                    setAnalysis("");
                    setSelectedDesigners(new Set());
                  }}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {recommendations.map((recommendation) => {
                  const { designer, matchScore, reasoning, matchedSkills, concerns } = recommendation;
                  const isSelected = selectedDesigners.has(designer.id);

                  return (
                    <Card key={designer.id} className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleDesignerSelection(designer.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{designer.name}</h3>
                              <Badge className={`${getMatchScoreColor(matchScore)} text-white text-xs`}>
                                {matchScore}%
                              </Badge>
                            </div>
                            {designer.title && (
                              <p className="text-xs text-muted-foreground truncate">{designer.title}</p>
                            )}
                            {designer.company && (
                              <p className="text-xs text-muted-foreground truncate">{designer.company}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 space-y-3">
                        <div>
                          <h4 className="font-medium text-green-600 text-xs mb-1">Match Reasoning:</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{reasoning}</p>
                        </div>

                        {matchedSkills && matchedSkills.length > 0 && (
                          <div>
                            <h4 className="font-medium text-xs mb-1">Key Skills:</h4>
                            <div className="flex flex-wrap gap-1">
                              {matchedSkills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs px-1 py-0">
                                  {skill}
                                </Badge>
                              ))}
                              {matchedSkills.length > 3 && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  +{matchedSkills.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {concerns && (
                          <div>
                            <h4 className="font-medium text-orange-600 text-xs mb-1">Considerations:</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{concerns}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex gap-1">
                            {designer.portfolioUrl && (
                              <Button variant="outline" size="sm" asChild className="h-7 w-7 p-0">
                                <a href={designer.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                            {designer.email && (
                              <Button variant="outline" size="sm" asChild className="h-7 w-7 p-0">
                                <a href={`mailto:${designer.email}`}>
                                  <Mail className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {designer.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-20">{designer.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Floating Create List Button */}
            {selectedDesigners.size > 0 && (
              <div className="p-6 border-t border-border bg-background">
                <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create List ({selectedDesigners.size})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Designer List</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="list-name">List Name</Label>
                        <Input
                          id="list-name"
                          value={listName}
                          onChange={(e) => setListName(e.target.value)}
                          placeholder="Senior Product Designer Candidates"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="list-description">Description (Optional)</Label>
                        <Textarea
                          id="list-description"
                          value={listDescription}
                          onChange={(e) => setListDescription(e.target.value)}
                          placeholder="Candidates for our B2B SaaS product designer role..."
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
                          disabled={createList.isPending}
                        >
                          {createList.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Create List
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}