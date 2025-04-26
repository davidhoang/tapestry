import { useState } from "react";
import {
  useLists,
  useCreateList,
  useDeleteList,
  useUpdateList,
  useAddDesignersToList,
} from "@/hooks/use-lists";
import { useDesigners } from "@/hooks/use-designers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Trash, Mail, Pencil, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectDesigner, SelectList } from "@db/schema";
import { UserPlus } from "lucide-react";

function DesignerSelect({
  onSelect,
}: {
  onSelect: (designerId: number) => void;
}) {
  const { data: designers, isLoading } = useDesigners();

  if (isLoading) return null;

  return (
    <Select onValueChange={(value) => onSelect(parseInt(value))}>
      <SelectTrigger>
        <SelectValue placeholder="Select a designer" />
      </SelectTrigger>
      <SelectContent>
        {designers?.map((designer) => (
          <SelectItem key={designer.id} value={designer.id.toString()}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={designer.photoUrl || ""} />
                <AvatarFallback>
                  {designer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {designer.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ListsPage() {
  const { data: lists, isLoading } = useLists();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<SelectList | null>(null);
  const [selectedDesigner, setSelectedDesigner] =
    useState<SelectDesigner | null>(null);
  const [listToEdit, setListToEdit] = useState<SelectList | null>(null);
  const [listToDelete, setListToDelete] = useState<SelectList | null>(null);
  const { toast } = useToast();
  const deleteList = useDeleteList();

  const handleDeleteList = async () => {
    if (!listToDelete) return;

    try {
      await deleteList.mutateAsync(listToDelete.id);
      toast({
        title: "Success",
        description: "List deleted successfully",
      });
      setListToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete list",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Design Big Board Lists</h1>
        <CreateListDialog open={isOpen} onOpenChange={setIsOpen} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists?.map((list) => (
            <Card
              key={list.id}
              className="group cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedList(list)}
            >
              <CardHeader className="relative">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setListToEdit(list);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit List
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListToDelete(list);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete List
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle>{list.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {list.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {list.designers?.slice(0, 5).map(({ designer }) => (
                    <Avatar
                      key={designer.id}
                      className="border-2 border-background"
                    >
                      <AvatarImage src={designer.photoUrl || ""} />
                      <AvatarFallback>
                        {designer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {list.designers?.length > 5 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-xs border-2 border-background">
                      +{list.designers.length - 5}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedList && (
        <ViewListDialog
          list={selectedList}
          open={Boolean(selectedList)}
          onOpenChange={(open) => !open && setSelectedList(null)}
          onViewDesigner={setSelectedDesigner}
        />
      )}

      {listToEdit && (
        <EditListDialog
          list={listToEdit}
          open={Boolean(listToEdit)}
          onOpenChange={(open) => !open && setListToEdit(null)}
        />
      )}

      {selectedDesigner && (
        <ViewDesignerDialog
          designer={selectedDesigner}
          open={Boolean(selectedDesigner)}
          onOpenChange={(open) => !open && setSelectedDesigner(null)}
        />
      )}

      <AlertDialog
        open={Boolean(listToDelete)}
        onOpenChange={(open) => !open && setListToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this list?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              list and remove all designer associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteList.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Delete List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ViewListDialogProps {
  list: SelectList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDesigner: (designer: SelectDesigner) => void;
}

function ViewListDialog({
  list,
  open,
  onOpenChange,
  onViewDesigner,
}: ViewListDialogProps) {
  const [isPublic, setIsPublic] = useState(list.isPublic || false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const updateList = useUpdateList();
  const { toast } = useToast();
  const origin = window.location.origin;
  const shareUrl = `${origin}/lists/${list.id}`;

  const handlePublicToggle = async (checked: boolean) => {
    try {
      await updateList.mutateAsync({
        id: list.id,
        isPublic: checked,
      });
      setIsPublic(checked);
      toast({
        title: "Success",
        description: checked ? "List is now public" : "List is now private",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update list visibility",
        variant: "destructive",
      });
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Success",
      description: "Share URL copied to clipboard",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">{list.name}</DialogTitle>
            <p className="text-muted-foreground">{list.description}</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {list.designers?.map(
                ({
                  designer,
                  notes,
                }: {
                  designer: SelectDesigner;
                  notes?: string;
                }) => (
                  <Card
                    key={designer.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => onViewDesigner(designer)}
                  >
                    <CardContent className="flex items-start space-x-4 pt-6">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={designer.photoUrl || ""} />
                        <AvatarFallback>
                          {designer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">{designer.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {designer.title}
                        </p>
                        {notes && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Notes:</p>
                            <p className="text-muted-foreground">{notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}

              <div className="border-t pt-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="public"
                      checked={isPublic}
                      onCheckedChange={handlePublicToggle}
                    />
                    <label
                      htmlFor="public"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Share via URL
                    </label>
                  </div>

                  {isPublic && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          readOnly
                          value={shareUrl}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyShareUrl}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowEmailDialog(true)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EmailListDialog
        list={list}
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
      />
    </>
  );
}

interface EditListDialogProps {
  list: SelectList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditListDialog({ list, open, onOpenChange }: EditListDialogProps) {
  const updateList = useUpdateList();
  const addDesigner = useAddDesignersToList();
  const { toast } = useToast();
  const [designerNotes, setDesignerNotes] = useState<Record<number, string>>(
    {},
  );

  const form = useForm({
    defaultValues: {
      name: list.name,
      description: list.description || "",
      summary: list.summary || "",
    },
  });

  const onSubmit = async (values: {
    name: string;
    description: string;
    summary: string;
  }) => {
    try {
      await updateList.mutateAsync({
        id: list.id,
        ...values,
      });
      toast({
        title: "Success",
        description: "List updated successfully",
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update list",
        variant: "destructive",
      });
    }
  };

  const handleAddDesigner = async (designerId: number) => {
    try {
      await addDesigner.mutateAsync({
        listId: list.id,
        designerId,
        notes: designerNotes[designerId],
      });
      toast({
        title: "Success",
        description: "Designer added to list successfully",
      });
      setDesignerNotes((prev) => ({ ...prev, [designerId]: "" }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add designer to list",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNotes = async (designerId: number, notes: string) => {
    try {
      await updateList.mutateAsync({
        id: list.id,
        designerId,
        notes,
      });
      toast({
        title: "Success",
        description: "Notes updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notes",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add a summary for the public share page and email..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="submit" disabled={updateList.isPending}>
                    {updateList.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>

            <div className="space-y-4">
              <h3 className="font-medium">Add</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <DesignerSelect onSelect={handleAddDesigner} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Current Designers</h3>
              <div className="space-y-2">
                {list.designers?.map(
                  ({
                    designer,
                    notes,
                  }: {
                    designer: SelectDesigner;
                    notes?: string;
                  }) => (
                    <div
                      key={designer.id}
                      className="flex flex-col p-2 rounded-md border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={designer.photoUrl || ""} />
                            <AvatarFallback>
                              {designer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{designer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {designer.title}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const currentNotes = designerNotes[designer.id];
                            setDesignerNotes((prev) => ({
                              ...prev,
                              [designer.id]:
                                currentNotes === undefined
                                  ? notes || ""
                                  : undefined,
                            }));
                          }}
                        >
                          {designerNotes[designer.id] !== undefined
                            ? "Cancel"
                            : notes
                              ? "Edit Notes"
                              : "Add Notes"}
                        </Button>
                      </div>

                      {designerNotes[designer.id] !== undefined && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder="Add notes about this designer..."
                            value={designerNotes[designer.id]}
                            onChange={(e) =>
                              setDesignerNotes((prev) => ({
                                ...prev,
                                [designer.id]: e.target.value,
                              }))
                            }
                            className="min-h-[80px]"
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => {
                                handleUpdateNotes(
                                  designer.id,
                                  designerNotes[designer.id] || "",
                                );
                                setDesignerNotes((prev) => {
                                  const newNotes = { ...prev };
                                  delete newNotes[designer.id];
                                  return newNotes;
                                });
                              }}
                            >
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      )}

                      {notes && designerNotes[designer.id] === undefined && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {notes}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ViewDesignerDialogProps {
  designer: SelectDesigner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ViewDesignerDialog({
  designer,
  open,
  onOpenChange,
}: ViewDesignerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Designer Profile</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={designer.photoUrl || ""} />
                <AvatarFallback>
                  {designer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{designer.name}</h2>
                <p className="text-muted-foreground">{designer.title}</p>
              </div>
            </div>
            {designer.notes && (
              <div>
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">
                  {designer.notes}
                </p>
              </div>
            )}
            {designer.skills && (
              <div>
                <h3 className="font-medium mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {designer.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateListDialog({ open, onOpenChange }: CreateListDialogProps) {
  const createList = useCreateList();
  const addDesigner = useAddDesignersToList();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const [selectedDesignerIds, setSelectedDesignerIds] = useState<number[]>([]);

  const onSubmit = async (values: { name: string; description: string }) => {
    try {
      const list = await createList.mutateAsync({
        ...values,
        designerIds: selectedDesignerIds,
      });

      toast({
        title: "Success",
        description: "List created successfully",
      });
      form.reset();
      setSelectedDesignerIds([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    }
  };

  const handleAddDesigner = (designerId: number) => {
    if (!selectedDesignerIds.includes(designerId)) {
      setSelectedDesignerIds([...selectedDesignerIds, designerId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <h3 className="font-medium">Add Designers</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <DesignerSelect onSelect={handleAddDesigner} />
                  </div>
                </div>
                {selectedDesignerIds.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Selected Designers</h4>
                    <div className="text-sm text-muted-foreground">
                      {selectedDesignerIds.length} designer
                      {selectedDesignerIds.length !== 1 ? "s" : ""} selected
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={createList.isPending}>
                  {createList.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create List
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add new EmailListDialog component
interface EmailListDialogProps {
  list: SelectList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EmailListDialog({ list, open, onOpenChange }: EmailListDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      email: "",
      subject: `${list.name} - Designer List`,
      summary: list.summary || "",
    },
  });

  const onSubmit = async (values: {
    email: string;
    subject: string;
    summary: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lists/${list.id}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "List has been emailed successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Email List</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      placeholder="Email address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add a summary for the email..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Email
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
