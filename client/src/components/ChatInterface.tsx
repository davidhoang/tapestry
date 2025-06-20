import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, User, Bot, ExternalLink, Mail, MapPin, Plus } from "lucide-react";
import { useSendMessage, type ConversationWithMessages } from "@/hooks/use-conversations";
import { useCreateList } from "@/hooks/use-lists";
import { useToast } from "@/hooks/use-toast";
import type { SelectDesigner } from "@db/schema";

interface ChatInterfaceProps {
  conversation: ConversationWithMessages;
  onRecommendationsChange?: (recommendations: any[]) => void;
}

export default function ChatInterface({ conversation, onRecommendationsChange }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [selectedDesigners, setSelectedDesigners] = useState<Set<number>>(new Set());
  const [showCreateList, setShowCreateList] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [currentRecommendations, setCurrentRecommendations] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();
  const createList = useCreateList();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  useEffect(() => {
    // Get the latest recommendations from the most recent assistant message
    const lastAssistantMessage = [...conversation.messages]
      .reverse()
      .find(msg => msg.role === "assistant" && msg.recommendations);
    
    if (lastAssistantMessage?.recommendations) {
      setCurrentRecommendations(lastAssistantMessage.recommendations);
      onRecommendationsChange?.(lastAssistantMessage.recommendations);
    } else {
      setCurrentRecommendations([]);
      onRecommendationsChange?.([]);
    }
  }, [conversation.messages, onRecommendationsChange]);

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessage.isPending) return;

    const messageContent = message;
    setMessage("");

    try {
      const response = await sendMessage.mutateAsync({
        conversationId: conversation.id,
        content: messageContent,
      });

      if (response.recommendations && response.recommendations.length > 0) {
        setCurrentRecommendations(response.recommendations);
        onRecommendationsChange?.(response.recommendations);
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
      handleSendMessage();
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
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.map((msg) => (
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
              
              {/* Indicator for recommendations - shows on all screen sizes */}
              {msg.role === "assistant" && msg.recommendations && (
                <div className="mt-3">
                  <div className="bg-muted/50 border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      ✨ {msg.recommendations.length} designer matches found - see recommendations section
                    </p>
                  </div>
                </div>
              )}
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
        
        <div ref={messagesEndRef} />
      </div>

      {/* Create List Dialog */}
      {selectedDesigners.size > 0 && (
        <div className="p-4 border-t bg-muted/30">
          <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create List from Selected ({selectedDesigners.size})
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="create-list-description">
              <DialogHeader>
                <DialogTitle>Create Designer List</DialogTitle>
              </DialogHeader>
              <div id="create-list-description" className="sr-only">
                Create a new list to organize selected designers from your matchmaker conversation.
              </div>
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

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe what kind of designer you're looking for..."
            rows={2}
            className="resize-none"
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessage.isPending}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}