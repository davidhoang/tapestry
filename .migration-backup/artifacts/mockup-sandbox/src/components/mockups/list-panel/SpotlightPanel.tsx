import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Pencil,
  Plus,
  Copy,
  Download,
  Globe,
  Loader2,
  Users,
  Info,
  ExternalLink,
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
  createdAt: "Mar 2, 2026",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

const COLORS = [
  "bg-amber-100 text-amber-800",
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
];

export default function SpotlightPanel() {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "members">("members");
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
        <Button onClick={() => setOpen(true)}>Open Spotlight Panel</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative font-sans bg-muted/20">
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="grid grid-cols-3 gap-4 max-w-lg w-full opacity-30">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border rounded-lg h-24 flex items-center justify-center text-xs text-muted-foreground">
              Card {i}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-4 right-4 bottom-4 w-[400px] bg-background rounded-xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {listData.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {listData.description}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors ml-3 -mt-0.5"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center -space-x-2.5 mb-4">
            {designers.slice(0, 5).map((d, i) => (
              <Avatar
                key={d.id}
                className="h-9 w-9 border-[2.5px] border-background ring-0"
                style={{ zIndex: designers.length - i }}
              >
                <AvatarImage src={d.photoUrl} />
                <AvatarFallback
                  className={`text-[10px] font-semibold ${COLORS[i % COLORS.length]}`}
                >
                  {getInitials(d.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {designers.length > 5 && (
              <div
                className="h-9 w-9 rounded-full border-[2.5px] border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground"
                style={{ zIndex: 0 }}
              >
                +{designers.length - 5}
              </div>
            )}
            <span className="text-xs text-muted-foreground pl-3 font-medium">
              {designers.length} member{designers.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex border rounded-lg p-0.5 bg-muted/40">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                activeTab === "overview"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                activeTab === "members"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Members
            </button>
          </div>
        </div>

        <div className="border-t" />

        <div className="flex-1 overflow-y-auto">
          {activeTab === "overview" ? (
            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  List Details
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{listData.createdAt}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-medium">{designers.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Visibility</span>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Notes added</span>
                    <span className="font-medium">
                      {designers.filter((d) => d.notes).length} / {designers.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-5 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sharing
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">Public link</span>
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
                      className="font-mono text-[10px] h-8"
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-5 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </h3>
                <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export as CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <div className="space-y-1">
                {designers.map((designer) => (
                  <div
                    key={designer.id}
                    className="group rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <Avatar className="h-9 w-9 shrink-0">
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
                      </div>
                      {!designer.notes && editingNotesFor !== designer.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={() => handleStartEdit(designer.id)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {editingNotesFor === designer.id ? (
                      <div className="px-3 pb-3 space-y-2">
                        <Textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add notes..."
                          className="min-h-[64px] text-xs resize-none"
                        />
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-3"
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
                            className="h-7 text-[11px] px-3"
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
                      <div className="px-3 pb-3">
                        <div className="ml-12 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5 leading-relaxed">
                          {designer.notes}
                          <div className="mt-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                handleStartEdit(designer.id, designer.notes)
                              }
                            >
                              <Pencil className="h-2.5 w-2.5 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 pb-2">
                        <p className="ml-12 text-[10px] text-muted-foreground/50 italic">
                          No notes yet
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3 flex items-center gap-2 shrink-0 bg-muted/20">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            {isPublic && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[11px] shrink-0">
            <Download className="h-3 w-3 mr-1.5" />
            CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
