import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, MoreVertical, Users, Building, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

interface Designer {
  id: number;
  name: string;
  title: string;
  company?: string;
  location?: string;
  photoUrl?: string;
  level: string;
  skills: string[];
}

interface RecruitingCard {
  id: number;
  columnId: number;
  designerId: number;
  position: number;
  notes?: string;
  designer: Designer;
}

interface RecruitingColumn {
  id: number;
  name: string;
  position: number;
  color?: string;
}

interface AddDesignersData {
  designerIds?: number[];
  listId?: number;
}

function KanbanCard({ card, isDragging }: { card: RecruitingCard; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        {card.designer.photoUrl ? (
          <img
            src={`/api/uploads/${card.designer.photoUrl}`}
            alt={card.designer.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {card.designer.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{card.designer.name}</h4>
          <p className="text-xs text-gray-600 truncate">{card.designer.title}</p>
          {card.designer.company && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Building className="w-3 h-3" />
              {card.designer.company}
            </p>
          )}
          {card.designer.location && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {card.designer.location}
            </p>
          )}
        </div>
      </div>
      {card.notes && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{card.notes}</p>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  cards,
  onAddClick,
  onDeleteColumn,
}: {
  column: RecruitingColumn;
  cards: RecruitingCard[];
  onAddClick: () => void;
  onDeleteColumn: () => void;
}) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'Column', column },
  });

  return (
    <div 
      ref={setDroppableRef}
      className={`flex flex-col rounded-lg p-4 w-80 min-h-[500px] transition-colors ${
        isOver ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {column.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
          )}
          <h3 className="font-semibold text-gray-900">{column.name}</h3>
          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add designers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDeleteColumn} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto">
        <SortableContext
          items={cards.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
        
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Users className="h-8 w-8 mb-2" />
            <p className="text-sm">No designers yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddClick}
              className="mt-2"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add designers
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecruitingPage() {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#6B7280");
  const [selectedDesigners, setSelectedDesigners] = useState<number[]>([]);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch columns
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ["/api/recruiting/columns"],
    queryFn: async () => {
      const res = await fetch("/api/recruiting/columns", {
        credentials: "include",
        headers: {
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch columns");
      return res.json();
    },
  });

  // Fetch cards
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/recruiting/cards"],
    queryFn: async () => {
      const res = await fetch("/api/recruiting/cards", {
        credentials: "include",
        headers: {
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch cards");
      return res.json();
    },
  });

  // Fetch designers for add dialog
  const { data: allDesigners = [] } = useQuery({
    queryKey: ["/api/designers"],
    queryFn: async () => {
      const res = await fetch("/api/designers", {
        credentials: "include",
        headers: {
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch designers");
      return res.json();
    },
    enabled: showAddDialog,
  });

  // Fetch lists for add dialog
  const { data: allLists = [] } = useQuery({
    queryKey: ["/api/lists"],
    queryFn: async () => {
      const res = await fetch("/api/lists", {
        credentials: "include",
        headers: {
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
    enabled: showAddDialog,
  });

  // Initialize board mutation
  const initializeBoardMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/recruiting/initialize", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
      });
      if (!res.ok) throw new Error("Failed to initialize board");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiting/columns"] });
      toast({
        title: "Board initialized",
        description: "Default columns have been created",
      });
    },
  });

  // Create column mutation
  const createColumnMutation = useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const res = await fetch("/api/recruiting/columns", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create column");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiting/columns"] });
      setShowNewColumnDialog(false);
      setNewColumnName("");
      toast({
        title: "Column created",
        description: "New column has been added to the board",
      });
    },
  });

  // Delete column mutation
  const deleteColumnMutation = useMutation({
    mutationFn: async (columnId: number) => {
      const res = await fetch(`/api/recruiting/columns/${columnId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
      });
      if (!res.ok) throw new Error("Failed to delete column");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiting/columns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruiting/cards"] });
      toast({
        title: "Column deleted",
        description: "Column and its cards have been removed",
      });
    },
  });

  // Add designers mutation
  const addDesignersMutation = useMutation({
    mutationFn: async (data: { columnId: number } & AddDesignersData) => {
      const res = await fetch("/api/recruiting/cards/bulk", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add designers");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiting/cards"] });
      setShowAddDialog(false);
      setSelectedDesigners([]);
      setSelectedList(null);
      toast({
        title: "Designers added",
        description: `Added ${data.added} designers to the board${data.skipped > 0 ? ` (${data.skipped} already on board)` : ''}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Move card mutation
  const moveCardMutation = useMutation({
    mutationFn: async (data: { cardId: number; columnId: number; position: number }) => {
      const res = await fetch(`/api/recruiting/cards/${data.cardId}/move`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
        body: JSON.stringify({
          columnId: data.columnId,
          position: data.position,
        }),
      });
      if (!res.ok) throw new Error("Failed to move card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiting/cards"] });
    },
  });

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      const res = await fetch(`/api/recruiting/cards/${cardId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-workspace-slug": localStorage.getItem("currentWorkspace") || "",
        },
      });
      if (!res.ok) throw new Error("Failed to delete card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiting/cards"] });
      toast({
        title: "Designer removed",
        description: "Designer has been removed from the board",
      });
    },
  });

  // Initialize board if no columns exist
  useEffect(() => {
    if (!columnsLoading && columns.length === 0) {
      initializeBoardMutation.mutate();
    }
  }, [columns, columnsLoading]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (!over || !active) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    if (activeData?.type === "Card") {
      const activeCard = activeData.card as RecruitingCard;
      
      if (overData?.type === "Card") {
        const overCard = overData.card as RecruitingCard;
        
        if (activeCard.id !== overCard.id) {
          // Reorder within same column or move to different column
          moveCardMutation.mutate({
            cardId: activeCard.id,
            columnId: overCard.columnId,
            position: overCard.position,
          });
        }
      } else if (overData?.type === "Column") {
        const overColumn = overData.column as RecruitingColumn;
        
        if (activeCard.columnId !== overColumn.id) {
          // Moving to different column - place at end
          const columnCards = cards.filter(c => c.columnId === overColumn.id);
          const newPosition = Math.max(...columnCards.map(c => c.position), 0) + 1;
          
          moveCardMutation.mutate({
            cardId: activeCard.id,
            columnId: overColumn.id,
            position: newPosition,
          });
        }
      }
    }
  };

  const activeCard = activeId ? cards.find((c: RecruitingCard) => c.id === activeId) : null;

  // Filter designers not already on board
  const availableDesigners = allDesigners.filter(
    (designer: Designer) => !cards.some((card: RecruitingCard) => card.designerId === designer.id)
  );

  const handleAddDesigners = () => {
    if (!selectedColumn) return;
    
    if (selectedList) {
      addDesignersMutation.mutate({
        columnId: selectedColumn,
        listId: selectedList,
      });
    } else if (selectedDesigners.length > 0) {
      addDesignersMutation.mutate({
        columnId: selectedColumn,
        designerIds: selectedDesigners,
      });
    }
  };

  if (columnsLoading || cardsLoading) {
    return (
      <div>
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Recruiting</h1>
            <Button onClick={() => setShowNewColumnDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add column
            </Button>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 min-w-max">
                {columns
                  .sort((a: RecruitingColumn, b: RecruitingColumn) => a.position - b.position)
                  .map((column: RecruitingColumn) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      cards={cards.filter((c: RecruitingCard) => c.columnId === column.id)}
                      onAddClick={() => {
                        setSelectedColumn(column.id);
                        setShowAddDialog(true);
                      }}
                      onDeleteColumn={() => deleteColumnMutation.mutate(column.id)}
                    />
                  ))}
              </div>
              
              <DragOverlay>
                {activeCard && <KanbanCard card={activeCard} isDragging />}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Add designers dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add designers to recruiting board</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="designers" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="designers">Individual designers</TabsTrigger>
              <TabsTrigger value="lists">Entire list</TabsTrigger>
            </TabsList>
            
            <TabsContent value="designers" className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableDesigners.map((designer: Designer) => (
                  <label
                    key={designer.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDesigners.includes(designer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDesigners([...selectedDesigners, designer.id]);
                          setSelectedList(null);
                        } else {
                          setSelectedDesigners(selectedDesigners.filter(id => id !== designer.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{designer.name}</div>
                      <div className="text-sm text-gray-600">{designer.title}</div>
                      {designer.company && (
                        <div className="text-sm text-gray-500">{designer.company}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              
              {selectedDesigners.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedDesigners.length} designer{selectedDesigners.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button onClick={handleAddDesigners}>
                    Add to board
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="lists" className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {allLists.map((list: any) => (
                  <label
                    key={list.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="list"
                      checked={selectedList === list.id}
                      onChange={() => {
                        setSelectedList(list.id);
                        setSelectedDesigners([]);
                      }}
                      className="rounded-full border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{list.name}</div>
                      {list.description && (
                        <div className="text-sm text-gray-600">{list.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              
              {selectedList && (
                <div className="flex justify-end">
                  <Button onClick={handleAddDesigners}>
                    Add entire list to board
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* New column dialog */}
      <Dialog open={showNewColumnDialog} onOpenChange={setShowNewColumnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new column</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Column name</label>
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="e.g., Phone Screen"
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-2">
                {["#6B7280", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444"].map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${newColumnColor === color ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColumnColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewColumnDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createColumnMutation.mutate({ name: newColumnName, color: newColumnColor })}
                disabled={!newColumnName}
              >
                Create column
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}