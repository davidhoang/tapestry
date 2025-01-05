import { useState } from "react";
import { useLists, useCreateList, useAddDesignersToList } from "@/hooks/use-lists";
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
import { useForm } from "react-hook-form";
import { Loader2, Plus, Trash, Share2, Mail, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectDesigner } from "@db/schema";

export default function ListsPage() {
  const { data: lists, isLoading } = useLists();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<any>(null);
  const { toast } = useToast();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Designer Lists</h1>
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
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement share via email
                        toast({
                          title: "Coming Soon",
                          description: "Email sharing will be available soon!",
                        });
                      }}>
                        <Mail className="mr-2 h-4 w-4" />
                        Share via Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement share via link
                        toast({
                          title: "Coming Soon",
                          description: "Link sharing will be available soon!",
                        });
                      }}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share via Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement delete
                          toast({
                            title: "Coming Soon",
                            description: "Delete functionality will be available soon!",
                          });
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
                    <Avatar key={designer.id} className="border-2 border-background">
                      <AvatarImage src={designer.photoUrl || ''} />
                      <AvatarFallback>
                        {designer.name.split(' ').map(n => n[0]).join('')}
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
        />
      )}
    </div>
  );
}

interface ViewListDialogProps {
  list: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ViewListDialog({ list, open, onOpenChange }: ViewListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{list.name}</DialogTitle>
          <p className="text-muted-foreground">{list.description}</p>
        </DialogHeader>
        <div className="space-y-4">
          {list.designers?.map(({ designer, notes }: { designer: SelectDesigner, notes?: string }) => (
            <Card key={designer.id}>
              <CardContent className="flex items-start space-x-4 pt-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={designer.photoUrl || ''} />
                  <AvatarFallback>
                    {designer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium">{designer.name}</h3>
                  <p className="text-sm text-muted-foreground">{designer.title}</p>
                  {notes && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium">Notes:</p>
                      <p className="text-muted-foreground">{notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: { name: string; description: string }) => {
    try {
      await createList.mutateAsync(values);
      toast({
        title: "Success",
        description: "List created successfully",
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
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
            <div className="flex justify-end space-x-2">
              <Button
                type="submit"
                disabled={createList.isPending}
              >
                {createList.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create List
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}