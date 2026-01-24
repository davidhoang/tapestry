import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Key, Plus, Trash2, Copy, Check, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ApiToken {
  id: number;
  name: string;
  tokenPrefix: string;
  role: string;
  usageCount: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface NewTokenResponse extends ApiToken {
  token: string;
}

export default function ApiTokensPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: tokens, isLoading } = useQuery<ApiToken[]>({
    queryKey: ["/api/workspaces", workspaceSlug, "api-tokens"],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/api-tokens`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load tokens");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const data = await apiRequest(`/api/workspaces/${workspaceSlug}/api-tokens`, {
        method: "POST",
        body: { name }
      });
      return data as NewTokenResponse;
    },
    onSuccess: (data) => {
      setNewToken(data.token);
      setTokenName("");
      // Optimistically add the new token to the cache
      queryClient.setQueryData<ApiToken[]>(
        ["/api/workspaces", workspaceSlug, "api-tokens"],
        (old) => old ? [...old, data] : [data]
      );
      toast({ title: "Token created", description: "Make sure to copy your token now. You won't be able to see it again." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create token", variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      await apiRequest(`/api/workspaces/${workspaceSlug}/api-tokens/${tokenId}`, { method: "DELETE" });
      return tokenId;
    },
    onMutate: async (tokenId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/workspaces", workspaceSlug, "api-tokens"] });
      
      // Snapshot the previous value
      const previousTokens = queryClient.getQueryData<ApiToken[]>(["/api/workspaces", workspaceSlug, "api-tokens"]);
      
      // Optimistically remove the token from the list
      queryClient.setQueryData<ApiToken[]>(
        ["/api/workspaces", workspaceSlug, "api-tokens"],
        (old) => old?.filter(t => t.id !== tokenId) ?? []
      );
      
      return { previousTokens };
    },
    onSuccess: () => {
      toast({ title: "Token revoked", description: "The token has been revoked and can no longer be used." });
    },
    onError: (_err, _tokenId, context) => {
      // Rollback on error
      if (context?.previousTokens) {
        queryClient.setQueryData(["/api/workspaces", workspaceSlug, "api-tokens"], context.previousTokens);
      }
      toast({ title: "Error", description: "Failed to revoke token", variant: "destructive" });
    },
  });

  const handleCopy = async () => {
    if (newToken) {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setNewToken(null);
    setTokenName("");
  };

  return (
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API tokens</h1>
          <p className="text-muted-foreground mt-1">
            Create tokens to access Tapestry from Claude Desktop or other MCP clients
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          if (!open) handleCloseCreate();
          else setIsCreateOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create token
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {newToken ? (
              <>
                <DialogHeader>
                  <DialogTitle>Token created</DialogTitle>
                  <DialogDescription>
                    Copy this token now. You won't be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Store this token securely. It provides access to your workspace data.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <div className="relative">
                      <textarea
                        value={newToken}
                        readOnly
                        rows={3}
                        className="w-full p-3 font-mono text-sm bg-muted border rounded-md resize-none break-all"
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      />
                    </div>
                    <Button className="w-full" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? "Copied" : "Copy token"}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseCreate}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API token</DialogTitle>
                  <DialogDescription>
                    Give your token a name to help you remember what it's used for.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Token name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Claude Desktop"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseCreate}>Cancel</Button>
                  <Button 
                    onClick={() => createMutation.mutate(tokenName)}
                    disabled={!tokenName.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create token"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Using with Claude Desktop or Claude Code</CardTitle>
          <CardDescription>
            Connect Tapestry to AI assistants to manage designers and lists through natural language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Step 1: Add the MCP server to your Claude Desktop config</h4>
            <p className="text-sm text-muted-foreground">
              Open your Claude Desktop configuration file:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li><strong>macOS:</strong> <code className="bg-muted px-1 rounded text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
              <li><strong>Windows:</strong> <code className="bg-muted px-1 rounded text-xs">%APPDATA%\Claude\claude_desktop_config.json</code></li>
            </ul>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "mcpServers": {
    "tapestry": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${window.location.origin}/mcp"
      ]
    }
  }
}`}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={async () => {
                  const config = JSON.stringify({
                    mcpServers: {
                      tapestry: {
                        command: "npx",
                        args: ["-y", "mcp-remote", `${window.location.origin}/mcp`]
                      }
                    }
                  }, null, 2);
                  await navigator.clipboard.writeText(config);
                  toast({ title: "Copied!", description: "Configuration copied to clipboard" });
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Step 2: Restart Claude Desktop</h4>
            <p className="text-sm text-muted-foreground">
              After saving the config, restart Claude Desktop for the changes to take effect.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Step 3: Authenticate with your token</h4>
            <p className="text-sm text-muted-foreground">
              In Claude, use the <code className="bg-muted px-1 rounded">authenticate</code> tool with your API token (starts with <code className="bg-muted px-1 rounded">tap_</code>).
            </p>
          </div>

          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertTitle>MCP Server URL</AlertTitle>
            <AlertDescription>
              <p className="font-mono text-xs break-all mb-2">{window.location.origin}/mcp</p>
              <p className="text-xs text-muted-foreground">
                If using a custom domain, ensure the MCP server is accessible at the same domain.
                For Replit deployments, use the <code className="bg-muted px-1 rounded">.replit.app</code> URL.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading tokens...</p>
          ) : tokens?.length === 0 ? (
            <p className="text-muted-foreground">No tokens yet. Create one to get started.</p>
          ) : (
            <div className="space-y-3">
              {tokens?.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.name}</span>
                      <Badge variant="secondary">{token.role}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-mono">tap_{token.tokenPrefix}...</span>
                      {" "}&middot;{" "}
                      Created {format(new Date(token.createdAt), "MMM d, yyyy")}
                      {token.usageCount > 0 && (
                        <> &middot; {token.usageCount.toLocaleString()} request{token.usageCount !== 1 ? 's' : ''}</>
                      )}
                      {token.lastUsedAt && (
                        <> &middot; Last used {format(new Date(token.lastUsedAt), "MMM d, yyyy")}</>
                      )}
                      {token.expiresAt && (
                        <> &middot; Expires {format(new Date(token.expiresAt), "MMM d, yyyy")}</>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Are you sure you want to revoke this token? Any applications using it will stop working.")) {
                        revokeMutation.mutate(token.id);
                      }
                    }}
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
