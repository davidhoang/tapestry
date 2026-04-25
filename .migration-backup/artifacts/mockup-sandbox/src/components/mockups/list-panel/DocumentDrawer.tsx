import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  X,
  Pencil,
  Plus,
  Copy,
  Download,
  Globe,
  Loader2,
} from "lucide-react";

interface Designer {
  id: number;
  name: string;
  title: string;
  photoUrl: string;
  notes?: string;
}

const stubDesigners: Designer[] = [
  {
    id: 1,
    name: "Sarah Chen",
    title: "Senior Product Designer · Spotify",
    photoUrl: "",
    notes: "Strong systems thinker. Led the Spotify Blend feature redesign.",
  },
  {
    id: 2,
    name: "Marcus Lee",
    title: "Lead UX Designer · Airbnb",
    photoUrl: "",
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    title: "Staff Designer · Figma",
    photoUrl: "",
    notes: "FigJam creator. Great at cross-functional collaboration.",
  },
  {
    id: 4,
    name: "James Okafor",
    title: "Design Director · Stripe",
    photoUrl: "",
  },
  {
    id: 5,
    name: "Priya Sharma",
    title: "Principal Designer · Linear",
    photoUrl: "",
    notes: "Minimalist craft. Perfect for the new dashboard project.",
  },
];

const listData = {
  name: "Q2 Design Leadership",
  description: "Top senior and staff-level designers for the product org expansion.",
  isPublic: true,
  shareUrl: "https://app.example.com/lists/q2-design-leadership",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export default function DocumentDrawer() {
  const [open, setOpen] = useState(true);
  const [editingNotesFor, setEditingNotesFor] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [isPublic, setIsPublic] = useState(listData.isPublic);
  const [saving, setSaving] = useState(false);
  const [designers, setDesigners] = useState(stubDesigners);

  const handleSaveNotes = (designerId: number) => {
    setSaving(true);
    setTimeout(() => {
      setDesigners((prev) =>
        prev.map((d) =>
          d.id === designerId ? { ...d, notes: notesValue } : d,
        ),
      );
      setEditingNotesFor(null);
      setNotesValue("");
      setSaving(false);
    }, 400);
  };

  const handleStartEdit = (designerId: number, currentNotes?: string) => {
    setEditingNotesFor(designerId);
    setNotesValue(currentNotes || "");
  };

  if (!open) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Button onClick={() => setOpen(true)}>Open Document Drawer</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative font-sans">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => setOpen(false)}
      />

      <div className="absolute top-0 right-0 h-full w-[420px] bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent px-6 pt-6 pb-5">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-black/10 transition-colors"
          >
            <X className="h-4 w-4 text-foreground/70" />
          </button>
          <h2 className="text-2xl font-semibold tracking-tight pr-8">
            {listData.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {listData.description}
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            {designers.length} designer{designers.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {designers.map((designer) => (
              <div
                key={designer.id}
                className="group rounded-lg border border-border/50 bg-card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={designer.photoUrl} />
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {getInitials(designer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight cursor-pointer hover:underline">
                      {designer.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {designer.title}
                    </p>
                  </div>
                </div>

                {editingNotesFor === designer.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add notes about this designer..."
                      className="min-h-[72px] text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleSaveNotes(designer.id)}
                        disabled={saving}
                      >
                        {saving && (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingNotesFor(null);
                          setNotesValue("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : designer.notes ? (
                  <div className="mt-2.5 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
                    <p>{designer.notes}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1.5 h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => handleStartEdit(designer.id, designer.notes)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 px-2 text-[11px] text-muted-foreground"
                    onClick={() => handleStartEdit(designer.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add notes
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t mt-6 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Share via URL</span>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            {isPublic && (
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={listData.shareUrl}
                  className="font-mono text-xs h-8"
                />
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
