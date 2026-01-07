import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Activity, 
  Send, 
  Trash2, 
  Pin,
  PinOff,
  Sparkles,
  UserPlus,
  UserMinus,
  Mail,
  Image,
  Edit3,
  Clock,
  MoreHorizontal
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { 
  useDesignerTimeline, 
  useCreateDesignerNote, 
  useUpdateDesignerNote,
  useDeleteDesignerNote,
  type TimelineItem 
} from "@/hooks/use-designer-timeline";
import { formatDistanceToNow, format } from "date-fns";

interface DesignerTimelineProps {
  designerId: number;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  profile_created: <UserPlus className="h-4 w-4" />,
  profile_updated: <Edit3 className="h-4 w-4" />,
  enrichment_applied: <Sparkles className="h-4 w-4" />,
  added_to_list: <UserPlus className="h-4 w-4" />,
  removed_from_list: <UserMinus className="h-4 w-4" />,
  outreach_sent: <Mail className="h-4 w-4" />,
  availability_changed: <Clock className="h-4 w-4" />,
  skills_updated: <Edit3 className="h-4 w-4" />,
  note_added: <MessageSquare className="h-4 w-4" />,
  photo_updated: <Image className="h-4 w-4" />,
};

const EVENT_COLORS: Record<string, string> = {
  profile_created: "bg-green-100 text-green-700",
  profile_updated: "bg-blue-100 text-blue-700",
  enrichment_applied: "bg-purple-100 text-purple-700",
  added_to_list: "bg-emerald-100 text-emerald-700",
  removed_from_list: "bg-orange-100 text-orange-700",
  outreach_sent: "bg-cyan-100 text-cyan-700",
  availability_changed: "bg-yellow-100 text-yellow-700",
  skills_updated: "bg-indigo-100 text-indigo-700",
  note_added: "bg-slate-100 text-slate-700",
  photo_updated: "bg-pink-100 text-pink-700",
};

const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  mcp: "MCP Integration",
  api: "API",
  import: "Import",
  system: "System",
};

export default function DesignerTimeline({ designerId }: DesignerTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'notes' | 'activity'>('all');
  const [newNote, setNewNote] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error } = useDesignerTimeline(designerId, filter);
  const createNote = useCreateDesignerNote();
  const updateNote = useUpdateDesignerNote();
  const deleteNote = useDeleteDesignerNote();

  const handleSubmitNote = async () => {
    if (!newNote.trim()) return;

    try {
      await createNote.mutateAsync({
        designerId,
        content: newNote.trim(),
        contentPlain: newNote.trim(),
      });
      setNewNote("");
      toast({
        title: "Note added",
        description: "Your note has been added to the timeline.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const handleTogglePin = async (noteId: number, currentlyPinned: boolean) => {
    try {
      await updateNote.mutateAsync({
        designerId,
        noteId,
        isPinned: !currentlyPinned,
      });
      toast({
        title: currentlyPinned ? "Note unpinned" : "Note pinned",
        description: currentlyPinned 
          ? "The note has been unpinned." 
          : "The note has been pinned to the top.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;

    try {
      await deleteNote.mutateAsync({
        designerId,
        noteId: deleteNoteId,
      });
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive",
      });
    } finally {
      setDeleteNoteId(null);
    }
  };

  const getInitials = (email: string | null, username: string | null) => {
    if (username) return username.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "??";
  };

  const renderTimelineItem = (item: TimelineItem) => {
    if (item.type === 'note') {
      return (
        <Card key={item.id} className={`${item.isPinned ? 'border-primary/50 bg-primary/5' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={item.author?.profilePhotoUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(item.author?.email || null, item.author?.username || null)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {item.author?.username || item.author?.email?.split('@')[0] || 'Unknown'}
                    </span>
                    {item.isPinned && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTogglePin(item.noteId, item.isPinned)}>
                          {item.isPinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin note
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-2" />
                              Pin note
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteNoteId(item.noteId)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {item.contentPlain || item.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (item.type === 'event') {
      const eventColor = EVENT_COLORS[item.eventType] || "bg-gray-100 text-gray-700";
      const eventIcon = EVENT_ICONS[item.eventType] || <Activity className="h-4 w-4" />;

      return (
        <div key={item.id} className="flex items-start gap-3 py-3 px-2">
          <div className={`p-2 rounded-full ${eventColor}`}>
            {eventIcon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-foreground">
                {item.summary}
              </span>
              <Badge variant="outline" className="text-xs">
                {SOURCE_LABELS[item.source] || item.source}
              </Badge>
            </div>
            
            {item.details && Object.keys(item.details).length > 0 && item.details.changedFields && (
              <div className="mt-1 text-xs text-muted-foreground">
                Changed: {item.details.changedFields.join(', ')}
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              {item.actor && (
                <span className="text-xs text-muted-foreground">
                  by {item.actor.username || item.actor.email?.split('@')[0] || 'Unknown'}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load timeline. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity & Notes</h2>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              All
              {data?.pagination && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">
                  {data.pagination.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Notes
              {data?.pagination && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">
                  {data.pagination.totalNotes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity
              {data?.pagination && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">
                  {data.pagination.totalEvents}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this designer..."
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmitNote();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              Press Cmd/Ctrl + Enter to submit
            </span>
            <Button 
              onClick={handleSubmitNote} 
              disabled={!newNote.trim() || createNote.isPending}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {createNote.isPending ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : data?.timeline && data.timeline.length > 0 ? (
          <>
            {data.timeline
              .sort((a, b) => {
                if (a.type === 'note' && b.type === 'note') {
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map(renderTimelineItem)}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No activity yet</p>
            <p className="text-sm mt-1">
              Add notes to track interactions with this designer
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={deleteNoteId !== null} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
