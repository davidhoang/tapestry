import { useQuery } from "@tanstack/react-query";
import type { SelectDesigner } from "@db/schema";

export function useDesigners() {
  return useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers"],
  });
}

export function useDesigner(id: number) {
  return useQuery<SelectDesigner>({
    queryKey: [`/api/designers/${id}`],
    enabled: !!id && id > 0,
  });
}

export function useDesignerBySlug(slug: string) {
  return useQuery<SelectDesigner>({
    queryKey: [`/api/designers/slug/${slug}`],
    enabled: !!slug && slug.length > 0,
  });
}