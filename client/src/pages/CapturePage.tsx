import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Loader2, 
  Upload, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  Cog,
  X
} from "lucide-react";
import { formatDistance } from "date-fns";

interface CaptureAsset {
  id: number;
  entryId: number;
  storageUrl: string;
  originalFilename?: string;
  assetType: string;
  mimeType?: string;
  fileSize?: number;
  createdAt: string;
}

interface CaptureEntry {
  id: number;
  workspaceId: number;
  creatorId: number;
  contentType: 'text' | 'email' | 'upload';
  contentRaw?: string;
  status: 'pending' | 'processing' | 'processed' | 'error';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  assets: CaptureAsset[];
  creator: {
    id: number;
    email: string;
    username?: string;
    profilePhotoUrl?: string;
  };
}

function useCaptureEntries() {
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return useQuery<CaptureEntry[]>({
    queryKey: ['/api/capture', workspaceSlug],
    meta: {
      headers: { 'x-workspace-slug': workspaceSlug },
    },
  });
}

function useCreateCapture() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { content?: string; contentType: string; file?: File }) => {
      const formData = new FormData();
      formData.append('contentType', data.contentType);
      if (data.content) {
        formData.append('content', data.content);
      }
      if (data.file) {
        formData.append('file', data.file);
      }
      
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: {
          'x-workspace-slug': workspaceSlug,
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create capture entry');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/capture', workspaceSlug] });
      toast({
        title: "Success",
        description: "Capture entry created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create capture entry",
        variant: "destructive",
      });
    },
  });
}

function useDeleteCapture() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/capture/${id}`, {
        method: 'DELETE',
        headers: {
          'x-workspace-slug': workspaceSlug,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/capture', workspaceSlug] });
      toast({
        title: "Success",
        description: "Capture entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete capture entry",
        variant: "destructive",
      });
    },
  });
}

function getStatusBadge(status: CaptureEntry['status']) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-blue-500">
          <Cog className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case 'processed':
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          Processed
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getContentTypeIcon(contentType: CaptureEntry['contentType']) {
  switch (contentType) {
    case 'text':
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    case 'email':
      return <LinkIcon className="h-4 w-4 text-muted-foreground" />;
    case 'upload':
      return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

interface CaptureCardProps {
  entry: CaptureEntry;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

function CaptureCard({ entry, onDelete, isDeleting }: CaptureCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const contentPreview = entry.contentRaw 
    ? entry.contentRaw.substring(0, 200) + (entry.contentRaw.length > 200 ? '...' : '')
    : null;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={entry.creator.profilePhotoUrl || ""} />
                <AvatarFallback className="text-xs">
                  {entry.creator.email?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {getContentTypeIcon(entry.contentType)}
                  <span className="text-sm font-medium capitalize">{entry.contentType}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(new Date(entry.createdAt), new Date(), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(entry.status)}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contentPreview && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {contentPreview}
            </p>
          )}
          {entry.assets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.assets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="relative rounded-lg overflow-hidden border bg-muted w-24 h-24"
                >
                  <img 
                    src={asset.storageUrl} 
                    alt={asset.originalFilename || 'Capture'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          {entry.errorMessage && (
            <p className="mt-2 text-sm text-destructive">{entry.errorMessage}</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Capture Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this capture entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(entry.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CaptureForm({ onSubmit, isSubmitting }: { onSubmit: (data: { content?: string; contentType: string; file?: File }) => void; isSubmitting: boolean }) {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitText = useCallback(() => {
    if (!content.trim()) return;
    onSubmit({ content: content.trim(), contentType: 'text' });
    setContent('');
  }, [content, onSubmit]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleFileUpload = useCallback(() => {
    if (!selectedFile) return;
    onSubmit({ contentType: 'upload', file: selectedFile });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFile, onSubmit]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add New Capture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Text Content</label>
          <Textarea
            placeholder="Paste links, notes, or any text content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
            disabled={isSubmitting}
          />
          <Button 
            onClick={handleSubmitText} 
            disabled={!content.trim() || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Text
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Upload Screenshot/Image</label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              disabled={isSubmitting}
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop an image here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPEG, PNG, WebP (max 5MB)
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <ImageIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                onClick={handleFileUpload}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Upload
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CaptureSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

export default function CapturePage() {
  const { data: entries, isLoading, error } = useCaptureEntries();
  const createCapture = useCreateCapture();
  const deleteCapture = useDeleteCapture();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = useCallback((data: { content?: string; contentType: string; file?: File }) => {
    createCapture.mutate(data);
  }, [createCapture]);

  const handleDelete = useCallback((id: number) => {
    setDeletingId(id);
    deleteCapture.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  }, [deleteCapture]);

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const isPermissionError = errorMessage.includes('Permission denied') || errorMessage.includes('403');
    
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 pt-20 pb-8">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">
                {isPermissionError ? 'Access Denied' : 'Error Loading Captures'}
              </h2>
              <p className="text-muted-foreground">
                {isPermissionError 
                  ? 'You need editor or admin permissions to access the Capture feature.'
                  : errorMessage
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 pt-20 pb-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Capture</h1>
            <p className="text-muted-foreground mt-1">
              Collect raw content for AI processing
            </p>
          </div>
        </div>

        <CaptureForm onSubmit={handleCreate} isSubmitting={createCapture.isPending} />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Captures</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              <CaptureSkeleton />
              <CaptureSkeleton />
              <CaptureSkeleton />
            </div>
          ) : entries && entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry) => (
                <CaptureCard 
                  key={entry.id} 
                  entry={entry} 
                  onDelete={handleDelete}
                  isDeleting={deletingId === entry.id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No captures yet</h3>
                <p className="text-muted-foreground">
                  Add your first capture using the form above.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}