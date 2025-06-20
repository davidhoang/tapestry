import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, ExternalLink, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEnrichDesigner, useEnrichNewDesigner, useApplyEnrichment, type DesignerEnrichmentData, type EnrichmentResult } from "@/hooks/use-enrichment";
import type { SelectDesigner } from "@db/schema";

interface EnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designer?: SelectDesigner | null;
  onSuccess?: (designer: SelectDesigner) => void;
}

export default function EnrichmentDialog({ 
  open, 
  onOpenChange, 
  designer, 
  onSuccess 
}: EnrichmentDialogProps) {
  const [newDesignerName, setNewDesignerName] = useState("");
  const [enrichmentResult, setEnrichmentResult] = useState<EnrichmentResult | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const enrichExisting = useEnrichDesigner();
  const enrichNew = useEnrichNewDesigner();
  const applyEnrichment = useApplyEnrichment();
  const { toast } = useToast();

  const isNewDesigner = !designer;
  const isEnriching = enrichExisting.isPending || enrichNew.isPending;

  const handleEnrich = async () => {
    try {
      let result: EnrichmentResult;
      
      if (isNewDesigner) {
        if (!newDesignerName.trim()) {
          toast({
            title: "Error",
            description: "Please enter a designer name",
            variant: "destructive",
          });
          return;
        }
        result = await enrichNew.mutateAsync(newDesignerName.trim());
      } else {
        result = await enrichExisting.mutateAsync(designer!.id);
      }

      setEnrichmentResult(result);
      
      if (result.success && result.data) {
        // Pre-select fields that have new or different data
        const fieldsToSelect = new Set<string>();
        Object.entries(result.data).forEach(([key, value]) => {
          if (value && key !== 'name') {
            if (isNewDesigner || !designer || (designer as any)[key] !== value) {
              fieldsToSelect.add(key);
            }
          }
        });
        setSelectedFields(fieldsToSelect);
      }

      if (!result.success) {
        toast({
          title: "Enrichment Failed",
          description: result.error || "Could not find additional information",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enrich profile",
        variant: "destructive",
      });
    }
  };

  const handleApply = async () => {
    if (!enrichmentResult?.data) return;

    setIsApplying(true);
    try {
      // Create selected data object
      const selectedData: Partial<DesignerEnrichmentData> = {};
      selectedFields.forEach(field => {
        if (enrichmentResult.data && field in enrichmentResult.data) {
          (selectedData as any)[field] = (enrichmentResult.data as any)[field];
        }
      });

      if (isNewDesigner) {
        // For new designers, redirect to create page with pre-filled data
        const params = new URLSearchParams();
        Object.entries(selectedData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              params.set(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              params.set(key, JSON.stringify(value));
            } else {
              params.set(key, String(value));
            }
          }
        });
        
        window.location.href = `/directory?create=true&${params.toString()}`;
      } else {
        // Apply to existing designer
        const updatedDesigner = await applyEnrichment.mutateAsync({
          designerId: designer!.id,
          enrichmentData: selectedData as DesignerEnrichmentData
        });

        toast({
          title: "Success",
          description: "Profile enrichment applied successfully",
        });

        onSuccess?.(updatedDesigner);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply enrichment",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleFieldToggle = (field: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const handleClose = () => {
    setEnrichmentResult(null);
    setSelectedFields(new Set());
    setNewDesignerName("");
    onOpenChange(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertCircle;
    return Info;
  };

  const renderField = (key: string, value: any, label: string) => {
    if (!value) return null;

    const isSelected = selectedFields.has(key);
    const hasExistingValue = !isNewDesigner && designer && (designer as any)[key];
    const isNew = !hasExistingValue;
    const isDifferent = hasExistingValue && (designer as any)[key] !== value;

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={key}
            checked={isSelected}
            onCheckedChange={() => handleFieldToggle(key)}
          />
          <Label htmlFor={key} className="font-medium">
            {label}
            {isNew && <Badge variant="secondary" className="ml-2 text-xs">New</Badge>}
            {isDifferent && <Badge variant="outline" className="ml-2 text-xs">Updated</Badge>}
          </Label>
        </div>
        
        {Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1 ml-6">
            {value.map((item, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        ) : typeof value === 'object' ? (
          <div className="ml-6 space-y-1">
            {Object.entries(value).map(([subKey, subValue]) => (
              subValue && (
                <div key={subKey} className="flex items-center gap-2 text-sm">
                  <span className="capitalize font-medium">{subKey}:</span>
                  <a 
                    href={String(subValue)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {String(subValue)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="ml-6 text-sm text-muted-foreground">
            {String(value)}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isNewDesigner ? "Enrich New Designer Profile" : "Enrich Designer Profile"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!enrichmentResult && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isNewDesigner ? "Find Designer Information" : "Enhance Profile Data"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isNewDesigner 
                    ? "Enter a designer's name and I'll search for their professional information online."
                    : `I'll search for additional information about ${designer?.name} to enhance their profile.`
                  }
                </p>

                {isNewDesigner && (
                  <div className="max-w-md mx-auto mb-6">
                    <Label htmlFor="designer-name">Designer Name</Label>
                    <Input
                      id="designer-name"
                      placeholder="e.g., John Smith, Designer at Company"
                      value={newDesignerName}
                      onChange={(e) => setNewDesignerName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEnrich()}
                    />
                  </div>
                )}

                <Button 
                  onClick={handleEnrich}
                  disabled={isEnriching || (isNewDesigner && !newDesignerName.trim())}
                  size="lg"
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enrich Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {enrichmentResult && (
            <div className="space-y-4">
              {/* Confidence Score */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Enrichment Results</CardTitle>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const ConfidenceIcon = getConfidenceIcon(enrichmentResult.confidence);
                        return (
                          <>
                            <ConfidenceIcon className={`h-4 w-4 ${getConfidenceColor(enrichmentResult.confidence)}`} />
                            <span className={`font-medium ${getConfidenceColor(enrichmentResult.confidence)}`}>
                              {Math.round(enrichmentResult.confidence * 100)}% confidence
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </CardHeader>
                {enrichmentResult.sources && enrichmentResult.sources.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Sources:</span> {enrichmentResult.sources.join(", ")}
                    </div>
                  </CardContent>
                )}
              </Card>

              {enrichmentResult.success && enrichmentResult.data ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Fields to Apply</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose which information to add to the profile
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {renderField('title', enrichmentResult.data.title, 'Job Title')}
                        {renderField('company', enrichmentResult.data.company, 'Company')}
                        {renderField('bio', enrichmentResult.data.bio, 'Bio')}
                        {renderField('experience', enrichmentResult.data.experience, 'Experience')}
                        {renderField('skills', enrichmentResult.data.skills, 'Skills')}
                        {renderField('portfolioUrl', enrichmentResult.data.portfolioUrl, 'Portfolio URL')}
                        {renderField('email', enrichmentResult.data.email, 'Email')}
                        {renderField('phone', enrichmentResult.data.phone, 'Phone')}
                        {renderField('location', enrichmentResult.data.location, 'Location')}
                        {renderField('availability', enrichmentResult.data.availability, 'Availability')}
                        {renderField('rate', enrichmentResult.data.rate, 'Rate')}
                        {renderField('socialLinks', enrichmentResult.data.socialLinks, 'Social Links')}
                        {renderField('additionalInfo', enrichmentResult.data.additionalInfo, 'Additional Info')}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Additional Information Found</h3>
                    <p className="text-muted-foreground">
                      I couldn't find additional information for this designer. 
                      The profile may already be complete or the designer may have limited online presence.
                    </p>
                  </CardContent>
                </Card>
              )}

              {enrichmentResult.success && enrichmentResult.data && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleApply}
                    disabled={selectedFields.size === 0 || isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        Apply Selected ({selectedFields.size})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}