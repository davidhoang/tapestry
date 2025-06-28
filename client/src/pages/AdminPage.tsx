
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Play, AlertCircle, CheckCircle, Upload, Mail, Send, Loader2, Settings, Building2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import CsvImport from "@/components/CsvImport";
import PdfImport from "@/components/PdfImport";
import AdminRoute from "@/components/AdminRoute";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

interface InviteFormData {
  email: string;
  message: string;
}

function AlphaInviteForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteFormData>({
    defaultValues: {
      email: "",
      message: "Hi there!\n\nYou've been invited to test Tapestry, our new platform for connecting with top design talent. We're currently in alpha and would love your feedback.\n\nClick the link below to get started:\n[INVITE_LINK]\n\nBest regards,\nThe Tapestry Team"
    },
  });

  const sendInvite = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const response = await fetch("/api/admin/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Invite Sent",
          description: `Alpha invite successfully sent to ${form.getValues('email')}`,
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send invite",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invite",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);
    try {
      await sendInvite.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Send Alpha Invite
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter invite message"
                      className="min-h-[200px]"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invite...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Alpha Invite
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const { onboardingState, updateSettings, isUpdatingSettings } = useOnboarding();
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const [location] = useLocation();

  // Fetch user workspaces
  const { data: workspaces } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: async () => {
      const response = await fetch("/api/workspaces");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Get current workspace from URL path
  const currentWorkspaceSlug = location.split('/')[1] || "david-v-hoang";
  const userWorkspace = workspaces?.find((w: any) => w.slug === currentWorkspaceSlug) || workspaces?.[0];

  // Handle workspace switching with visual feedback
  const handleWorkspaceSwitch = (workspace: any) => {
    const workspaceName = workspace.owner?.email === user?.email ? 'My Workspace' : workspace.name;
    toast({
      title: "Workspace switched",
      description: `Now viewing ${workspaceName}`,
      duration: 3000,
    });
  };

  // Fetch available tables
  const { data: tablesResponse, isLoading: tablesLoading } = useQuery({
    queryKey: ["/api/admin/db/tables"],
    queryFn: async () => {
      const response = await fetch("/api/admin/db/tables");
      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }
      return response.json();
    },
  });

  // Extract the actual tables array from the response
  const tables = Array.isArray(tablesResponse) ? tablesResponse : (tablesResponse?.rows || []);

  // Execute query mutation
  const executeQuery = useMutation({
    mutationFn: async (sqlQuery: string) => {
      const response = await fetch("/api/admin/db/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sqlQuery }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQueryResult(data);
    },
  });

  const handleExecuteQuery = () => {
    if (query.trim()) {
      executeQuery.mutate(query);
    }
  };

  const getCommonQueries = () => [
    {
      name: "View all users",
      query: "SELECT id, email, is_admin, created_at FROM users ORDER BY created_at DESC;",
    },
    {
      name: "View all designers",
      query: "SELECT id, name, email, company, level, available FROM designers ORDER BY created_at DESC LIMIT 10;",
    },
    {
      name: "View all lists",
      query: "SELECT id, name, description, is_public, created_at FROM lists ORDER BY created_at DESC LIMIT 10;",
    },
    {
      name: "Count records by table",
      query: `
        SELECT 
          'users' as table_name, COUNT(*) as count FROM users
        UNION ALL
        SELECT 
          'designers' as table_name, COUNT(*) as count FROM designers
        UNION ALL
        SELECT 
          'lists' as table_name, COUNT(*) as count FROM lists
        UNION ALL
        SELECT 
          'list_designers' as table_name, COUNT(*) as count FROM list_designers;
      `,
    },
  ];

  const renderResults = () => {
    if (!queryResult) return null;

    if (!queryResult.success) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{queryResult.error}</AlertDescription>
        </Alert>
      );
    }

    if (!queryResult.data || queryResult.data.length === 0) {
      return (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Query executed successfully. {queryResult.rowCount || 0} rows affected.
          </AlertDescription>
        </Alert>
      );
    }

    const data = queryResult.data;
    const columns = Object.keys(data[0] || {});

    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Query executed successfully. {data.length} rows returned.
          </AlertDescription>
        </Alert>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {typeof row[column] === 'boolean' ? (
                        <Badge variant={row[column] ? "default" : "secondary"}>
                          {row[column] ? "Yes" : "No"}
                        </Badge>
                      ) : (
                        String(row[column] || "")
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <AdminRoute>
      <div className="container mx-auto pt-20 pb-8 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          
          {/* Workspace Switcher */}
          {workspaces && workspaces.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Current Workspace:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{userWorkspace?.owner?.email === user?.email ? 'My Workspace' : userWorkspace?.name || 'Select Workspace'}</span>
                    <span className="text-xs text-muted-foreground capitalize">({userWorkspace?.role})</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b">
                    Switch Workspace
                  </div>
                  {workspaces.map((workspace: any) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      asChild
                      className="cursor-pointer"
                    >
                      <Link
                        href={`/${workspace.slug}/directory`}
                        className="flex items-center justify-between w-full px-2 py-1.5"
                        onClick={() => {
                          if (workspace.slug !== currentWorkspaceSlug) {
                            handleWorkspaceSwitch(workspace);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {workspace.owner?.email === user?.email ? 'My Workspace' : workspace.name}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">{workspace.role}</span>
                          </div>
                        </div>
                        {workspace.slug === currentWorkspaceSlug && (
                          <Check className="h-4 w-4" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="import">CSV import</TabsTrigger>
            <TabsTrigger value="pdf-import">PDF import</TabsTrigger>
            <TabsTrigger value="invites">Alpha Invites</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="grid gap-6">
            {/* Tables Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
              </CardHeader>
              <CardContent>
                {tablesLoading ? (
                  <div>Loading tables...</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tables && tables.length > 0 ? (
                      tables.map((table: any, index: number) => (
                        <Badge key={table.table_name || index} variant="outline">
                          {table.table_name || 'Unknown Table'}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No tables found</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Common Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {getCommonQueries().map((queryItem, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => setQuery(queryItem.query)}
                    >
                      <div>
                        <div className="font-medium">{queryItem.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {queryItem.query.slice(0, 100)}...
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Query Editor */}
            <Card>
              <CardHeader>
                <CardTitle>SQL Query Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter your SQL query here..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Supported operations: SELECT, INSERT, UPDATE, DELETE
                    </div>
                    <Button 
                      onClick={handleExecuteQuery}
                      disabled={!query.trim() || executeQuery.isPending}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {executeQuery.isPending ? "Executing..." : "Execute Query"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Results */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Results</h3>
                  {renderResults()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <CsvImport />
          </TabsContent>

          <TabsContent value="pdf-import">
            <PdfImport />
          </TabsContent>

          <TabsContent value="invites">
            <AlphaInviteForm />
          </TabsContent>

          <TabsContent value="onboarding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Onboarding Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base font-medium">
                      Debug Mode
                    </div>
                    <div className="text-sm text-muted-foreground">
                      When enabled, onboarding will show for all users on every login/signup. 
                      When disabled, onboarding only shows for new users on first signup.
                    </div>
                  </div>
                  <Switch
                    checked={onboardingState?.debugMode || false}
                    onCheckedChange={async (checked) => {
                      try {
                        await updateSettings({ debugMode: checked });
                      } catch (error) {
                        console.error('Failed to update onboarding settings:', error);
                      }
                    }}
                    disabled={isUpdatingSettings}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-medium">Current Status</div>
                  <div className="text-sm text-muted-foreground">
                    <div>Debug Mode: {onboardingState?.debugMode ? 'Enabled' : 'Disabled'}</div>
                    <div>Your Onboarding Status: {onboardingState?.hasCompletedOnboarding ? 'Completed' : 'Not Completed'}</div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is an alpha feature. Debug mode is useful for testing the onboarding flow 
                    but should be disabled in production to avoid showing onboarding to returning users.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  );
}
