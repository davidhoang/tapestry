import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Sparkles, Loader2 } from "lucide-react";

interface DraftMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendationId: number;
  designerName: string;
  workspaceSlug: string;
  onDone: () => void;
}

interface DraftResponse {
  subject: string;
  body: string;
  designerName: string;
}

export default function DraftMessageModal({
  open,
  onOpenChange,
  recommendationId,
  designerName,
  workspaceSlug,
  onDone,
}: DraftMessageModalProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(
        `/api/home/recommendations/${recommendationId}/draft-message`,
        { method: "POST", workspaceSlug }
      ) as Promise<DraftResponse>;
    },
    onSuccess: (data) => {
      setSubject(data.subject);
      setBody(`Hi ${data.designerName},\n\n${data.body}`);
      setGenerated(true);
    },
    onError: () => {
      toast({ title: "Couldn't generate draft", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && !generated && !generateMutation.isPending) {
      generateMutation.mutate();
    }
    if (!isOpen) {
      setGenerated(false);
      setSubject("");
      setBody("");
    }
    onOpenChange(isOpen);
  };

  const copyToClipboard = async (text: string, type: "subject" | "body") => {
    await navigator.clipboard.writeText(text);
    if (type === "subject") {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  const handleDone = () => {
    onDone();
    handleOpen(false);
  };

  const isLoading = generateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Draft outreach for {designerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {isLoading ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Message</Label>
                <Skeleton className="h-48 w-full" />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Writing a personalised draft...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject" className="text-xs text-muted-foreground">Subject</Label>
                  <button
                    onClick={() => copyToClipboard(subject, "subject")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedSubject ? (
                      <><Check className="h-3 w-3 text-green-600" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy</>
                    )}
                  </button>
                </div>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body" className="text-xs text-muted-foreground">Message</Label>
                  <button
                    onClick={() => copyToClipboard(body, "body")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedBody ? (
                      <><Check className="h-3 w-3 text-green-600" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy</>
                    )}
                  </button>
                </div>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[180px] text-sm resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={() => {
                  setGenerated(false);
                  generateMutation.mutate();
                }}
                className="text-xs text-primary hover:underline"
              >
                Regenerate draft
              </button>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDone}
            disabled={isLoading}
          >
            Mark as sent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
