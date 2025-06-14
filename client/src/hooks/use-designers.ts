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
      console.log("useDesigner - Fetching designer with ID:", id);
      const response = await fetch(`/api/designers/${id}`);
      console.log("useDesigner - Response status:", response.status);
      if (!response.ok) {
        console.log("useDesigner - Response not ok:", response.status, response.statusText);
        throw new Error('Designer not found');
      }
      const data = await response.json();
      console.log("useDesigner - Response data:", data);
      return data;
    },
    enabled: !!id && id > 0,
  });
}