import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelectConversation, SelectMessage } from "@db/schema";

export interface ConversationWithMessages extends SelectConversation {
  messages: SelectMessage[];
}

export interface ChatMessage {
  message: SelectMessage;
  recommendations?: any[];
}

async function createConversation(title?: string): Promise<SelectConversation> {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create conversation");
  }

  return response.json();
}

async function getConversations(): Promise<SelectConversation[]> {
  const response = await fetch("/api/conversations");
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get conversations");
  }

  return response.json();
}

async function getConversation(id: number): Promise<ConversationWithMessages> {
  const response = await fetch(`/api/conversations/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get conversation");
  }

  return response.json();
}

async function sendMessage(conversationId: number, content: string): Promise<ChatMessage> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return response.json();
}

export function useConversations() {
  return useQuery({
    queryKey: ["/api/conversations"],
    queryFn: getConversations,
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ["/api/conversations", id],
    queryFn: () => id ? getConversation(id) : null,
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
      sendMessage(conversationId, content),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}