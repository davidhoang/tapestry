import { useState } from "react";
import { useMatchmaker, type MatchRecommendation } from "@/hooks/use-matchmaker";
import { useCreateList } from "@/hooks/use-lists";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Brain, Star, ExternalLink, Plus, Mail, User, MapPin, DollarSign, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Design Matchmaker</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Paste your role description and let AI find the perfect designer matches from your database
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Role Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-description">Describe the role, project, or ideal candidate</Label>
              <Textarea
                id="role-description"
                placeholder="We're looking for a senior product designer with 5+ years of experience in B2B SaaS. They should be skilled in user research, prototyping, and design systems. Experience with Figma and familiarity with React components is a plus..."
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            
            <Button
              onClick={handleAnalyze}
              disabled={matchmaker.isPending || !roleDescription.trim()}
              className="w-full"
              size="lg"
            >
              {matchmaker.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Find Matches
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {analysis && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{analysis}</p>
            </CardContent>
          </Card>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Recommended Matches ({recommendations.length})
              </h2>
              
              {selectedDesigners.size > 0 && (
                <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                  <DialogTrigger asChild>
                    <Button>
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
              )}
            </div>

            <div className="grid gap-6">
              {recommendations.map((recommendation) => {
                const { designer, matchScore, reasoning, matchedSkills, concerns } = recommendation;
                const isSelected = selectedDesigners.has(designer.id);

                return (
                  <Card key={designer.id} className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleDesignerSelection(designer.id)}
                          />
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={designer.photoUrl || ""} alt={designer.name} />
                            <AvatarFallback>
                              <User className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-semibold">{designer.name}</h3>
                              <Badge className={`${getMatchScoreColor(matchScore)} text-white`}>
                                {matchScore}% Match
                              </Badge>
                            </div>
                            {designer.title && (
                              <p className="text-muted-foreground">{designer.title}</p>
                            )}
                            {designer.company && (
                              <p className="text-sm text-muted-foreground">{designer.company}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {designer.portfolioUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={designer.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {designer.email && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`mailto:${designer.email}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {designer.bio && (
                        <p className="text-muted-foreground leading-relaxed">{designer.bio}</p>
                      )}

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-green-600 mb-2">Why this is a great match:</h4>
                          <p className="text-sm text-muted-foreground">{reasoning}</p>
                        </div>

                        {matchedSkills.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Matched Skills:</h4>
                            <div className="flex flex-wrap gap-2">
                              {matchedSkills.map((skill) => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {concerns && (
                          <div>
                            <h4 className="font-medium text-orange-600 mb-2">Considerations:</h4>
                            <p className="text-sm text-muted-foreground">{concerns}</p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {designer.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{designer.location}</span>
                          </div>
                        )}
                        {designer.rate && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>{designer.rate}</span>
                          </div>
                        )}
                        {designer.availability && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{designer.availability}</span>
                          </div>
                        )}
                        {designer.experience && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span>{designer.experience}</span>
                          </div>
                        )}
                      </div>

                      {designer.skills && designer.skills.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">All Skills:</h4>
                          <div className="flex flex-wrap gap-1">
                            {designer.skills.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {recommendations.length === 0 && analysis && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No suitable matches found for this role description.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}