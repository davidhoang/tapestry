import { useState } from "react";
import { ChevronDown, Search, Copy, Check, Mail, Calendar, User, Settings, Home, Plus, Trash2, Edit, Heart, Star, Bell, AlertCircle, Info, CheckCircle, XCircle, Bold, Italic, Underline } from "lucide-react";
import Navigation from "../components/Navigation";
import AdminRoute from "../components/AdminRoute";

// Import all UI components
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "@/components/ui/menubar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ComponentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedComponent, setCopiedComponent] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [progress, setProgress] = useState(33);
  const [sliderValue, setSliderValue] = useState([50]);

  const copyToClipboard = (componentName: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedComponent(componentName);
    setTimeout(() => setCopiedComponent(null), 2000);
  };

  // Typography examples
  const typographyExamples = [
    {
      name: "Heading 1",
      element: <h1 className="text-4xl font-bold tracking-tight">The quick brown fox jumps over the lazy dog</h1>,
      code: `<h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>`
    },
    {
      name: "Heading 2", 
      element: <h2 className="text-3xl font-semibold tracking-tight">The quick brown fox jumps over the lazy dog</h2>,
      code: `<h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>`
    },
    {
      name: "Heading 3",
      element: <h3 className="text-2xl font-semibold tracking-tight">The quick brown fox jumps over the lazy dog</h3>,
      code: `<h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>`
    },
    {
      name: "Heading 4",
      element: <h4 className="text-xl font-semibold tracking-tight">The quick brown fox jumps over the lazy dog</h4>,
      code: `<h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>`
    },
    {
      name: "Heading 5",
      element: <h5 className="text-lg font-semibold">The quick brown fox jumps over the lazy dog</h5>,
      code: `<h5 className="text-lg font-semibold">Heading 5</h5>`
    },
    {
      name: "Heading 6",
      element: <h6 className="text-base font-semibold">The quick brown fox jumps over the lazy dog</h6>,
      code: `<h6 className="text-base font-semibold">Heading 6</h6>`
    },
    {
      name: "Body Large",
      element: <p className="text-lg leading-7 font-serif">The quick brown fox jumps over the lazy dog. This is a longer piece of text to demonstrate how the typography looks in paragraph form with multiple lines of content.</p>,
      code: `<p className="text-lg leading-7 font-serif">Body Large</p>`
    },
    {
      name: "Body Regular",
      element: <p className="text-base leading-6 font-serif">The quick brown fox jumps over the lazy dog. This is a longer piece of text to demonstrate how the typography looks in paragraph form with multiple lines of content.</p>,
      code: `<p className="text-base leading-6 font-serif">Body Regular</p>`
    },
    {
      name: "Body Small",
      element: <p className="text-sm leading-5 font-serif">The quick brown fox jumps over the lazy dog. This is a longer piece of text to demonstrate how the typography looks in paragraph form.</p>,
      code: `<p className="text-sm leading-5 font-serif">Body Small</p>`
    },
    {
      name: "Caption",
      element: <p className="text-xs text-muted-foreground leading-4 font-serif">The quick brown fox jumps over the lazy dog</p>,
      code: `<p className="text-xs text-muted-foreground leading-4 font-serif">Caption</p>`
    },
    {
      name: "Blockquote",
      element: <blockquote className="border-l-4 border-primary pl-4 italic text-lg font-serif">The quick brown fox jumps over the lazy dog. This is an inspirational quote or important callout.</blockquote>,
      code: `<blockquote className="border-l-4 border-primary pl-4 italic text-lg font-serif">Quote</blockquote>`
    },
    {
      name: "Code Inline",
      element: <p className="text-base font-serif">The quick brown fox jumps over the <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">lazy dog</code> in the forest.</p>,
      code: `<code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">code</code>`
    },
    {
      name: "Lead Text",
      element: <p className="text-xl text-muted-foreground leading-8 font-serif">The quick brown fox jumps over the lazy dog. This is larger text used for introductions.</p>,
      code: `<p className="text-xl text-muted-foreground leading-8 font-serif">Lead Text</p>`
    }
  ];

  // Color palette with actual theme colors and suggested improvements
  const colorPalette = [
    {
      name: "Primary & Variants",
      colors: [
        { name: "Primary (#C8944B)", class: "bg-primary", text: "text-primary-foreground" },
        { name: "Primary Foreground", class: "bg-primary-foreground border", text: "text-primary" },
        { name: "Deep Gold", class: "bg-[#B8843F]", text: "text-white" },
        { name: "Rich Brown", class: "bg-[#8B5A2B]", text: "text-white" }
      ]
    },
    {
      name: "Warm Neutrals", 
      colors: [
        { name: "Nav Cream (#FFF0EC)", class: "bg-nav-cream border", text: "text-gray-800" },
        { name: "Soft Cream", class: "bg-[#FBF8F3] border", text: "text-gray-800" },
        { name: "Warm Neutral", class: "bg-[#F5F2ED] border", text: "text-gray-800" },
        { name: "Muted Tan", class: "bg-[#E6D5B7]", text: "text-gray-800" },
        { name: "Stone", class: "bg-[#D4C4A8]", text: "text-gray-800" }
      ]
    },
    {
      name: "System Colors",
      colors: [
        { name: "Secondary", class: "bg-secondary", text: "text-secondary-foreground" },
        { name: "Muted", class: "bg-muted", text: "text-muted-foreground" },
        { name: "Accent", class: "bg-accent", text: "text-accent-foreground" },
        { name: "Card", class: "bg-card border", text: "text-card-foreground" }
      ]
    },
    {
      name: "Background",
      colors: [
        { name: "Background", class: "bg-background border", text: "text-foreground" },
        { name: "Foreground", class: "bg-foreground", text: "text-background" }
      ]
    },
    {
      name: "Status Colors",
      colors: [
        { name: "Destructive", class: "bg-destructive", text: "text-destructive-foreground" },
        { name: "Success", class: "bg-green-600", text: "text-white" },
        { name: "Warning", class: "bg-amber-500", text: "text-white" },
        { name: "Info", class: "bg-blue-600", text: "text-white" }
      ]
    },
    {
      name: "Border & Input",
      colors: [
        { name: "Border", class: "bg-border", text: "text-foreground" },
        { name: "Input", class: "bg-input", text: "text-foreground" },
        { name: "Ring", class: "bg-ring", text: "text-primary-foreground" }
      ]
    }
  ];

  const components = [
    {
      name: "Accordion",
      category: "Layout",
      element: (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>
              Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is it styled?</AccordionTrigger>
            <AccordionContent>
              Yes. It comes with default styles that matches the other components.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ),
      code: `<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>`
    },
    {
      name: "Alert",
      category: "Feedback",
      element: (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the cli.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again.
            </AlertDescription>
          </Alert>
        </div>
      ),
      code: `<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>`
    },
    {
      name: "Alert Dialog",
      category: "Overlay",
      element: (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Show Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
      code: `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Show Dialog</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`
    },
    {
      name: "Avatar",
      category: "Data Display",
      element: (
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      ),
      code: `<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`
    },
    {
      name: "Badge",
      category: "Data Display",
      element: (
        <div className="flex items-center space-x-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      ),
      code: `<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`
    },
    {
      name: "Button",
      category: "Form",
      element: (
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Login with Email
          </Button>
        </div>
      ),
      code: `<Button>Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`
    },
    {
      name: "Calendar",
      category: "Form",
      element: (
        <CalendarComponent
          mode="single"
          selected={calendarDate}
          onSelect={setCalendarDate}
          className="rounded-md border"
        />
      ),
      code: `<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-md border"
/>`
    },
    {
      name: "Card",
      category: "Layout",
      element: (
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="font-serif">Create project</CardTitle>
            <CardDescription className="font-serif">Deploy your new project in one-click.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name" className="font-serif">Name</Label>
                <Input id="name" placeholder="Name of your project" className="font-serif" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" className="font-serif">Cancel</Button>
            <Button className="font-serif">Deploy</Button>
          </CardFooter>
        </Card>
      ),
      code: `<Card>
  <CardHeader>
    <CardTitle>Create project</CardTitle>
    <CardDescription>Deploy your new project in one-click.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>`
    },
    {
      name: "Checkbox",
      category: "Form",
      element: (
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accept terms and conditions
          </Label>
        </div>
      ),
      code: `<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>`
    },
    {
      name: "Dialog",
      category: "Overlay",
      element: (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Profile</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
      code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Pedro Duarte" />
      </div>
    </div>
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`
    },
    {
      name: "Input",
      category: "Form",
      element: (
        <div className="space-y-4">
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Input placeholder="Disabled" disabled />
        </div>
      ),
      code: `<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input placeholder="Disabled" disabled />`
    },
    {
      name: "Label",
      category: "Form",
      element: (
        <div className="space-y-2">
          <Label htmlFor="email">Your email address</Label>
          <Input type="email" id="email" placeholder="Email" />
        </div>
      ),
      code: `<Label htmlFor="email">Your email address</Label>
<Input type="email" id="email" placeholder="Email" />`
    },
    {
      name: "Progress",
      category: "Feedback",
      element: (
        <div className="space-y-4">
          <Progress value={progress} className="w-[60%]" />
          <div className="flex space-x-2">
            <Button onClick={() => setProgress(Math.max(0, progress - 10))} size="sm">-10%</Button>
            <Button onClick={() => setProgress(Math.min(100, progress + 10))} size="sm">+10%</Button>
          </div>
        </div>
      ),
      code: `<Progress value={33} className="w-[60%]" />`
    },
    {
      name: "Select",
      category: "Form",
      element: (
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="blueberry">Blueberry</SelectItem>
            <SelectItem value="grapes">Grapes</SelectItem>
            <SelectItem value="pineapple">Pineapple</SelectItem>
          </SelectContent>
        </Select>
      ),
      code: `<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="blueberry">Blueberry</SelectItem>
  </SelectContent>
</Select>`
    },
    {
      name: "Skeleton",
      category: "Feedback",
      element: (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ),
      code: `<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>`
    },
    {
      name: "Slider",
      category: "Form",
      element: (
        <div className="space-y-4">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            step={1}
            className="w-[60%]"
          />
          <p className="text-sm text-muted-foreground">Value: {sliderValue[0]}</p>
        </div>
      ),
      code: `<Slider
  value={[50]}
  onValueChange={setValue}
  max={100}
  step={1}
  className="w-[60%]"
/>`
    },
    {
      name: "Switch",
      category: "Form",
      element: (
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" />
          <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
      ),
      code: `<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`
    },
    {
      name: "Table",
      category: "Data Display",
      element: (
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">INV002</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>PayPal</TableCell>
              <TableCell className="text-right">$150.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
      code: `<Table>
  <TableCaption>A list of your recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Method</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>Credit Card</TableCell>
      <TableCell className="text-right">$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>`
    },
    {
      name: "Tabs",
      category: "Navigation",
      element: (
        <Tabs defaultValue="account" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Make changes to your account here. Click save when you're done.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="Pedro Duarte" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password here. After saving, you'll be logged out.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="current">Current password</Label>
                  <Input id="current" type="password" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ),
      code: `<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <p>Account tab content</p>
  </TabsContent>
  <TabsContent value="password">
    <p>Password tab content</p>
  </TabsContent>
</Tabs>`
    },
    {
      name: "Textarea",
      category: "Form",
      element: (
        <Textarea placeholder="Type your message here." />
      ),
      code: `<Textarea placeholder="Type your message here." />`
    },
    {
      name: "Toggle",
      category: "Form",
      element: (
        <div className="flex items-center space-x-2">
          <Toggle aria-label="Toggle bold">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle aria-label="Toggle italic" pressed>
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle aria-label="Toggle underline" disabled>
            <Underline className="h-4 w-4" />
          </Toggle>
        </div>
      ),
      code: `<Toggle aria-label="Toggle bold">
  <Bold className="h-4 w-4" />
</Toggle>`
    },
    {
      name: "Tooltip",
      category: "Overlay",
      element: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      code: `<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Add to library</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`
    }
  ];

  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(components.map(c => c.category)));

  return (
    <AdminRoute>
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 font-serif">UI Components Library</h1>
            <p className="text-muted-foreground font-serif">
              A comprehensive showcase of all available UI components, typography, and colors in your application.
              Click the copy button to copy component code to your clipboard.
            </p>
          </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search components, typography, or colors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter Badges */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={searchTerm === "" ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSearchTerm("")}
            >
              All
            </Badge>
            <Badge
              variant={searchTerm.toLowerCase() === "typography" ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSearchTerm("typography")}
            >
              Typography
            </Badge>
            <Badge
              variant={searchTerm.toLowerCase() === "colors" || searchTerm.toLowerCase() === "color" ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSearchTerm("colors")}
            >
              Colors
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={searchTerm.toLowerCase() === category.toLowerCase() ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSearchTerm(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Typography Section */}
        {(!searchTerm || searchTerm.toLowerCase().includes("typography")) && (
          <div className="mb-12">
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Typography</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      Design System
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {typographyExamples.map((typo) => (
                    <div key={typo.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">{typo.name}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(typo.name, typo.code)}
                          className="text-xs"
                        >
                          {copiedComponent === typo.name ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        {typo.element}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Color Palette Section */}
        {(!searchTerm || searchTerm.toLowerCase().includes("color") || searchTerm.toLowerCase().includes("palette")) && (
          <div className="mb-12">
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Color Palette</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      Design System
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {colorPalette.map((group) => (
                    <div key={group.name} className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">{group.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.colors.map((color) => (
                          <div key={color.name} className="flex items-center gap-3">
                            <div className={`w-16 h-16 rounded-lg border ${color.class} ${color.text} flex items-center justify-center text-xs font-medium`}>
                              Aa
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{color.name}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(color.name, color.class)}
                                className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
                              >
                                {copiedComponent === color.name ? "Copied!" : color.class}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Components Grid */}
        <div className="grid gap-8">
          {filteredComponents.map((component) => (
            <Card key={component.name} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{component.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {component.category}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(component.name, component.code)}
                    className="flex items-center gap-2"
                  >
                    {copiedComponent === component.name ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-6 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center min-h-[100px]">
                    {component.element}
                  </div>
                </div>
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                    <ChevronDown className="h-4 w-4" />
                    View Code
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{component.code}</code>
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredComponents.length === 0 && searchTerm && !["typography", "color", "palette"].some(term => searchTerm.toLowerCase().includes(term)) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No components found matching your search.</p>
          </div>
        )}
      </div>
    </div>
    </AdminRoute>
  );
}