import { useState, useEffect } from "react";
import { useCreateConversation, useConversation } from "@/hooks/use-conversations";
import { useCreateList } from "@/hooks/use-lists";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Plus, ExternalLink, Mail, MapPin } from "lucide-react";
import Navigation from "../components/Navigation";
import ChatInterface from "../components/ChatInterface";
import type { SelectDesigner } from "@db/schema";

export default function MatchmakerChatPage() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [currentRecommendations, setCurrentRecommendations] = useState<any[]>([]);
  const [selectedDesigners, setSelectedDesigners] = useState<Set<number>>(new Set());
  const [showCreateList, setShowCreateList] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  
  const createConversation = useCreateConversation();
  const conversation = useConversation(conversationId);
  const createList = useCreateList();
  const { toast } = useToast();

  const handleStartConversation = async () => {
    try {
      const newConversation = await createConversation.mutateAsync("Designer Matching Session");
      setConversationId(newConversation.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
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

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
          <div className="text-center space-y-6 mb-8">
            <h1 className="text-4xl font-bold tracking-tight">AI Design Matchmaker</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have a conversation with AI to find the perfect designer matches from your database
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Start New Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">
                Start a conversation with our AI recruiter to find designers that match your specific needs. 
                The AI will ask follow-up questions to better understand your requirements and provide 
                tailored recommendations.
              </p>
              
              <Button
                onClick={handleStartConversation}
                disabled={createConversation.isPending}
                size="lg"
                className="w-full max-w-md"
              >
                {createConversation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting conversation...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Conversation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!conversation.data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Desktop Layout - Only show on screens wider than 768px */}
      <div className={`hidden min-[769px]:flex transition-all duration-300 ${currentRecommendations.length > 0 ? 'pr-96' : ''}`}>
        <div className="flex-1 flex flex-col h-screen pt-16">
          <div className="flex-1">
            <ChatInterface 
              conversation={conversation.data}
              onRecommendationsChange={setCurrentRecommendations}
            />
          </div>
        </div>

        {/* Desktop Recommendations Sidebar */}
        {currentRecommendations.length > 0 && (
          <div className="fixed right-0 top-16 bottom-0 w-96 bg-background border-l border-border shadow-lg z-30 flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Results</p>
                  <h2 className="text-xl font-semibold">
                    {currentRecommendations.length} Matches
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentRecommendations([])}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {currentRecommendations.map((recommendation) => {
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

                        {matchedSkills.length > 0 && (
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
                          placeholder="Candidates from AI matchmaker conversation..."
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

      {/* Mobile Layout - Only show on screens 768px and smaller */}
      <div className="max-[768px]:block hidden">
        <div className="flex flex-col h-screen pt-16">
          {/* Chat Interface */}
          <div className="flex-1">
            <ChatInterface 
              conversation={conversation.data}
              onRecommendationsChange={setCurrentRecommendations}
            />
          </div>

          {/* Mobile Recommendations Section */}
          {currentRecommendations.length > 0 && (
            <div className="bg-background border-t border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Results</p>
                    <h2 className="text-lg font-semibold">
                      {currentRecommendations.length} Matches
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentRecommendations([])}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto p-4">
                <div className="space-y-3">
                  {currentRecommendations.map((recommendation) => {
                    const { designer, matchScore, reasoning, matchedSkills, concerns } = recommendation;
                    const isSelected = selectedDesigners.has(designer.id);

                    return (
                      <Card key={designer.id} className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-3">
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
                              
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{reasoning}</p>
                              </div>

                              {matchedSkills.length > 0 && (
                                <div className="mt-2">
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

                              <div className="flex justify-between items-center mt-2">
                                <div className="flex gap-1">
                                  {designer.portfolioUrl && (
                                    <Button variant="outline" size="sm" asChild className="h-6 w-6 p-0">
                                      <a href={designer.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  )}
                                  {designer.email && (
                                    <Button variant="outline" size="sm" asChild className="h-6 w-6 p-0">
                                      <a href={`mailto:${designer.email}`}>
                                        <Mail className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                                
                                {designer.location && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-20">{designer.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Create List Button */}
              {selectedDesigners.size > 0 && (
                <div className="p-4 border-t border-border bg-background">
                  <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="sm">
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
                          <Label htmlFor="mobile-list-name">List Name</Label>
                          <Input
                            id="mobile-list-name"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            placeholder="Senior Product Designer Candidates"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobile-list-description">Description (Optional)</Label>
                          <Textarea
                            id="mobile-list-description"
                            value={listDescription}
                            onChange={(e) => setListDescription(e.target.value)}
                            placeholder="Candidates from AI matchmaker conversation..."
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
    </div>
  );
}