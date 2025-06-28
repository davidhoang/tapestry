import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, MapPin, Star, Briefcase } from "lucide-react";

interface RecommendationFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designerId: number;
  designerName: string;
  matchScore: number;
  aiReasoning?: string;
  jobId?: number;
  initialFeedbackType?: string | null;
}

interface FeedbackData {
  designerId: number;
  jobId?: number;
  matchScore: number;
  feedbackType: string;
  rating?: number;
  comments?: string;
  aiReasoning?: string;
}

export default function RecommendationFeedbackModal({
  open,
  onOpenChange,
  designerId,
  designerName,
  matchScore,
  aiReasoning,
  jobId,
  initialFeedbackType
}: RecommendationFeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set initial feedback type when modal opens
  useEffect(() => {
    if (open && initialFeedbackType) {
      setFeedbackType(initialFeedbackType);
    } else if (open && !initialFeedbackType) {
      setFeedbackType("");
    }
  }, [open, initialFeedbackType]);

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: FeedbackData) => {
      const response = await fetch("/api/recommendations/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit feedback");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for helping improve our recommendations!",
      });
      onOpenChange(false);
      // Reset form
      setFeedbackType("");
      setRating(null);
      setComments("");
      // Invalidate any analytics queries
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations/feedback/analytics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting feedback",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!feedbackType) {
      toast({
        title: "Please select feedback type",
        description: "Let us know what you think about this recommendation",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      designerId,
      jobId,
      matchScore,
      feedbackType,
      rating: rating || undefined,
      comments: comments.trim() || undefined,
      aiReasoning,
    });
  };

  const feedbackOptions = [
    {
      value: "good_match",
      label: "Good match",
      description: "This designer looks like a great fit for this role",
      icon: ThumbsUp,
      color: "text-green-600",
    },
    {
      value: "irrelevant_experience",
      label: "Irrelevant experience",
      description: "Designer's background doesn't align with role requirements",
      icon: Briefcase,
      color: "text-red-600",
    },
    {
      value: "under_qualified",
      label: "Under-qualified",
      description: "Designer lacks the necessary skills or experience level",
      icon: ThumbsDown,
      color: "text-orange-600",
    },
    {
      value: "over_qualified",
      label: "Over-qualified",
      description: "Designer has too much experience for this role",
      icon: Star,
      color: "text-blue-600",
    },
    {
      value: "location_mismatch",
      label: "Location mismatch",
      description: "Designer's location doesn't work for this role",
      icon: MapPin,
      color: "text-purple-600",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Provide feedback on {designerName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Match Score Display */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">AI Match Score</span>
              <span className="text-2xl font-bold text-primary">{matchScore}%</span>
            </div>
            {aiReasoning && (
              <p className="text-sm text-muted-foreground">{aiReasoning}</p>
            )}
          </div>

          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">How would you rate this recommendation?</Label>
            <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
              {feedbackOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex items-center space-x-3 flex-1">
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Rating (only for good matches) */}
          {feedbackType === "good_match" && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Rate this match (1-5 stars)</Label>
              <RadioGroup value={rating?.toString()} onValueChange={(value) => setRating(parseInt(value))}>
                <div className="flex space-x-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="flex items-center space-x-2">
                      <RadioGroupItem value={star.toString()} id={`star-${star}`} />
                      <Label htmlFor={`star-${star}`} className="cursor-pointer">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{star}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-3">
            <Label htmlFor="comments" className="text-base font-medium">
              Additional comments (optional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Any specific thoughts about this recommendation? This helps us improve our matching algorithm."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitFeedbackMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitFeedbackMutation.isPending || !feedbackType}
            >
              {submitFeedbackMutation.isPending ? "Submitting..." : "Submit feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}