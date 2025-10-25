import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SelectDesigner } from "@db/schema";
import DesignerCard from "@/components/DesignerCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const processSkills = (skills: any): string[] => {
  if (Array.isArray(skills)) {
    return skills;
  }
  if (typeof skills === "string" && skills.length > 0) {
    const trimmedSkills = skills.trim();
    if (trimmedSkills.length > 0) {
      try {
        const parsed = JSON.parse(trimmedSkills);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return trimmedSkills
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      }
    }
  }
  return [];
};

export default function SearchResultsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [location] = useLocation();
  const [, setLocation] = useLocation();

  // Parse query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const filterType = searchParams.get('type') || 'skill';
  const filterValue = searchParams.get('value') || '';

  // Fetch filtered designers
  const { data: designers, isLoading } = useQuery<SelectDesigner[]>({
    queryKey: ["/api/designers/search", filterType, filterValue, workspaceSlug],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      if (workspaceSlug && workspaceSlug.length > 0) {
        headers['x-workspace-slug'] = workspaceSlug;
      }
      
      const response = await fetch(
        `/api/designers/search?type=${filterType}&value=${encodeURIComponent(filterValue)}`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch designers: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!filterValue && !!workspaceSlug,
  });

  const getFilterTitle = () => {
    switch (filterType) {
      case 'skill':
        return `Designers with "${filterValue}" skill`;
      case 'title':
        return `Designers with "${filterValue}" title`;
      case 'location':
        return `Designers in ${filterValue}`;
      default:
        return 'Search Results';
    }
  };

  const getFilterIcon = () => {
    switch (filterType) {
      case 'skill':
        return '🎯';
      case 'title':
        return '💼';
      case 'location':
        return '📍';
      default:
        return '🔍';
    }
  };

  if (!filterValue) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/${workspaceSlug}/directory`)}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to directory
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Invalid Search</h1>
            <p className="text-muted-foreground">No search criteria specified.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/${workspaceSlug}/directory`)}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to directory
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <span className="text-4xl">{getFilterIcon()}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{getFilterTitle()}</h1>
              <p className="text-muted-foreground mt-1">
                {isLoading ? 'Loading...' : `${designers?.length || 0} designer${designers?.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          {/* Filter Badge */}
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Search className="h-3 w-3 mr-1" />
              {filterType === 'skill' && 'Skill'}
              {filterType === 'title' && 'Title'}
              {filterType === 'location' && 'Location'}
              : {filterValue}
            </Badge>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 mt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : designers && designers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {designers.map((designer) => (
              <DesignerCard
                key={designer.id}
                designer={designer}
                onEdit={() => {}}
                onEnrich={() => {}}
                showCheckbox={false}
                isSelected={false}
                onToggleSelect={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">No designers found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find any designers matching your search criteria.
            </p>
            <Button onClick={() => setLocation(`/${workspaceSlug}/directory`)}>
              Browse all designers
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
