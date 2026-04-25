import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FolderOpen,
  List,
  Inbox,
  Sparkles,
  Briefcase,
  Search,
  UserPlus,
  ListPlus,
} from "lucide-react";

interface CommandPaletteProps {
  workspaceSlug: string;
}

export default function CommandPalette({ workspaceSlug }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => setLocation(`/${workspaceSlug}/directory`))}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>Navigate to Directory</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setLocation(`/${workspaceSlug}/lists`))}
          >
            <List className="mr-2 h-4 w-4" />
            <span>Navigate to Lists</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setLocation(`/${workspaceSlug}/inbox`))}
          >
            <Inbox className="mr-2 h-4 w-4" />
            <span>Navigate to Inbox</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setLocation(`/${workspaceSlug}/matchmaker`))}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Navigate to Matchmaker</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setLocation(`/${workspaceSlug}/hiring`))}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            <span>Navigate to Hiring</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => setLocation(`/${workspaceSlug}/search`))}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search designers</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => {
              setLocation(`/${workspaceSlug}/directory`);
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openAddDesigner'));
              }, 100);
            })}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Add new designer</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => {
              setLocation(`/${workspaceSlug}/lists`);
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openCreateList'));
              }, 100);
            })}
          >
            <ListPlus className="mr-2 h-4 w-4" />
            <span>Create new list</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
