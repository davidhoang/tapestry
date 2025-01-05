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
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/designers", {
        method: "POST",
        body: formData,
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