import { useState, useEffect, useRef, useCallback } from "react";
import { 
  useInboxRecommendations, 
  useApproveRecommendation, 
  useDismissRecommendation, 
  useSnoozeRecommendation,
  useGenerateRecommendations,
  useMarkRecommendationSeen,
  type InboxRecommendation, 
  type InboxFilters 
} from "@/hooks/use-inbox";
import { useDesigners } from "@/hooks/use-designer";
import { useLists } from "@/hooks/use-lists";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Loader2, 
  Plus, 
  Filter, 
  MoreVertical, 
  Check, 
  X, 
  Clock, 
  Sparkles,
  Users,
  UserPlus,
  Edit,
  Star,
  Target,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  ArrowRight,
  Upload
} from "lucide-react";
import { formatDistance } from "date-fns";
import { Link } from "wouter";
import LinkedInImportModal from "@/components/LinkedInImportModal";
import ProfileQuickEdit from "@/components/ProfileQuickEdit";

interface FilterBarProps {
  filters: InboxFilters;
  onFiltersChange: (filters: InboxFilters) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

function FilterBar({ filters, onFiltersChange, onGenerate, isGenerating }: FilterBarProps) {
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/50 p-4 rounded-lg">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select
            value={filters.status as string || "all"}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, status: value === "all" ? undefined : value, page: 1 })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="snoozed">Snoozed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.type as string || "all"}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, type: value === "all" ? undefined : value, page: 1 })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="add_to_list">Add to List</SelectItem>
              <SelectItem value="create_list">Create List</SelectItem>
              <SelectItem value="update_profile">Update Profile</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${filters.sortBy || "score"}-${filters.sortOrder || "desc"}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              onFiltersChange({ 
                ...filters, 
                sortBy: sortBy as 'score' | 'created' | 'priority',
                sortOrder: sortOrder as 'asc' | 'desc'
              });
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score-desc">Score: High to Low</SelectItem>
              <SelectItem value="score-asc">Score: Low to High</SelectItem>
              <SelectItem value="created-desc">Newest First</SelectItem>
              <SelectItem value="created-asc">Oldest First</SelectItem>
              <SelectItem value="priority-asc">Priority: Low to High</SelectItem>
              <SelectItem value="priority-desc">Priority: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowLinkedInImport(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload LinkedIn PDFs
          </Button>
          
          <Button 
            onClick={onGenerate} 
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Generate New
          </Button>
        </div>
      </div>

      <Dialog open={showLinkedInImport} onOpenChange={setShowLinkedInImport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload LinkedIn PDFs</DialogTitle>
          </DialogHeader>
          <LinkedInImportModal onClose={() => setShowLinkedInImport(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface RecommendationCardProps {
  recommendation: InboxRecommendation;
  onApprove: (id: number, selectedCandidateIds?: number[]) => void;
  onDismiss: (id: number, reason?: string) => void;
  onSnooze: (id: number, snoozeUntil: string) => void;
  onMarkSeen: (id: number) => void;
  isApproving?: boolean;
  isDismissing?: boolean;
  isSnoozingRecommendation?: boolean;
}

function RecommendationCard({ 
  recommendation, 
  onApprove, 
  onDismiss, 
  onSnooze, 
  onMarkSeen,
  isApproving = false,
  isDismissing = false,
  isSnoozingRecommendation = false
}: RecommendationCardProps) {
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [dismissReason, setDismissReason] = useState("");
  const [snoozeDate, setSnoozeDate] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recommendation.seenAt || !cardRef.current) return;

    let hasTriggered = false; // Additional safeguard to prevent multiple calls

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Mark as seen when 50% of the card is visible
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasTriggered && !recommendation.seenAt) {
            hasTriggered = true;
            onMarkSeen(recommendation.id);
            observer.disconnect(); // Only mark once
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the element is visible
        rootMargin: '0px 0px -10% 0px' // Add some margin to prevent premature triggering
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [recommendation.id, recommendation.seenAt]); // Removed onMarkSeen from dependencies to prevent re-creation

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-800 border-green-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'applied': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'dismissed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'snoozed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add_to_list': return <UserPlus className="h-4 w-4" />;
      case 'create_list': return <Users className="h-4 w-4" />;
      case 'update_profile': return <Edit className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const handleApprove = () => {
    if (recommendation.candidates && recommendation.candidates.length > 1) {
      setShowApproveDialog(true);
    } else {
      onApprove(recommendation.id);
    }
  };

  const handleConfirmApprove = () => {
    onApprove(recommendation.id, selectedCandidates.length > 0 ? selectedCandidates : undefined);
    setShowApproveDialog(false);
    setSelectedCandidates([]);
  };

  const handleDismiss = () => {
    onDismiss(recommendation.id, dismissReason || undefined);
    setShowDismissDialog(false);
    setDismissReason("");
  };

  const handleSnooze = () => {
    if (snoozeDate) {
      onSnooze(recommendation.id, snoozeDate);
      setShowSnoozeDialog(false);
      setSnoozeDate("");
    }
  };

  const renderCandidates = () => {
    if (!recommendation.candidates || recommendation.candidates.length === 0) {
      return null;
    }

    const candidatesToShow = isExpanded ? recommendation.candidates : recommendation.candidates.slice(0, 3);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Candidate Designers</h4>
          {recommendation.candidates.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? (
                <>
                  Show Less <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  Show All ({recommendation.candidates.length}) <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {candidatesToShow.map((candidate) => (
            <div key={candidate.id} className="flex items-center gap-3 p-2 rounded-md border bg-muted/30">
              <Avatar className="h-8 w-8">
                <AvatarImage src={candidate.designer.photoUrl || ""} />
                <AvatarFallback className="text-xs">
                  {candidate.designer.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{candidate.designer.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {candidate.designer.title}
                  {candidate.designer.company && ` • ${candidate.designer.company}`}
                </div>
                {candidate.score && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium">{candidate.score}/100</span>
                  </div>
                )}
              </div>
              {candidate.reasoning && (
                <div className="text-xs text-muted-foreground max-w-48 truncate" title={candidate.reasoning}>
                  {candidate.reasoning}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card ref={cardRef} className={`transition-all duration-200 hover:shadow-md ${!recommendation.seenAt ? 'ring-2 ring-primary/20' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon(recommendation.recommendationType)}
                <CardTitle className="text-lg truncate">{recommendation.title}</CardTitle>
                {!recommendation.seenAt && (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </div>
              {recommendation.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {recommendation.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{recommendation.score}</span>
              </div>
              
              {recommendation.status === 'new' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={isApproving || isDismissing || isSnoozingRecommendation}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={handleApprove}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowSnoozeDialog(true)}
                      disabled={isSnoozingRecommendation}
                    >
                      {isSnoozingRecommendation ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Clock className="mr-2 h-4 w-4" />
                      )}
                      Snooze
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDismissDialog(true)}
                      disabled={isDismissing}
                    >
                      {isDismissing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Dismiss
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getPriorityColor(recommendation.priority)}>
              {recommendation.priority}
            </Badge>
            <Badge className={getStatusColor(recommendation.status)}>
              {recommendation.status}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDistance(new Date(recommendation.createdAt), new Date(), { addSuffix: true })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {renderCandidates()}
          
          {recommendation.metadata?.aiReasoning && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <h5 className="font-medium text-sm mb-1">AI Reasoning</h5>
              <p className="text-sm text-muted-foreground">
                {recommendation.metadata.aiReasoning}
              </p>
            </div>
          )}

          {/* Quick Edit for Update Profile Recommendations */}
          {recommendation.recommendationType === 'update_profile' && recommendation.candidates && recommendation.candidates[0] && (
            <div className="mt-4">
              {!showQuickEdit ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickEdit(true)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Quick Edit Profile
                </Button>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium">Update {recommendation.candidates[0].designer.name}'s Profile</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickEdit(false)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                  <ProfileQuickEdit
                    designer={recommendation.candidates[0].designer}
                    issues={recommendation.metadata?.issues || []}
                    onSuccess={() => {
                      setShowQuickEdit(false);
                      onApprove(recommendation.id);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {recommendation.status === 'new' && (
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleApprove} 
                size="sm" 
                className="flex-1"
                disabled={isApproving}
              >
                {isApproving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSnoozeDialog(true)} 
                size="sm"
                disabled={isSnoozingRecommendation}
              >
                {isSnoozingRecommendation ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                Snooze
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDismissDialog(true)} 
                size="sm"
                disabled={isDismissing}
              >
                {isDismissing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Recommendation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which candidates you'd like to include in this action:
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recommendation.candidates?.map((candidate) => (
                <div key={candidate.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`candidate-${candidate.id}`}
                    checked={selectedCandidates.includes(candidate.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCandidates([...selectedCandidates, candidate.id]);
                      } else {
                        setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.id));
                      }
                    }}
                  />
                  <Label htmlFor={`candidate-${candidate.id}`} className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={candidate.designer.photoUrl || ""} />
                      <AvatarFallback className="text-xs">
                        {candidate.designer.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{candidate.designer.name}</span>
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmApprove} disabled={isApproving}>
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve Selected"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dismiss Dialog */}
      <AlertDialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Recommendation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dismiss this recommendation? You can optionally provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="dismiss-reason">Reason (optional)</Label>
            <Textarea
              id="dismiss-reason"
              placeholder="Why are you dismissing this recommendation?"
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismiss} disabled={isDismissing}>
              {isDismissing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dismissing...
                </>
              ) : (
                "Dismiss"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Snooze Dialog */}
      <AlertDialog open={showSnoozeDialog} onOpenChange={setShowSnoozeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Snooze Recommendation</AlertDialogTitle>
            <AlertDialogDescription>
              When would you like to be reminded about this recommendation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="snooze-date">Snooze until</Label>
            <Input
              id="snooze-date"
              type="datetime-local"
              value={snoozeDate}
              onChange={(e) => setSnoozeDate(e.target.value)}
              className="mt-2"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSnooze} disabled={!snoozeDate || isSnoozingRecommendation}>
              {isSnoozingRecommendation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Snoozing...
                </>
              ) : (
                "Snooze"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PaginationControls({ 
  pagination, 
  onPageChange 
}: { 
  pagination: any; 
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, pagination.page - delta);
      i <= Math.min(pagination.totalPages - 1, pagination.page + delta);
      i++
    ) {
      range.push(i);
    }

    if (pagination.page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (pagination.page + delta < pagination.totalPages - 1) {
      rangeWithDots.push('...', pagination.totalPages);
    } else {
      rangeWithDots.push(pagination.totalPages);
    }

    return rangeWithDots;
  };

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        {pagination.hasPrev && (
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => onPageChange(pagination.page - 1)}
              className="cursor-pointer"
            />
          </PaginationItem>
        )}
        
        {getVisiblePages().map((page, index) => (
          <PaginationItem key={index}>
            {page === '...' ? (
              <span className="px-3 py-2">...</span>
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page as number)}
                isActive={page === pagination.page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        {pagination.hasNext && (
          <PaginationItem>
            <PaginationNext 
              onClick={() => onPageChange(pagination.page + 1)}
              className="cursor-pointer"
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ filters }: { filters: InboxFilters }) {
  const hasActiveFilters = filters.status || filters.type;
  const { data: designers, isLoading: isLoadingDesigners } = useDesigners();
  const { data: lists, isLoading: isLoadingLists } = useLists();

  // Helper function to handle pluralization
  const pluralize = (count: number, singular: string, plural?: string) => {
    return count === 1 ? singular : (plural || singular + 's');
  };

  // Don't show specific messages while data is loading
  if (isLoadingDesigners || isLoadingLists) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Sparkles className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Loading...</h3>
        <p className="text-muted-foreground">Checking your workspace data...</p>
      </div>
    );
  }

  // If filters are active, show filter-specific empty state
  if (hasActiveFilters) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Sparkles className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No recommendations match your filters</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Try adjusting your filters to see more recommendations.
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Clear Filters
        </Button>
      </div>
    );
  }

  const designerCount: number = designers?.length || 0;
  const listCount: number = lists?.length || 0;

  // Determine what's missing and show appropriate message
  const needsDesigners = designerCount < 5;
  const needsLists = listCount === 0;

  if (needsDesigners && needsLists) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Users className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Get started with your workspace</h3>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          To get AI-powered recommendations, you need at least 5 designers and 1 list in your workspace. 
          Currently you have {designerCount} {pluralize(designerCount, 'designer')} and {listCount} {pluralize(listCount, 'list')}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/directory">
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Designers
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/lists">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Create Lists
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (needsDesigners) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <UserPlus className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Need more designers for recommendations</h3>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          You currently have {designerCount} {pluralize(designerCount, 'designer')} in your workspace. 
          Add at least {5 - designerCount} more {pluralize(5 - designerCount, 'designer')} to get AI suggestions for creating new lists.
        </p>
        <Link href="/directory">
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Designers
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  if (needsLists) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Create your first list</h3>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          No lists exist yet. Create some lists first to get recommendations for adding designers to them.
          You have {designerCount} {pluralize(designerCount, 'designer')} ready to be organized.
        </p>
        <Link href="/lists">
          <Button className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Create Lists
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  // Fallback for when workspace has adequate data but no recommendations 
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <Sparkles className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No new recommendations</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Your workspace looks well organized! New recommendations will appear here as your data grows or changes.
      </p>
    </div>
  );
}

export default function InboxPage() {
  const [filters, setFilters] = useState<InboxFilters>({
    page: 1,
    limit: 10,
    sortBy: 'score',
    sortOrder: 'desc'
  });

  const { data, isLoading, error } = useInboxRecommendations(filters);
  const approveRecommendation = useApproveRecommendation();
  const dismissRecommendation = useDismissRecommendation();
  const snoozeRecommendation = useSnoozeRecommendation();
  const generateRecommendations = useGenerateRecommendations();
  const markRecommendationSeen = useMarkRecommendationSeen();

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleApprove = (id: number, selectedCandidateIds?: number[]) => {
    approveRecommendation.mutate({ id, selectedCandidateIds });
  };

  const handleDismiss = (id: number, reason?: string) => {
    dismissRecommendation.mutate({ id, reason });
  };

  const handleSnooze = (id: number, snoozeUntil: string) => {
    snoozeRecommendation.mutate({ id, snoozeUntil });
  };

  const handleGenerate = () => {
    generateRecommendations.mutate({});
  };

  const handleMarkSeen = useCallback((id: number) => {
    markRecommendationSeen.mutate(id);
  }, [markRecommendationSeen]);

  if (error) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 pt-20 pb-8">
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to load recommendations</h3>
            <p className="text-muted-foreground mb-6">
              {error.message || "Something went wrong while fetching your recommendations."}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 pt-20 pb-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inbox</h1>
            <p className="text-muted-foreground">
              AI-powered recommendations to improve your workspace
            </p>
          </div>
          {data && data.pagination.total > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(data.pagination.total, data.pagination.limit)} of {data.pagination.total} recommendations
            </div>
          )}
        </div>

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onGenerate={handleGenerate}
          isGenerating={generateRecommendations.isPending}
        />

        {isLoading ? (
          <LoadingSkeleton />
        ) : !data?.recommendations.length ? (
          <EmptyState filters={filters} />
        ) : (
          <>
            <div className="space-y-6">
              {data.recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onApprove={handleApprove}
                  onDismiss={handleDismiss}
                  onSnooze={handleSnooze}
                  onMarkSeen={handleMarkSeen}
                  isApproving={approveRecommendation.isPending}
                  isDismissing={dismissRecommendation.isPending}
                  isSnoozingRecommendation={snoozeRecommendation.isPending}
                />
              ))}
            </div>

            <PaginationControls
              pagination={data.pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}