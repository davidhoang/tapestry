import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { slugify } from "@/utils/slugify";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import IntelligentMatch from "@/components/IntelligentMatch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LocationConsentModal from "@/components/LocationConsentModal";
import {
  Check,
  X,
  Loader2,
  UserPlus,
  Mail,
  MapPin,
  Inbox,
  Sparkles,
} from "lucide-react";
import { formatDistance } from "date-fns";

interface Designer {
  id: number;
  name: string;
  title: string;
  location?: string;
  company?: string;
  level: string;
  photoUrl?: string;
  skills: string[];
  available: boolean;
  description?: string;
}

interface RecommendationCandidate {
  id: number;
  recommendationId: number;
  designerId: number;
  score?: number;
  rank?: number;
  reasoning?: string;
  metadata?: Record<string, any>;
  isSelected: boolean;
  createdAt: string;
  designer: Designer;
}

interface Recommendation {
  id: number;
  workspaceId: number;
  userId: number;
  recommendationType: "recommend_designer" | "reach_out";
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "approved" | "applied" | "dismissed" | "snoozed";
  designerId?: number;
  targetListId?: number;
  score: number;
  metadata?: {
    jobTitle?: string;
    suggestedListName?: string;
    lastContactedAt?: string;
    suggestedUpdates?: string[];
    issues?: Array<{ type: string; description: string }>;
    [key: string]: any;
  };
  seenAt?: string;
  createdAt: string;
  updatedAt: string;
  candidates?: RecommendationCandidate[];
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  quota: {
    shown: number;
    remaining: number;
    date: string;
  };
}

interface LocationResponse {
  consentGranted: boolean;
  city?: string;
  country?: string;
}

const REJECTION_REASONS = [
  { value: "not_relevant", label: "Not relevant" },
  { value: "already_contacted", label: "Already contacted" },
  { value: "not_qualified", label: "Not qualified" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "location_mismatch", label: "Location mismatch" },
  { value: "other", label: "Other" },
];

