import { useState, useEffect } from "react";
import { useCreateConversation, useConversation, useSendMessage } from "@/hooks/use-conversations";
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
import { Loader2, Star, ExternalLink, Plus, Mail, User, MapPin, Bot, Send } from "lucide-react";
import Navigation from "../components/Navigation";
import type { SelectDesigner } from "@db/schema";

export default function MatchmakerPage() {
  const [roleDescription, setRoleDescription] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [currentRecommendations, setCurrentRecommendations] = useState<any[]>([]);
  const [selectedDesigners, setSelectedDesigners] = useState<Set<number>>(new Set());
  const [showCreateList, setShowCreateList] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  
  const createConversation = useCreateConversation();
  const conversation = useConversation(conversationId);
  const sendMessage = useSendMessage();
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
      // Create a new conversation
      const newConversation = await createConversation.mutateAsync("Designer Matching Session");
      setConversationId(newConversation.id);
      
      // Send the initial role description as the first message
      const response = await sendMessage.mutateAsync({
        conversationId: newConversation.id,
        content: roleDescription,
      });

      if (response.recommendations && response.recommendations.length > 0) {
        setCurrentRecommendations(response.recommendations);
      }

      setShowChat(true);
      setSelectedDesigners(new Set());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze role",
        variant: "destructive",
      });
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !conversationId || sendMessage.isPending) return;

    const messageContent = chatMessage;
    setChatMessage("");

    try {
      const response = await sendMessage.mutateAsync({
        conversationId,
        content: messageContent,
      });

      if (response.recommendations && response.recommendations.length > 0) {
        setCurrentRecommendations(response.recommendations);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  // Update recommendations when conversation changes
  useEffect(() => {
    if (conversation.data?.messages) {
      const lastAssistantMessage = [...conversation.data.messages]
        .reverse()
        .find(msg => msg.role === "assistant" && msg.recommendations);
      
      if (lastAssistantMessage?.recommendations) {
        setCurrentRecommendations(lastAssistantMessage.recommendations);
      }
    }
  }, [conversation.data]);

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
      
      <div className={`flex transition-all duration-300 ${currentRecommendations.length > 0 ? 'pr-96' : ''}`}>
        <div className="flex-1 flex flex-col">
          {!showChat ? (
            // Initial role description form
            <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
              <div className="text-center space-y-6 mb-8">
                <h1 className="text-4xl font-bold tracking-tight">AI Design Matchmaker</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Describe your role and I'll help you find the perfect designer matches through an interactive conversation
                </p>
              </div>

              <Card className="shadow-lg">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl">Role Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="role-description" className="text-base font-medium">
                      Describe the role, project, or ideal candidate
                    </Label>
                    <Textarea
                      id="role-description"
                      placeholder="We're looking for a senior product designer with 5+ years of experience in B2B SaaS. They should be skilled in user research, prototyping, and design systems. Experience with Figma and familiarity with React components is a plus..."
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      rows={6}
                      className="resize-none text-base leading-relaxed"
                    />
                  </div>
                  
                  <Button
                    onClick={handleAnalyze}
                    disabled={createConversation.isPending || sendMessage.isPending || !roleDescription.trim()}
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                  >
                    {createConversation.isPending || sendMessage.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting conversation...
                      </>
                    ) : (
                      "Start Matching Conversation"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Chat interface
            <div className="flex flex-col h-screen pt-16">
              <div className="p-4 border-b bg-muted/30">
                <h2 className="text-lg font-semibold">Designer Matching Conversation</h2>
                <p className="text-sm text-muted-foreground">Continue the conversation to refine your matches</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversation.data?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {sendMessage.isPending && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask follow-up questions or refine your requirements..."
                    rows={2}
                    className="resize-none"
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    onClick={handleSendChatMessage}
                    disabled={!chatMessage.trim() || sendMessage.isPending}
                    size="sm"
                    className="px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations Sidebar */}
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
                  onClick={() => {
                    setCurrentRecommendations([]);
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
  );
}