import { useQuery } from "@tanstack/react-query";
import type { SelectDesigner } from "@db/schema";

export function useDesigners() {
  return useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers"],
    queryFn: async () => {
      const response = await fetch("/api/designers");
      if (!response.ok) {
        throw new Error('Failed to fetch designers');
      }
      return response.json();
    },
  });
}

export function useDesigner(id: number) {
  return useQuery<SelectDesigner>({
    queryKey: [`/api/designers/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/designers/${id}`);
      if (!response.ok) {
        throw new Error('Designer not found');
      }
      return response.json();
    },
    enabled: !!id && id > 0,
  });
}