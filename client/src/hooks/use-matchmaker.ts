import { useMutation } from "@tanstack/react-query";

export interface MatchRecommendation {
  designerId: number;
  matchScore: number;
  reasoning: string;
  matchedSkills: string[];
  concerns?: string;
  designer: {
    id: number;
    name: string;
    title: string | null;
    company: string | null;
    skills: string[] | null;
    bio: string | null;
    experience: string | null;
    portfolioUrl: string | null;
    photoUrl: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    availability: string | null;
    rate: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface MatchmakerResponse {
  analysis: string;
  recommendations: MatchRecommendation[];
  roleDescription: string;
}

export function useMatchmaker() {
  return useMutation({
    mutationFn: async (roleDescription: string): Promise<MatchmakerResponse> => {
      const response = await fetch("/api/matchmaker/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ roleDescription }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze role");
      }

      return response.json();
    },
  });
}