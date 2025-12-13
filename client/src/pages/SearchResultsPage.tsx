import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SelectDesigner } from "@db/schema";
import DesignerCard from "@/components/DesignerCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Search, Download, Bookmark } from "lucide-react";
import { exportToCSV, designerExportColumns } from "@/lib/export";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateSavedSearch } from "@/hooks/use-saved-searches";
import { useToast } from "@/hooks/use-toast";

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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const createSavedSearch = useCreateSavedSearch();
  const { toast } = useToast();

  // Parse query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const filterType = searchParams.get('type') || 'skill';
  const filterValue = searchParams.get('value') || '';

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this search.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSavedSearch.mutateAsync({
        name: searchName.trim(),
        searchType: filterType,
        searchValue: filterValue,
      });
      toast({
        title: "Search saved",
        description: "Your search has been saved successfully.",
      });
      setShowSaveDialog(false);
      setSearchName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save search. Please try again.",
        variant: "destructive",
      });
    }
  };

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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="gap-2"
              >
                <Bookmark className="h-4 w-4" />
                Save this search
              </Button>
              {designers && designers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToCSV(designers, `designers-${filterType}-${filterValue}`, designerExportColumns);
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export results
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
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

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search name</label>
              <Input
                placeholder="e.g., Senior React developers in NYC"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveSearch();
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Search criteria:</span>{" "}
              {filterType === 'skill' && 'Skill'}
              {filterType === 'title' && 'Title'}
              {filterType === 'location' && 'Location'}
              {" "} = "{filterValue}"
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSearch}
              disabled={createSavedSearch.isPending}
            >
              {createSavedSearch.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save search"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
