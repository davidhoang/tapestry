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
  StickyNote,
  ChevronRight,
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

export default function CRMSidebar() {
  const [open, setOpen] = useState(true);
  const [editingNotesFor, setEditingNotesFor] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [isPublic, setIsPublic] = useState(listData.isPublic);
  const [saving, setSaving] = useState(false);
  const [designers, setDesigners] = useState(stubDesigners);
  const [expandedNotes, setExpandedNotes] = useState<number | null>(null);

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
    setExpandedNotes(null);
    setNotesValue(currentNotes || "");
  };

  if (!open) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Button onClick={() => setOpen(true)}>Open CRM Sidebar</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex font-sans bg-muted/30">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-2 gap-4 max-w-md w-full opacity-40">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border rounded-lg h-32 flex items-center justify-center text-xs text-muted-foreground">
              List Card {i}
            </div>
          ))}
        </div>
      </div>

      <div className="w-[380px] h-full bg-background border-l flex flex-col shrink-0">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight">
                {listData.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {listData.description}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-muted transition-colors ml-2 mt-0.5"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-end gap-3">
            <div>
              <span className="text-4xl font-bold tabular-nums text-primary">
                {designers.length}
              </span>
              <span className="text-sm text-muted-foreground ml-1.5">
                designers
              </span>
            </div>
            <div className="flex -space-x-1.5 mb-1.5">
              {designers.slice(0, 4).map((d) => (
                <Avatar key={d.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={d.photoUrl} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {getInitials(d.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {designers.length > 4 && (
                <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                  +{designers.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t" />

        <div className="flex-1 overflow-y-auto">
          {designers.map((designer) => (
            <div
              key={designer.id}
              className="group border-b last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 px-5 py-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={designer.photoUrl} />
                  <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
                    {getInitials(designer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate cursor-pointer hover:underline">
                    {designer.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {designer.title}
                  </p>
                  {editingNotesFor !== designer.id && (
                    <div className="mt-1 flex items-center gap-1.5">
                      {designer.notes ? (
                        <span
                          className="text-[11px] text-muted-foreground truncate max-w-[200px] cursor-pointer hover:text-foreground"
                          onClick={() =>
                            setExpandedNotes(
                              expandedNotes === designer.id ? null : designer.id,
                            )
                          }
                        >
                          <StickyNote className="h-3 w-3 inline mr-1 -mt-0.5" />
                          {designer.notes}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 italic">
                          No notes yet
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!designer.notes && editingNotesFor !== designer.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleStartEdit(designer.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
              </div>

              {expandedNotes === designer.id && designer.notes && editingNotesFor !== designer.id && (
                <div className="px-5 pb-3 pt-0">
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2.5 leading-relaxed">
                    {designer.notes}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] mt-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => handleStartEdit(designer.id, designer.notes)}
                    >
                      <Pencil className="h-2.5 w-2.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}

              {editingNotesFor === designer.id && (
                <div className="px-5 pb-3 pt-0 space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes..."
                    className="min-h-[60px] text-xs resize-none"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="h-6 text-[11px] px-2.5"
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
                      className="h-6 text-[11px] px-2.5"
                      onClick={() => {
                        setEditingNotesFor(null);
                        setNotesValue("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t px-5 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Public link</span>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          {isPublic && (
            <div className="flex items-center gap-1.5">
              <Input
                readOnly
                value={listData.shareUrl}
                className="font-mono text-[10px] h-7"
              />
              <Button variant="outline" size="icon" className="h-7 w-7 shrink-0">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full h-7 text-[11px]">
            <Download className="h-3 w-3 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
