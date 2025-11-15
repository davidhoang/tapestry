import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnrichmentSuggestion {
  field: string;
  label: string;
  currentValue: string | null;
  suggestedValue: string | string[] | null;
  accepted: boolean;
}

interface EnrichmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designerId: number;
  currentData: {
    email?: string | null;
    phoneNumber?: string | null;
    location?: string | null;
    company?: string | null;
    title?: string | null;
    linkedIn?: string | null;
    website?: string | null;
    skills?: string[];
  };
  onSuccess: () => void;
}

export function EnrichmentModal({
  open,
  onOpenChange,
  designerId,
  currentData,
  onSuccess,
}: EnrichmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [likelihood, setLikelihood] = useState<number>(0);
  const [hasEnriched, setHasEnriched] = useState(false);
  const { toast } = useToast();

  const fetchEnrichment = async () => {
    setIsLoading(true);
    setHasEnriched(false);

    try {
      const response = await fetch(`/api/designers/${designerId}/enrich`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch enrichment data');
      }

      const data = await response.json();

      if (!data.success || !data.suggestions) {
        throw new Error('No enrichment data available');
      }

      const enrichmentSuggestions: EnrichmentSuggestion[] = [];

      if (data.suggestions.email && data.suggestions.email !== currentData.email) {
        enrichmentSuggestions.push({
          field: 'email',
          label: 'Email',
          currentValue: currentData.email || null,
          suggestedValue: data.suggestions.email,
          accepted: true,
        });
      }

      if (data.suggestions.phoneNumber && data.suggestions.phoneNumber !== currentData.phoneNumber) {
        enrichmentSuggestions.push({
          field: 'phoneNumber',
          label: 'Phone Number',
          currentValue: currentData.phoneNumber || null,
          suggestedValue: data.suggestions.phoneNumber,
          accepted: true,
        });
      }

      if (data.suggestions.location && data.suggestions.location !== currentData.location) {
        enrichmentSuggestions.push({
          field: 'location',
          label: 'Location',
          currentValue: currentData.location || null,
          suggestedValue: data.suggestions.location,
          accepted: true,
        });
      }

      if (data.suggestions.company && data.suggestions.company !== currentData.company) {
        enrichmentSuggestions.push({
          field: 'company',
          label: 'Company',
          currentValue: currentData.company || null,
          suggestedValue: data.suggestions.company,
          accepted: true,
        });
      }

      if (data.suggestions.title && data.suggestions.title !== currentData.title) {
        enrichmentSuggestions.push({
          field: 'title',
          label: 'Title',
          currentValue: currentData.title || null,
          suggestedValue: data.suggestions.title,
          accepted: true,
        });
      }

      if (data.suggestions.linkedin && data.suggestions.linkedin !== currentData.linkedIn) {
        enrichmentSuggestions.push({
          field: 'linkedin',
          label: 'LinkedIn',
          currentValue: currentData.linkedIn || null,
          suggestedValue: data.suggestions.linkedin,
          accepted: true,
        });
      }

      if (data.suggestions.website && data.suggestions.website !== currentData.website) {
        enrichmentSuggestions.push({
          field: 'website',
          label: 'Website',
          currentValue: currentData.website || null,
          suggestedValue: data.suggestions.website,
          accepted: true,
        });
      }

      if (data.suggestions.skills && Array.isArray(data.suggestions.skills)) {
        const currentSkills = currentData.skills || [];
        const newSkills = data.suggestions.skills.filter(
          (skill: string) => !currentSkills.includes(skill)
        );
        
        if (newSkills.length > 0) {
          enrichmentSuggestions.push({
            field: 'skills',
            label: 'Skills',
            currentValue: currentSkills.join(', ') || null,
            suggestedValue: newSkills,
            accepted: true,
          });
        }
      }

      setSuggestions(enrichmentSuggestions);
      setLikelihood(data.likelihood || 0);
      setHasEnriched(true);

      if (enrichmentSuggestions.length === 0) {
        toast({
          title: "No new information found",
          description: "The profile already has all available data from our enrichment service.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Enrichment failed",
        description: error.message || "Failed to fetch enrichment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    setSuggestions(prev =>
      prev.map((s, i) => (i === index ? { ...s, accepted: !s.accepted } : s))
    );
  };

  const applyEnrichment = async () => {
    const acceptedSuggestions = suggestions.filter(s => s.accepted);

    if (acceptedSuggestions.length === 0) {
      toast({
        title: "No changes to apply",
        description: "Please select at least one suggestion to apply.",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);

    try {
      const suggestionData: any = {};
      
      acceptedSuggestions.forEach(s => {
        suggestionData[s.field] = s.suggestedValue;
      });

      const response = await fetch(`/api/designers/${designerId}/apply-enrichment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ suggestions: suggestionData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply enrichment');
      }

      toast({
        title: "Profile enriched",
        description: `Successfully updated ${acceptedSuggestions.length} field${acceptedSuggestions.length > 1 ? 's' : ''}.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to apply changes",
        description: error.message || "An error occurred while updating the profile",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSuggestions([]);
      setHasEnriched(false);
      setLikelihood(0);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enrich Profile
          </DialogTitle>
          <DialogDescription>
            Review and accept suggested profile information from People Data Labs.
          </DialogDescription>
        </DialogHeader>

        {!hasEnriched ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-6">
              Click the button below to fetch enrichment data for this profile.
            </p>
            <Button onClick={fetchEnrichment} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching data...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Fetch Enrichment Data
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {likelihood > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={likelihood >= 0.8 ? "default" : likelihood >= 0.5 ? "secondary" : "outline"}>
                  {Math.round(likelihood * 100)}% confidence
                </Badge>
              </div>
            )}

            <ScrollArea className="max-h-[400px] pr-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>Profile is up to date!</p>
                  <p className="text-sm mt-2">No new information available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        suggestion.accepted ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={suggestion.accepted}
                          onCheckedChange={() => toggleSuggestion(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="font-medium">{suggestion.label}</div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex-1">
                              <div className="text-muted-foreground mb-1">Current:</div>
                              <div className="font-mono text-xs bg-background/50 p-2 rounded border">
                                {suggestion.currentValue || (
                                  <span className="text-muted-foreground italic">Empty</span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-muted-foreground mb-1">Suggested:</div>
                              <div className="font-mono text-xs bg-primary/10 p-2 rounded border border-primary/20">
                                {Array.isArray(suggestion.suggestedValue) 
                                  ? suggestion.suggestedValue.join(', ')
                                  : suggestion.suggestedValue
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {suggestions.length > 0 && (
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={applyEnrichment} disabled={isApplying || !suggestions.some(s => s.accepted)}>
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Apply Selected ({suggestions.filter(s => s.accepted).length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
