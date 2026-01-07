import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface TimelineAuthor {
  id: number;
  username: string | null;
  email: string;
  profilePhotoUrl: string | null;
}

interface TimelineNote {
  id: string;
  type: 'note';
  content: string;
  contentPlain: string | null;
  isPinned: boolean;
  author: TimelineAuthor | null;
  createdAt: string;
  updatedAt: string;
  noteId: number;
}

interface TimelineEventDetails {
  changedFields?: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  listId?: number;
  listName?: string;
  enrichmentSource?: string;
  noteId?: number;
  [key: string]: any;
}

interface TimelineEvent {
  id: string;
  type: 'event';
  eventType: string;
  source: string;
  summary: string;
  details: TimelineEventDetails | null;
  actor: TimelineAuthor | null;
  createdAt: string;
  eventId: number;
}

export type TimelineItem = TimelineNote | TimelineEvent;

interface TimelineResponse {
  timeline: TimelineItem[];
  pagination: {
    total: number;
    totalNotes: number;
    totalEvents: number;
    limit: number;
    offset: number;
  };
}

export function useDesignerTimeline(
  designerId: number | undefined,
  filter: 'all' | 'notes' | 'activity' = 'all',
  limit: number = 50
) {
  const [location] = useLocation();
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1];

  return useQuery<TimelineResponse>({
    queryKey: ["/api/designers", designerId, "timeline", filter, workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers['x-workspace-slug'] = workspaceSlug;
      }
      
      const params = new URLSearchParams({
        filter,
        limit: String(limit),
      });
      
      const response = await fetch(`/api/designers/${designerId}/timeline?${params.toString()}`, {
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch timeline: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!designerId && !!workspaceSlug && workspaceSlug.length > 0,
  });
}

interface CreateNoteInput {
  designerId: number;
  content: string;
  contentPlain?: string;
}

export function useCreateDesignerNote() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async ({ designerId, content, contentPlain }: CreateNoteInput) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers['x-workspace-slug'] = workspaceSlug;
      }

      const response = await fetch(`/api/designers/${designerId}/notes`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ content, contentPlain }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create note');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/designers", variables.designerId, "timeline"], 
        exact: false 
      });
    },
  });
}

interface UpdateNoteInput {
  designerId: number;
  noteId: number;
  content?: string;
  contentPlain?: string;
  isPinned?: boolean;
}

export function useUpdateDesignerNote() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async ({ designerId, noteId, content, contentPlain, isPinned }: UpdateNoteInput) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers['x-workspace-slug'] = workspaceSlug;
      }

      const response = await fetch(`/api/designers/${designerId}/notes/${noteId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ content, contentPlain, isPinned }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update note');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/designers", variables.designerId, "timeline"], 
        exact: false 
      });
    },
  });
}

interface DeleteNoteInput {
  designerId: number;
  noteId: number;
}

export function useDeleteDesignerNote() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1];

  return useMutation({
    mutationFn: async ({ designerId, noteId }: DeleteNoteInput) => {
      const headers: Record<string, string> = {};
      
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers['x-workspace-slug'] = workspaceSlug;
      }

      const response = await fetch(`/api/designers/${designerId}/notes/${noteId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete note');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/designers", variables.designerId, "timeline"], 
        exact: false 
      });
    },
  });
}
