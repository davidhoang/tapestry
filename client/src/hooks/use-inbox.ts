import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface InboxRecommendation {
  id: number;
  workspaceId: number;
  userId: number;
  recommendationType: 'add_to_list' | 'create_list' | 'update_profile';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'approved' | 'applied' | 'dismissed' | 'snoozed';
  designerId?: number;
  targetListId?: number;
  score: number;
  groupKey?: string;
  dedupHash?: string;
  snoozeUntil?: string;
  appliedAt?: string;
  resolvedBy?: number;
  metadata?: {
    sourceType?: string;
    sourceId?: number;
    jobId?: number;
    listId?: number;
    filters?: Record<string, any>;
    aiReasoning?: string;
    candidateCount?: number;
    estimatedValue?: string;
    actionUrl?: string;
    expiresAt?: string;
    [key: string]: any;
  };
  actionTaken?: string;
  actionMetadata?: any;
  seenAt?: string;
  actedUponAt?: string;
  dismissedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  candidates?: InboxRecommendationCandidate[];
}

export interface InboxRecommendationCandidate {
  id: number;
  recommendationId: number;
  designerId: number;
  score?: number;
  rank?: number;
  reasoning?: string;
  metadata?: {
    skillMatches?: string[];
    experienceMatch?: number;
    locationMatch?: boolean;
    availabilityMatch?: boolean;
    portfolioRelevance?: number;
    previousFeedback?: string;
    confidence?: number;
    [key: string]: any;
  };
  isSelected: boolean;
  createdAt: string;
  designer: {
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
  };
}

export interface InboxFilters {
  status?: string | string[];
  type?: string | string[];
  sortBy?: 'score' | 'created' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface InboxResponse {
  recommendations: InboxRecommendation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function useInboxRecommendations(filters: InboxFilters = {}) {
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  const queryParams = new URLSearchParams();
  
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach(s => queryParams.append('status', s));
    } else {
      queryParams.set('status', filters.status);
    }
  }
  
  if (filters.type) {
    if (Array.isArray(filters.type)) {
      filters.type.forEach(t => queryParams.append('type', t));
    } else {
      queryParams.set('type', filters.type);
    }
  }
  
  if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
  if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);
  if (filters.page) queryParams.set('page', filters.page.toString());
  if (filters.limit) queryParams.set('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/inbox${queryString ? `?${queryString}` : ''}`;

  return useQuery<InboxResponse>({
    queryKey: ['/api/inbox', workspaceSlug, filters],
    queryFn: async () => {
      return apiRequest(endpoint, { workspaceSlug });
    },
    enabled: !!workspaceSlug && workspaceSlug.length > 0,
  });
}

export function useApproveRecommendation() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      selectedCandidateIds = [] 
    }: { 
      id: number; 
      selectedCandidateIds?: number[] 
    }) => {
      return apiRequest(`/api/inbox/${id}/approve`, {
        method: "POST",
        body: { selectedCandidateIds },
        workspaceSlug,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inbox', workspaceSlug] });
      toast({
        title: "Success",
        description: "Recommendation approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve recommendation",
        variant: "destructive",
      });
    },
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      reason 
    }: { 
      id: number; 
      reason?: string 
    }) => {
      return apiRequest(`/api/inbox/${id}/dismiss`, {
        method: "POST",
        body: { reason },
        workspaceSlug,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inbox', workspaceSlug] });
      toast({
        title: "Success",
        description: "Recommendation dismissed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dismiss recommendation",
        variant: "destructive",
      });
    },
  });
}

export function useSnoozeRecommendation() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      snoozeUntil 
    }: { 
      id: number; 
      snoozeUntil: string 
    }) => {
      return apiRequest(`/api/inbox/${id}/snooze`, {
        method: "POST",
        body: { snoozeUntil },
        workspaceSlug,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inbox', workspaceSlug] });
      toast({
        title: "Success",
        description: "Recommendation snoozed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to snooze recommendation",
        variant: "destructive",
      });
    },
  });
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      types, 
      forceRefresh = false 
    }: { 
      types?: string[]; 
      forceRefresh?: boolean 
    } = {}) => {
      return apiRequest('/api/inbox/generate', {
        method: "POST",
        body: { types, forceRefresh },
        workspaceSlug,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inbox', workspaceSlug] });
      toast({
        title: "Success",
        description: `Generated ${data.count || 0} new recommendations`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    },
  });
}

export function useMarkRecommendationSeen() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/inbox/${id}/seen`, {
        method: "POST",
        workspaceSlug,
      });
    },
    onSuccess: () => {
      // Silently update cache without showing toast
      queryClient.invalidateQueries({ queryKey: ['/api/inbox', workspaceSlug] });
    },
  });
}