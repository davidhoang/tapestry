import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
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
  ChevronRight,
  List,
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

function RecommendationCard({
  recommendation,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: RecommendationCardProps) {
  const [showRejectDropdown, setShowRejectDropdown] = useState(false);

  const designer =
    recommendation.candidates?.[0]?.designer ||
    (recommendation.designerId ? null : null);

  const getActionContent = () => {
    switch (recommendation.recommendationType) {
      case "recommend_designer":
        return {
          subtitle: recommendation.metadata?.jobTitle
            ? `For ${recommendation.metadata.jobTitle}`
            : undefined,
          actionLabel: "Add to shortlist",
          icon: <UserPlus className="h-4 w-4 mr-2" />,
        };
      case "reach_out":
        const lastContacted = recommendation.metadata?.lastContactedAt;
        const contactedText = lastContacted
          ? `Last contacted ${formatDistance(new Date(lastContacted), new Date(), { addSuffix: true })}`
          : "Never contacted";
        return {
          subtitle: contactedText,
          actionLabel: "Schedule outreach",
          icon: <Mail className="h-4 w-4 mr-2" />,
        };
      default:
        return {
          subtitle: undefined,
          actionLabel: "Accept",
          icon: <Check className="h-4 w-4 mr-2" />,
        };
    }
  };

  const { subtitle, actionLabel, icon } = getActionContent();

  if (!designer) {
    return null;
  }

  const skills = Array.isArray(designer.skills) ? designer.skills : [];

  return (
    <Card className="w-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={designer.photoUrl || ""} />
            <AvatarFallback>
              {designer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{designer.name}</h3>
            <p className="text-muted-foreground text-sm truncate">
              {designer.title}
              {designer.company && ` at ${designer.company}`}
            </p>
            {subtitle && (
              <p className="text-sm text-primary mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.slice(0, 5).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 5}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onAccept(recommendation.id)}
            disabled={isAccepting || isRejecting}
            className="flex-1"
            size="sm"
          >
            {isAccepting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              icon
            )}
            {actionLabel}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onAccept(recommendation.id)}
            disabled={isAccepting || isRejecting}
            className="h-10 w-10"
          >
            {isAccepting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu
            open={showRejectDropdown}
            onOpenChange={setShowRejectDropdown}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={isAccepting || isRejecting}
                className="h-10 w-10"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
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

  // Fetch lists for the lists section
  const { data: listsData, isLoading: isLoadingLists } = useQuery<any[]>({
    queryKey: ["/api/lists", workspaceSlug],
    queryFn: async () => {
      return apiRequest("/api/lists", { workspaceSlug });
    },
    enabled: !!workspaceSlug,
  });

  const lists = listsData || [];

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 pt-20 pb-8 space-y-10 max-w-2xl">
        {/* Intelligent Match Section */}
        <IntelligentMatch />

        {/* Recommendations Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Today's recommendations</h2>

          {showLocationBanner && (
            <LocationConsentBanner onEnableLocation={handleEnableLocation} />
          )}

          {isLoadingRecommendations ? (
            <div className="space-y-4">
              <RecommendationCardSkeleton />
              <RecommendationCardSkeleton />
              <RecommendationCardSkeleton />
            </div>
          ) : recommendations.length === 0 ? (
            <EmptyState onLoadMore={handleLoadMore} isLoading={loadMoreMutation.isPending} />
          ) : (
            <div className="space-y-4">
              {recommendations
                .filter((r) => r.status === "new")
                .map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    isAccepting={acceptingId === recommendation.id}
                    isRejecting={rejectingId === recommendation.id}
                  />
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

        {/* Lists Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your lists</h2>
            <Link to={`/${workspaceSlug}/lists`}>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all lists
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {isLoadingLists ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : lists.length === 0 ? (
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <List className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No lists yet</p>
              <Link to={`/${workspaceSlug}/lists`}>
                <Button variant="link" size="sm" className="mt-2">
                  Create your first list
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {lists.slice(0, 5).map((list: any) => (
                <Link key={list.id} to={`/${workspaceSlug}/lists/${list.id}`}>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <List className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{list.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {list.designerCount || 0} designers
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
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