function RecommendationCardSkeleton() {
  return (
    <Card className="w-full border-l-4 border-l-transparent">
      <CardContent className="p-5">
        <div className="flex gap-4 items-start">
          <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-lg mt-4" />
        <div className="flex gap-1.5 mt-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full mt-4" />
      </CardContent>
    </Card>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  workspaceSlug: string;
  onAccept: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", className: "bg-red-50 text-red-700 border-red-200", border: "border-l-red-400" },
  high:   { label: "High priority", className: "bg-amber-50 text-amber-700 border-amber-200", border: "border-l-amber-400" },
  medium: { label: "Medium", className: "bg-blue-50 text-blue-700 border-blue-200", border: "border-l-blue-300" },
  low:    { label: "Low", className: "bg-gray-50 text-gray-500 border-gray-200", border: "border-l-transparent" },
};

function RecommendationCard({
  recommendation,
  workspaceSlug,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: RecommendationCardProps) {
  const [showRejectDropdown, setShowRejectDropdown] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);

  const designer =
    recommendation.candidates?.[0]?.designer ||
    (recommendation.designerId ? null : null);

  const getActionContent = () => {
    switch (recommendation.recommendationType) {
      case "recommend_designer":
        return {
          contactedText: recommendation.metadata?.jobTitle
            ? `For ${recommendation.metadata.jobTitle}`
            : undefined,
          actionLabel: "Add to shortlist",
          icon: <UserPlus className="h-4 w-4 mr-2" />,
        };
      case "reach_out":
        const lastContacted = recommendation.metadata?.lastContactedAt;
        return {
          contactedText: lastContacted
            ? `Last contacted ${formatDistance(new Date(lastContacted), new Date(), { addSuffix: true })}`
            : "Never contacted",
          actionLabel: "Schedule outreach",
          icon: <Mail className="h-4 w-4 mr-2" />,
        };
      default:
        return {
          contactedText: undefined,
          actionLabel: "Accept",
          icon: <Check className="h-4 w-4 mr-2" />,
        };
    }
  };

  const { contactedText, actionLabel, icon } = getActionContent();
  const priorityConfig = PRIORITY_CONFIG[recommendation.priority] ?? PRIORITY_CONFIG.low;
  const reasoning = recommendation.candidates?.[0]?.reasoning || recommendation.description;
  const isLongReasoning = reasoning && reasoning.length > 130;

  if (!designer) return null;

  const skills = Array.isArray(designer.skills) ? designer.skills : [];

  return (
    <Card className={`w-full group relative transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4 ${priorityConfig.border}`}>
      {/* Dismiss — appears on hover, top-right */}
      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu open={showRejectDropdown} onOpenChange={setShowRejectDropdown}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isAccepting || isRejecting}
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              {isRejecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {REJECTION_REASONS.map((reason) => (
              <DropdownMenuItem
                key={reason.value}
                onClick={() => {
                  onReject(recommendation.id, reason.value);
                  setShowRejectDropdown(false);
                }}
              >
                {reason.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-5">
        {/* Designer header */}
        <div className="flex gap-4 items-start pr-6">
          <Link href={`/${workspaceSlug}/directory/${slugify(designer.name)}`} className="shrink-0">
            <Avatar className="h-14 w-14 cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all duration-150">
              <AvatarImage src={designer.photoUrl || ""} />
              <AvatarFallback className="text-base font-medium">
                {designer.name.split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/${workspaceSlug}/directory/${slugify(designer.name)}`}>
                <h3 className="font-semibold text-base leading-tight cursor-pointer hover:text-primary transition-colors">
                  {designer.name}
                </h3>
              </Link>
              {designer.available && (
                <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                  Available
                </span>
              )}
              {recommendation.priority !== "low" && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${priorityConfig.className}`}>
                  {priorityConfig.label}
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-sm mt-0.5">
              {designer.title}
              {designer.company && (
                <span className="text-muted-foreground/60"> · {designer.company}</span>
              )}
            </p>

            {designer.location && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {designer.location}
              </p>
            )}

            {contactedText && (
              <p className="text-xs text-primary mt-1">{contactedText}</p>
            )}
          </div>
        </div>

        {/* AI reasoning callout */}
        {reasoning && (
          <div className="mt-4 bg-muted/40 rounded-lg px-3 py-2.5">
            <p className={`text-sm text-muted-foreground leading-relaxed ${!reasoningExpanded && isLongReasoning ? "line-clamp-2" : ""}`}>
              <Sparkles className="h-3 w-3 inline mr-1.5 text-primary align-middle" />
              {reasoning}
            </p>
            {isLongReasoning && (
              <button
                onClick={() => setReasoningExpanded(!reasoningExpanded)}
                className="text-xs text-primary mt-1 hover:underline"
              >
                {reasoningExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {skills.slice(0, 5).map((skill: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 5 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{skills.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Primary action */}
        <Button
          onClick={() => onAccept(recommendation.id)}
          disabled={isAccepting || isRejecting}
          className="w-full mt-4"
          size="sm"
        >
          {isAccepting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            icon
          )}
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  onLoadMore: () => void;
  isLoading: boolean;
}

function EmptyState({ onLoadMore, isLoading }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Inbox className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No recommendations for today</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Check back later for designer matches and people to stay in touch with.
      </p>
      <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : null}
        Load more recommendations
      </Button>
    </div>
  );
}

interface LocationConsentBannerProps {
  onEnableLocation: () => void;
}

function LocationConsentBanner({ onEnableLocation }: LocationConsentBannerProps) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        <p className="text-sm">
          Enable location-based suggestions to get recommendations for designers
          in your area.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onEnableLocation}>
        Enable
      </Button>
    </div>
  );
}

export default function RecommendationsPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendations,
    refetch,
  } = useQuery<RecommendationsResponse>({
    queryKey: ["/api/home/recommendations", workspaceSlug],
    queryFn: async () => {
      return apiRequest("/api/home/recommendations", { workspaceSlug });
    },
    enabled: !!workspaceSlug,
  });

  const { data: locationData, isLoading: isLoadingLocation } =
    useQuery<LocationResponse>({
      queryKey: ["/api/user/location", workspaceSlug],
      queryFn: async () => {
        return apiRequest("/api/user/location", { workspaceSlug });
      },
      enabled: !!workspaceSlug,
    });

  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/home/recommendations/${id}/accept`, {
        method: "POST",
        body: {},
        workspaceSlug,
      });
    },
    onMutate: (id) => {
      setAcceptingId(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/home/recommendations", workspaceSlug],
      });
      toast({
        title: "Recommendation accepted",
        description: data.result?.action
          ? `Action: ${data.result.action.replace(/_/g, " ")}`
          : "The recommendation has been applied.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept recommendation",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setAcceptingId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return apiRequest(`/api/home/recommendations/${id}/reject`, {
        method: "POST",
        body: { reason },
        workspaceSlug,
      });
    },
    onMutate: ({ id }) => {
      setRejectingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/home/recommendations", workspaceSlug],
      });
      toast({
        title: "Recommendation rejected",
        description: "Your feedback has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject recommendation",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setRejectingId(null);
    },
  });

  const loadMoreMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/home/recommendations?loadMore=true", {
        workspaceSlug,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/home/recommendations", workspaceSlug],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load more recommendations",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (id: number) => {
    acceptMutation.mutate(id);
  };

  const handleReject = (id: number, reason: string) => {
    rejectMutation.mutate({ id, reason });
  };

  const handleLoadMore = () => {
    loadMoreMutation.mutate();
  };

  const handleEnableLocation = () => {
    setShowLocationDialog(true);
  };

  const recommendations = recommendationsData?.recommendations || [];
  const quota = recommendationsData?.quota;
  const showLocationBanner =
    !isLoadingLocation && locationData && !locationData.consentGranted;
  const canLoadMore = quota && quota.remaining > 0;


  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 pt-20 pb-8 space-y-10 max-w-screen-xl">
        {/* Intelligent Match Section */}
        <IntelligentMatch />

        {/* Recommendations Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Today's recommendations</h2>

          {showLocationBanner && (
            <LocationConsentBanner onEnableLocation={handleEnableLocation} />
          )}

          {isLoadingRecommendations ? (
            <div className="flex flex-row gap-4 overflow-x-auto pb-2">
              <div className="w-[360px] flex-shrink-0"><RecommendationCardSkeleton /></div>
              <div className="w-[360px] flex-shrink-0"><RecommendationCardSkeleton /></div>
              <div className="w-[360px] flex-shrink-0"><RecommendationCardSkeleton /></div>
            </div>
          ) : recommendations.length === 0 ? (
            <EmptyState onLoadMore={handleLoadMore} isLoading={loadMoreMutation.isPending} />
          ) : (
            <div className="flex flex-row gap-4 overflow-x-auto pb-2 items-start">
              {recommendations
                .filter((r) => r.status === "new")
                .map((recommendation) => (
                  <div key={recommendation.id} className="w-[360px] flex-shrink-0">
                    <RecommendationCard
                      recommendation={recommendation}
                      workspaceSlug={workspaceSlug!}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      isAccepting={acceptingId === recommendation.id}
                      isRejecting={rejectingId === recommendation.id}
                    />
                  </div>
                ))}
            </div>
          )}

          {canLoadMore && recommendations.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadMoreMutation.isPending}
              >
                {loadMoreMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </div>

        <LocationConsentModal
          open={showLocationDialog}
          onOpenChange={setShowLocationDialog}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["/api/home/recommendations", workspaceSlug],
            });
          }}
        />
      </div>
    </div>
  );
}
