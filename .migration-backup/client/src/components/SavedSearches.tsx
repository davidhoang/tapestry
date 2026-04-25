import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useSavedSearches, useDeleteSavedSearch } from "@/hooks/use-saved-searches";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Trash2, Search, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SavedSearches() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [, setLocation] = useLocation();
  const { data: savedSearches, isLoading, isError } = useSavedSearches();
  const deleteMutation = useDeleteSavedSearch();
  const { toast } = useToast();

  const handleSearchClick = (searchType: string, searchValue: string) => {
    setLocation(`/${workspaceSlug}/search?type=${searchType}&value=${encodeURIComponent(searchValue)}`);
  };

  const handleDelete = async (e: React.MouseEvent, searchId: number) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(searchId);
      toast({
        title: "Saved search deleted",
        description: "The saved search has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete saved search.",
        variant: "destructive",
      });
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'skill':
        return 'default';
      case 'title':
        return 'secondary';
      case 'location':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'skill':
        return 'Skill';
      case 'title':
        return 'Title';
      case 'location':
        return 'Location';
      default:
        return type;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Saved searches
          {savedSearches && savedSearches.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {savedSearches.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Saved searches</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span>Failed to load saved searches</span>
          </div>
        ) : savedSearches && savedSearches.length > 0 ? (
          savedSearches.map((search) => (
            <DropdownMenuItem
              key={search.id}
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleSearchClick(search.searchType, search.searchValue)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{search.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge 
                      variant={getTypeBadgeVariant(search.searchType)} 
                      className="text-[10px] px-1.5 py-0"
                    >
                      {getTypeLabel(search.searchType)}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {search.searchValue}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => handleDelete(e, search.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No saved searches yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
