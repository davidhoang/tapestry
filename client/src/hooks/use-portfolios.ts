import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SelectPortfolio, SelectPortfolioProject, InsertPortfolio, InsertPortfolioProject } from '@db/schema';
import { useLocation } from 'wouter';

// Custom hook to extract workspace from URL
function useWorkspaceContext() {
  const [location] = useLocation();
  const pathParts = location.split('/');
  const workspaceSlug = pathParts[1]; // Assuming /workspace-name/... pattern
  return { workspaceSlug };
}

// Hook to fetch portfolios for a designer
export function useDesignerPortfolios(designerId: number) {
  const { workspaceSlug } = useWorkspaceContext();
  
  return useQuery({
    queryKey: ['/api/designers', designerId, 'portfolios'],
    queryFn: async () => {
      const res = await fetch(`/api/designers/${designerId}/portfolios`, {
        headers: {
          'x-workspace-slug': workspaceSlug || '',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch portfolios');
      }
      return res.json() as Promise<SelectPortfolio[]>;
    },
    enabled: !!designerId,
  });
}

// Hook to fetch a single portfolio with projects
export function usePortfolio(portfolioId: number) {
  const { workspaceSlug } = useWorkspaceContext();
  
  return useQuery({
    queryKey: ['/api/portfolios', portfolioId],
    queryFn: async () => {
      const res = await fetch(`/api/portfolios/${portfolioId}`, {
        headers: {
          'x-workspace-slug': workspaceSlug || '',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      return res.json() as Promise<SelectPortfolio & {
        projects: SelectPortfolioProject[];
      }>;
    },
    enabled: !!portfolioId,
  });
}

// Hook to create a new portfolio
export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useWorkspaceContext();

  return useMutation({
    mutationFn: async (portfolio: Omit<InsertPortfolio, 'slug'>) => {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-slug': workspaceSlug || '',
        },
        body: JSON.stringify(portfolio),
      });
      if (!res.ok) {
        throw new Error('Failed to create portfolio');
      }
      return res.json() as Promise<SelectPortfolio>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/designers', data.designerId, 'portfolios'] 
      });
    },
  });
}

// Hook to update a portfolio
export function useUpdatePortfolio() {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useWorkspaceContext();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SelectPortfolio> & { id: number }) => {
      const res = await fetch(`/api/portfolios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-slug': workspaceSlug || '',
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        throw new Error('Failed to update portfolio');
      }
      return res.json() as Promise<SelectPortfolio>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/portfolios', data.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/designers', data.designerId, 'portfolios'] 
      });
    },
  });
}

// Hook to delete a portfolio
export function useDeletePortfolio() {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useWorkspaceContext();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
        headers: {
          'x-workspace-slug': workspaceSlug || '',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to delete portfolio');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/designers'] 
      });
    },
  });
}

// Hook to fetch projects for a portfolio
export function usePortfolioProjects(portfolioId: number) {
  const { workspaceSlug } = useWorkspaceContext();
  
  return useQuery({
    queryKey: ['/api/portfolios', portfolioId, 'projects'],
    queryFn: async () => {
      const res = await fetch(`/api/portfolios/${portfolioId}/projects`, {
        headers: {
          'x-workspace-slug': workspaceSlug || '',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      return res.json() as Promise<SelectPortfolioProject[]>;
    },
    enabled: !!portfolioId,
  });
}

// Hook to create a new project
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useWorkspaceContext();

  return useMutation({
    mutationFn: async ({ portfolioId, ...project }: Omit<InsertPortfolioProject, 'slug'> & { portfolioId: number }) => {
      const res = await fetch(`/api/portfolios/${portfolioId}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-slug': workspaceSlug || '',
        },
        body: JSON.stringify(project),
      });
      if (!res.ok) {
        throw new Error('Failed to create project');
      }
      return res.json() as Promise<SelectPortfolioProject>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/portfolios', data.portfolioId, 'projects'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/portfolios', data.portfolioId] 
      });
    },
  });
}

// Hook to update a project
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useWorkspaceContext();

  return useMutation({
    mutationFn: async ({ 
      portfolioId, 
      id, 
      ...updates 
    }: Partial<SelectPortfolioProject> & { portfolioId: number; id: number }) => {
      const res = await fetch(`/api/portfolios/${portfolioId}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-slug': workspaceSlug || '',
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        throw new Error('Failed to update project');
      }
      return res.json() as Promise<SelectPortfolioProject>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/portfolios', data.portfolioId, 'projects'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/portfolios', data.portfolioId] 
      });
    },
  });
}

// Hook to delete a project
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useWorkspaceContext();

  return useMutation({
    mutationFn: async ({ portfolioId, id }: { portfolioId: number; id: number }) => {
      const res = await fetch(`/api/portfolios/${portfolioId}/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'x-workspace-slug': workspaceSlug || '',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to delete project');
      }
      return res.json();
    },
    onSuccess: (_, { portfolioId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/portfolios', portfolioId, 'projects'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/portfolios', portfolioId] 
      });
    },
  });
}

// Hook to fetch public portfolio by slug
export function usePublicPortfolio(slug: string) {
  return useQuery({
    queryKey: ['/api/public/portfolios', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/portfolios/${slug}`);
      if (!res.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      return res.json() as Promise<SelectPortfolio & {
        projects: SelectPortfolioProject[];
      }>;
    },
    enabled: !!slug,
  });
}

// Hook to submit portfolio inquiry
export function useSubmitInquiry() {
  return useMutation({
    mutationFn: async ({ slug, ...inquiry }: {
      slug: string;
      name: string;
      email: string;
      company?: string;
      subject?: string;
      message: string;
      phone?: string;
      budget?: string;
      timeline?: string;
      projectType?: string;
    }) => {
      const res = await fetch(`/api/public/portfolios/${slug}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inquiry),
      });
      if (!res.ok) {
        throw new Error('Failed to submit inquiry');
      }
      return res.json();
    },
  });
}