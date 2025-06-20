import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelectDesigner } from "@db/schema";

export interface DesignerEnrichmentData {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  experience?: string;
  skills?: string[];
  portfolioUrl?: string;
  email?: string;
  phone?: string;
  location?: string;
  availability?: string;
  rate?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    dribbble?: string;
    behance?: string;
    github?: string;
  };
  additionalInfo?: string;
}

export interface EnrichmentResult {
  success: boolean;
  data?: DesignerEnrichmentData;
  confidence: number;
  sources?: string[];
  error?: string;
}

export function useEnrichDesigner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (designerId: number): Promise<EnrichmentResult> => {
      const response = await fetch(`/api/designers/${designerId}/enrich`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enrich designer profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers"] });
    },
  });
}

export function useEnrichNewDesigner() {
  return useMutation({
    mutationFn: async (name: string): Promise<EnrichmentResult> => {
      const response = await fetch("/api/designers/enrich-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enrich new designer profile");
      }

      return response.json();
    },
  });
}

export function useApplyEnrichment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      designerId, 
      enrichmentData 
    }: { 
      designerId: number; 
      enrichmentData: DesignerEnrichmentData 
    }): Promise<SelectDesigner> => {
      const response = await fetch(`/api/designers/${designerId}/apply-enrichment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(enrichmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply enrichment");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/designers", data.id] });
    },
  });
}

export function useGenerateSkills() {
  return useMutation({
    mutationFn: async ({ bio, experience }: { bio?: string; experience?: string }): Promise<{ skills: string[] }> => {
      const response = await fetch("/api/designers/generate-skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ bio, experience }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate skills");
      }

      return response.json();
    },
  });
}