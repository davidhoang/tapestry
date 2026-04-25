import { useState, useEffect } from "react";
import { useActivities, WorkspaceActivity } from "@/hooks/use-activities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  List, 
  Users, 
  LogIn, 
  LogOut, 
  Search,
  Activity,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mail
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 20;

function getActivityIcon(activityType: string) {
  switch (activityType) {
    case 'designer_added':
      return <UserPlus className="h-4 w-4 text-green-600" />;
    case 'designer_updated':
      return <Edit className="h-4 w-4 text-blue-600" />;
    case 'designer_deleted':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'list_created':
      return <List className="h-4 w-4 text-purple-600" />;
    case 'list_updated':
      return <Edit className="h-4 w-4 text-blue-600" />;
    case 'list_deleted':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'designer_added_to_list':
      return <Users className="h-4 w-4 text-indigo-600" />;
    case 'invitation_sent':
      return <Mail className="h-4 w-4 text-blue-600" />;
    case 'member_joined':
      return <LogIn className="h-4 w-4 text-green-600" />;
    case 'member_left':
      return <LogOut className="h-4 w-4 text-orange-600" />;
    case 'search_saved':
      return <Search className="h-4 w-4 text-gray-600" />;
    case 'search_deleted':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    default:
      return <Activity className="h-4 w-4 text-gray-600" />;
  }
}

function getActivityDescription(activity: WorkspaceActivity): string {
  const entityName = activity.entityName || 'an item';
  
  switch (activity.activityType) {
    case 'designer_added':
      return `added ${entityName} to the directory`;
    case 'designer_updated':
      return `updated ${entityName}'s profile`;
    case 'designer_deleted':
      return `removed ${entityName} from the directory`;
    case 'list_created':
      return `created the list "${entityName}"`;
    case 'list_updated':
      return `updated the list "${entityName}"`;
    case 'list_deleted':
      return `deleted the list "${entityName}"`;
    case 'designer_added_to_list':
      const designerName = activity.metadata?.designerName || 'a designer';
      return `added ${designerName} to the list "${entityName}"`;
    case 'invitation_sent':
      const invitedEmail = activity.metadata?.invitedEmail || entityName;
      return `invited ${invitedEmail} to the workspace`;
    case 'member_joined':
      return `joined the workspace`;
    case 'member_left':
      return `left the workspace`;
    case 'search_saved':
      return `saved a search`;
    case 'search_deleted':
      return `deleted saved search "${entityName}"`;
    default:
      return `performed an action`;
  }
}

function ActivityItem({ activity }: { activity: WorkspaceActivity }) {
  const userInitials = activity.user.username 
    ? activity.user.username.substring(0, 2).toUpperCase()
    : activity.user.email.substring(0, 2).toUpperCase();
  
  const userName = activity.user.username || activity.user.email.split('@')[0];
  
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={activity.user.profilePhotoUrl || undefined} />
        <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getActivityIcon(activity.activityType)}
          <p className="text-sm">
            <span className="font-medium">{userName}</span>{" "}
            <span className="text-muted-foreground">{getActivityDescription(activity)}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 border-b">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  workspaceSlug?: string;
  compact?: boolean;
}

export default function ActivityFeed({ workspaceSlug, compact = false }: ActivityFeedProps) {
  const [allActivities, setAllActivities] = useState<WorkspaceActivity[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { data, isLoading, isFetching, isError, error, refetch } = useActivities(workspaceSlug, ITEMS_PER_PAGE, cursor);

  useEffect(() => {
    if (data) {
      if (cursor === null) {
        setAllActivities(data.activities);
      } else {
        setAllActivities(prev => {
          const combined = [...prev, ...data.activities];
          const uniqueMap = new Map();
          combined.forEach(activity => uniqueMap.set(activity.id, activity));
          return Array.from(uniqueMap.values()).sort(
            (a, b) => b.id - a.id
          );
        });
      }
      setHasMore(data.hasMore);
    }
  }, [data, cursor]);

  useEffect(() => {
    setAllActivities([]);
    setCursor(null);
    setHasMore(true);
  }, [workspaceSlug]);

  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  if (compact) {
    if (isError) {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-destructive">Failed to load activity</p>
          <Button variant="ghost" size="sm" onClick={handleRetry} className="mt-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        {isLoading ? (
          <>
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
          </>
        ) : allActivities && allActivities.length > 0 ? (
          allActivities.slice(0, 5).map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No activity yet
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error?.message || "Failed to load activities"}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : isLoading && allActivities.length === 0 ? (
          <div className="space-y-1">
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
          </div>
        ) : allActivities && allActivities.length > 0 ? (
          <>
            <div className="space-y-1">
              {allActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Actions like adding designers and creating lists will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
