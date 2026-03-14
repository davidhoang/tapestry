import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Copy, Check, BookOpen, Terminal, MessageSquare, Lightbulb, ArrowLeft, Monitor, Apple } from "lucide-react";
import { SiWindows } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const MCP_URL = "https://tapestry-dh-design.replit.app/mcp";

const mcpTools = [
  { name: "authenticate", description: "Authenticate with your API token (required first)" },
  { name: "search_designers", description: "Search designers by name, title, skills, or location" },
  { name: "get_designer", description: "Get detailed designer information including skills and availability" },
  { name: "create_designer", description: "Create a new designer profile" },
  { name: "update_designer", description: "Update an existing designer's information" },
  { name: "list_lists", description: "List all designer lists in your workspace" },
  { name: "get_list_designers", description: "Get designers in a specific list" },
  { name: "create_list", description: "Create a new designer list" },
  { name: "add_designer_to_list", description: "Add a designer to a list" },
  { name: "remove_designer_from_list", description: "Remove a designer from a list" },
  { name: "workspace_info", description: "Get current workspace information" },
  { name: "quick_search", description: "Fast search returning only id, name, and title" },
  { name: "get_designer_timeline", description: "Get timeline events for a designer" },
  { name: "add_note", description: "Add a note to a designer's timeline" },
  { name: "enrich_designer", description: "AI-enrich a designer's profile with additional data" },
  { name: "enrich_designer_from_url", description: "Enrich a designer profile from a URL" },
  { name: "apply_enrichment", description: "Apply enrichment suggestions to a designer profile" },
  { name: "bulk_enrich_designers", description: "Enrich multiple designer profiles at once" },
];

const examplePrompts = [
  "Search for product designers in San Francisco",
  "Show me designers with Figma skills",
  "Create a new designer profile for John Smith, Senior UX Designer at Apple",
  "Add designer #42 to the 'Potential Hires' list",
  "Enrich the profile for designer #15",
  "What designers are available for freelance work?",
  "Show me all my lists",
  "Find designers who have experience with design systems",
];

const claudeConfig = JSON.stringify({
  mcpServers: {
    tapestry: {
      command: "npx",
      args: ["-y", "mcp-remote", MCP_URL],
    },
  },
}, null, 2);

const chatgptConfig = JSON.stringify({
  mcpServers: {
    tapestry: {
      type: "url",
      url: MCP_URL,
    },
  },
}, null, 2);

const sections = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "configuration", label: "Configuration", icon: Terminal },
  { id: "tools", label: "Available Tools", icon: Monitor },
  { id: "examples", label: "Example Prompts", icon: Lightbulb },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" className="absolute top-3 right-3" onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((s) => ({
        id: s.id,
        el: document.getElementById(s.id),
      }));

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i].el;
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(sectionElements[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4 max-w-7xl">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Tapestry</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold">MCP Setup Guide</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex gap-8 py-8">
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </a>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 max-w-3xl">
            <div className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Connect Tapestry to Your AI Assistant</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Tapestry's MCP (Model Context Protocol) server lets you manage designers, lists, and profiles through natural language in your favorite AI assistant.
              </p>
            </div>

            <section id="getting-started" className="mb-12 scroll-mt-24">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Getting Started
              </h3>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    To connect Tapestry to your AI assistant, you'll need to:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Generate an API token</strong> in Tapestry (Settings → API Tokens)</li>
                    <li><strong>Add the MCP server config</strong> to your AI assistant (see below)</li>
                    <li><strong>Restart your AI assistant</strong> to load the new configuration</li>
                    <li><strong>Authenticate</strong> by asking your assistant to use the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">authenticate</code> tool with your token</li>
                  </ol>
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <p className="text-sm font-medium mb-1">MCP Server URL</p>
                    <code className="text-xs font-mono text-primary break-all">{MCP_URL}</code>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="configuration" className="mb-12 scroll-mt-24">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Configuration
              </h3>

              <Tabs defaultValue="claude">
                <TabsList className="mb-4">
                  <TabsTrigger value="claude" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Claude Desktop
                  </TabsTrigger>
                  <TabsTrigger value="chatgpt" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    ChatGPT Desktop
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="claude">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Step 1: Open the config file</h4>
                        <p className="text-sm text-muted-foreground">
                          Locate and open your Claude Desktop configuration file:
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Apple className="h-4 w-4 text-muted-foreground" />
                            <strong>macOS:</strong>
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono break-all">
                              ~/Library/Application Support/Claude/claude_desktop_config.json
                            </code>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <SiWindows className="h-4 w-4 text-muted-foreground" />
                            <strong>Windows:</strong>
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono break-all">
                              %APPDATA%\Claude\claude_desktop_config.json
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Step 2: Add the Tapestry MCP server</h4>
                        <p className="text-sm text-muted-foreground">
                          Paste the following JSON into the config file:
                        </p>
                        <div className="relative">
                          <pre className="bg-gray-950 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                            {claudeConfig}
                          </pre>
                          <CopyButton text={claudeConfig} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Step 3: Restart Claude Desktop</h4>
                        <p className="text-sm text-muted-foreground">
                          Fully quit and reopen Claude Desktop for the changes to take effect. On macOS, make sure to quit from the menu bar — not just close the window.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Step 4: Authenticate</h4>
                        <p className="text-sm text-muted-foreground">
                          In a new Claude conversation, say something like: <em>"Authenticate with Tapestry using this token: tap_xxxxx"</em>. Claude will use the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">authenticate</code> tool automatically.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chatgpt">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Step 1: Open the config file</h4>
                        <p className="text-sm text-muted-foreground">
                          Locate and open your ChatGPT Desktop configuration file:
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Apple className="h-4 w-4 text-muted-foreground" />
                            <strong>macOS:</strong>
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono break-all">
                              ~/Library/Application Support/ChatGPT/chatgpt_mcp_config.json
                            </code>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <SiWindows className="h-4 w-4 text-muted-foreground" />
                            <strong>Windows:</strong>
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono break-all">
                              %APPDATA%\ChatGPT\chatgpt_mcp_config.json
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Step 2: Add the Tapestry MCP server</h4>
                        <p className="text-sm text-muted-foreground">
                          Paste the following JSON into the config file:
                        </p>
                        <div className="relative">
                          <pre className="bg-gray-950 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                            {chatgptConfig}
                          </pre>
                          <CopyButton text={chatgptConfig} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Step 3: Restart ChatGPT Desktop</h4>
                        <p className="text-sm text-muted-foreground">
                          Fully quit and reopen ChatGPT Desktop for the changes to take effect. On macOS, make sure to quit from the menu bar — not just close the window.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Step 4: Authenticate</h4>
                        <p className="text-sm text-muted-foreground">
                          In a new ChatGPT conversation, say something like: <em>"Authenticate with Tapestry using this token: tap_xxxxx"</em>. ChatGPT will use the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">authenticate</code> tool automatically.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>

            <section id="tools" className="mb-12 scroll-mt-24">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Available Tools
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left font-medium px-4 py-3">Tool</th>
                          <th className="text-left font-medium px-4 py-3">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mcpTools.map((tool, index) => (
                          <tr key={tool.name} className={index < mcpTools.length - 1 ? "border-b" : ""}>
                            <td className="px-4 py-3 align-top">
                              <Badge variant="secondary" className="font-mono text-xs whitespace-nowrap">
                                {tool.name}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{tool.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="examples" className="mb-16 scroll-mt-24">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Example Prompts
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                After authenticating, try asking your AI assistant any of these:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {examplePrompts.map((prompt) => (
                  <Card key={prompt} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex items-start gap-3">
                      <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm">{prompt}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}