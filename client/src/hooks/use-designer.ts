import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertDesigner, SelectDesigner } from "@db/schema";

export function useDesigners() {
  return useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers"],
  });
}

export function useCreateDesigner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (designer: Omit<InsertDesigner, "id" | "userId">) => {
      const response = await fetch("/api/designers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(designer),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers"] });
    },
  });
}
