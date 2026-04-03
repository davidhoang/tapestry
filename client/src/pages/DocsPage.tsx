import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Copy, Check, BookOpen, Terminal, MessageSquare,
  Lightbulb, ArrowLeft, Monitor, Apple, Package, Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const MCP_URL = "https://tapestry.design/mcp";

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

const cliCommands = [
  { cmd: "tapestry login <token>", desc: "Save your API token and authenticate" },
  { cmd: "tapestry whoami", desc: "Show your logged-in user and workspace" },
  { cmd: "tapestry designer search <query>", desc: "Search designers by name, title, or skills" },
  { cmd: "tapestry designer get <id>", desc: "Get full details for a designer" },
  { cmd: "tapestry designer add", desc: "Interactively create a new designer profile" },
  { cmd: "tapestry designer update <id>", desc: "Update a designer's information" },
  { cmd: "tapestry list ls", desc: "Show all lists in your workspace" },
  { cmd: "tapestry list create <name>", desc: "Create a new list" },
  { cmd: "tapestry list add <listId> <designerId>", desc: "Add a designer to a list" },
  { cmd: "tapestry list remove <listId> <designerId>", desc: "Remove a designer from a list" },
];

const sections = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "cli", label: "CLI", icon: Package },
  { id: "configuration", label: "MCP Configuration", icon: Terminal },
  { id: "tools", label: "Available Tools", icon: Monitor },
  { id: "examples", label: "Example Prompts", icon: Lightbulb },
];

function CopyIconButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #374151" }}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF5F57" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FEBC2E" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28C840" }} />
          {label && (
            <span className="ml-3 text-xs text-gray-400 font-mono">{label}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-gray-950 text-gray-100 px-5 py-4 text-sm font-mono overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function StepItem({
  number,
  title,
  isLast = false,
  children,
}: {
  number: number;
  title: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: "#C8944B" }}
        >
          {number}
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-2" style={{ backgroundColor: "#E6D5B7", minHeight: "12px" }} />
        )}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-8"}`}>
        <h4 className="font-semibold text-sm mb-3 leading-none" style={{ paddingTop: "6px" }}>{title}</h4>
        {children}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-7 pb-4 border-b">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#C8944B15" }}
      >
        <Icon className="h-5 w-5" style={{ color: "#C8944B" }} />
      </div>
      <h3 className="text-xl font-semibold">{children}</h3>
    </div>
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
    <div className="min-h-screen" style={{ backgroundColor: "#FBF8F3" }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "rgba(251,248,243,0.96)", backdropFilter: "blur(8px)" }}
      >
        <div className="container mx-auto px-4 h-14 flex items-center gap-4 max-w-7xl">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Tapestry</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold">Developer Docs</h1>
        </div>
      </header>

      {/* Hero banner */}
      <div
        className="border-b"
        style={{
          background: "linear-gradient(135deg, #FBF8F3 0%, #F5F2ED 55%, #EDE0CC 100%)",
        }}
      >
        <div className="container mx-auto px-4 max-w-7xl py-12 md:py-16">
          <div className="max-w-2xl">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: "#C8944B" }}
            >
              Tapestry Integrations
            </p>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Build with Tapestry</h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "#6B5549" }}>
              Connect Tapestry to your workflow. Manage designers from the terminal with the CLI,
              or use natural language through your AI assistant via MCP.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">MCP endpoint</span>
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-mono"
                style={{
                  backgroundColor: "rgba(255,255,255,0.85)",
                  border: "1px solid #E6D5B7",
                  color: "#B8843F",
                }}
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span>{MCP_URL}</span>
                <CopyIconButton text={MCP_URL} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex gap-0 py-10">
          {/* Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0 pr-8">
            <nav className="sticky top-24">
              <p
                className="text-xs font-bold uppercase tracking-wider px-3 mb-3"
                style={{ color: "#C8944B" }}
              >
                On this page
              </p>
              <div className="space-y-0.5">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all ${
                        isActive
                          ? "font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                      }`}
                      style={{
                        borderLeft: `2px solid ${isActive ? "#C8944B" : "transparent"}`,
                        color: isActive ? "#C8944B" : undefined,
                        backgroundColor: isActive ? "#C8944B0D" : undefined,
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {section.label}
                    </a>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Sidebar divider */}
          <div className="hidden lg:block w-px bg-border shrink-0 mr-10" />

          {/* Main content */}
          <main className="flex-1 min-w-0 max-w-3xl">

            {/* Getting Started */}
            <section id="getting-started" className="mb-14 scroll-mt-24">
              <SectionHeader icon={BookOpen}>Getting Started</SectionHeader>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <a
                  href="#cli"
                  className="block rounded-xl p-6 transition-all hover:shadow-md"
                  style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("cli")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#C8944B12" }}
                  >
                    <Package className="h-6 w-6" style={{ color: "#C8944B" }} />
                  </div>
                  <h4 className="font-semibold text-base mb-2">CLI</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Manage designers from your terminal. Install{" "}
                    <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">tapestry-cli</code>{" "}
                    and run commands directly.
                  </p>
                  <span className="text-sm font-semibold" style={{ color: "#C8944B" }}>
                    CLI setup →
                  </span>
                </a>
                <a
                  href="#configuration"
                  className="block rounded-xl p-6 transition-all hover:shadow-md"
                  style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("configuration")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#C8944B12" }}
                  >
                    <Terminal className="h-6 w-6" style={{ color: "#C8944B" }} />
                  </div>
                  <h4 className="font-semibold text-base mb-2">MCP (AI assistants)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Connect to Claude Desktop or ChatGPT Desktop and manage your talent pool through
                    natural language.
                  </p>
                  <span className="text-sm font-semibold" style={{ color: "#C8944B" }}>
                    MCP setup →
                  </span>
                </a>
              </div>
              <div
                className="rounded-xl px-5 py-4"
                style={{
                  backgroundColor: "#FBF8F3",
                  border: "1px solid #E6D5B7",
                  borderLeft: "4px solid #C8944B",
                }}
              >
                <p className="text-sm font-semibold mb-1">Both options need an API token</p>
                <p className="text-sm text-muted-foreground">
                  Go to <strong>Settings → API Tokens</strong> to generate a token. It will start
                  with <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">tap_</code>.
                </p>
              </div>
            </section>

            {/* CLI */}
            <section id="cli" className="mb-14 scroll-mt-24">
              <SectionHeader icon={Package}>CLI</SectionHeader>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                The Tapestry CLI lets you search, add, and manage designers directly from your
                terminal — no browser needed. Useful for scripting, bulk work, or just staying in
                your flow.
              </p>

              {/* Steps */}
              <div
                className="rounded-xl p-6 mb-6"
                style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}
              >
                <StepItem number={1} title="Install">
                  <CodeBlock code="npm install -g tapestry-cli" />
                  <p className="text-sm text-muted-foreground mt-3">
                    Or run without installing:{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                      npx tapestry-cli &lt;command&gt;
                    </code>
                  </p>
                </StepItem>

                <StepItem number={2} title="Get an API token">
                  <p className="text-sm text-muted-foreground">
                    In Tapestry, go to <strong>Settings → API Tokens</strong>, click{" "}
                    <strong>Generate token</strong>, give it a name like "CLI", and copy it. Your
                    token will start with{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">tap_</code>.
                  </p>
                </StepItem>

                <StepItem number={3} title="Log in">
                  <CodeBlock code="tapestry login tap_your_token_here" />
                  <p className="text-sm text-muted-foreground mt-3">
                    Your token is saved to{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                      ~/.tapestry/config.json
                    </code>{" "}
                    and reused automatically from then on.
                  </p>
                </StepItem>

                <StepItem number={4} title="Try it out" isLast>
                  <CodeBlock code="tapestry whoami" />
                </StepItem>
              </div>

              {/* Commands table */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #E6D5B7" }}
              >
                <div
                  className="px-5 py-4 border-b"
                  style={{ backgroundColor: "#F5F2ED", borderColor: "#E6D5B7" }}
                >
                  <h4 className="font-semibold text-sm">Available commands</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className="border-b"
                        style={{ backgroundColor: "#FAFAF8", borderColor: "#E6D5B7" }}
                      >
                        <th
                          className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wider"
                          style={{ color: "#8B7355" }}
                        >
                          Command
                        </th>
                        <th
                          className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wider"
                          style={{ color: "#8B7355" }}
                        >
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cliCommands.map((row, i) => (
                        <tr
                          key={row.cmd}
                          className="border-b last:border-0"
                          style={{
                            backgroundColor: i % 2 === 1 ? "#FBF8F3" : "white",
                            borderColor: "#F0E6D3",
                          }}
                        >
                          <td className="px-5 py-3 align-top">
                            <code
                              className="text-xs font-mono whitespace-nowrap font-semibold"
                              style={{ color: "#B8843F" }}
                            >
                              {row.cmd}
                            </code>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  className="px-5 py-3 border-t text-xs text-muted-foreground"
                  style={{ backgroundColor: "#F5F2ED", borderColor: "#E6D5B7" }}
                >
                  Add{" "}
                  <code className="bg-muted px-1 py-0.5 rounded font-mono">--json</code> to any
                  command for machine-readable output.
                </div>
              </div>
            </section>

            {/* MCP Configuration */}
            <section id="configuration" className="mb-14 scroll-mt-24">
              <SectionHeader icon={Terminal}>MCP Configuration</SectionHeader>

              <Tabs defaultValue="claude">
                <TabsList className="mb-6">
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
                  <div
                    className="rounded-xl p-6"
                    style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}
                  >
                    <StepItem number={1} title="Open the config file">
                      <p className="text-sm text-muted-foreground mb-3">
                        Locate and open your Claude Desktop configuration file:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <Apple className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <strong>macOS:</strong>{" "}
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono break-all">
                              ~/Library/Application Support/Claude/claude_desktop_config.json
                            </code>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Monitor className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <strong>Windows:</strong>{" "}
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono break-all">
                              %APPDATA%\Claude\claude_desktop_config.json
                            </code>
                          </div>
                        </div>
                      </div>
                    </StepItem>

                    <StepItem number={2} title="Add the Tapestry MCP server">
                      <p className="text-sm text-muted-foreground mb-3">
                        Paste the following JSON into the config file:
                      </p>
                      <CodeBlock code={claudeConfig} label="claude_desktop_config.json" />
                    </StepItem>

                    <StepItem number={3} title="Restart Claude Desktop">
                      <p className="text-sm text-muted-foreground">
                        Fully quit and reopen Claude Desktop for the changes to take effect. On
                        macOS, make sure to quit from the menu bar — not just close the window.
                      </p>
                    </StepItem>

                    <StepItem number={4} title="Authenticate" isLast>
                      <p className="text-sm text-muted-foreground">
                        In a new Claude conversation, say something like:{" "}
                        <em>"Authenticate with Tapestry using this token: tap_xxxxx"</em>. Claude
                        will use the{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                          authenticate
                        </code>{" "}
                        tool automatically.
                      </p>
                    </StepItem>
                  </div>
                </TabsContent>

                <TabsContent value="chatgpt">
                  <div
                    className="rounded-xl p-6"
                    style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}
                  >
                    <StepItem number={1} title="Open the config file">
                      <p className="text-sm text-muted-foreground mb-3">
                        Locate and open your ChatGPT Desktop configuration file:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <Apple className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <strong>macOS:</strong>{" "}
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono break-all">
                              ~/Library/Application Support/ChatGPT/chatgpt_mcp_config.json
                            </code>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Monitor className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <strong>Windows:</strong>{" "}
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono break-all">
                              %APPDATA%\ChatGPT\chatgpt_mcp_config.json
                            </code>
                          </div>
                        </div>
                      </div>
                    </StepItem>

                    <StepItem number={2} title="Add the Tapestry MCP server">
                      <p className="text-sm text-muted-foreground mb-3">
                        Paste the following JSON into the config file:
                      </p>
                      <CodeBlock code={chatgptConfig} label="chatgpt_mcp_config.json" />
                    </StepItem>

                    <StepItem number={3} title="Restart ChatGPT Desktop">
                      <p className="text-sm text-muted-foreground">
                        Fully quit and reopen ChatGPT Desktop for the changes to take effect. On
                        macOS, make sure to quit from the menu bar — not just close the window.
                      </p>
                    </StepItem>

                    <StepItem number={4} title="Authenticate" isLast>
                      <p className="text-sm text-muted-foreground">
                        In a new ChatGPT conversation, say something like:{" "}
                        <em>"Authenticate with Tapestry using this token: tap_xxxxx"</em>. ChatGPT
                        will use the{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                          authenticate
                        </code>{" "}
                        tool automatically.
                      </p>
                    </StepItem>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* Available Tools */}
            <section id="tools" className="mb-14 scroll-mt-24">
              <SectionHeader icon={Monitor}>Available Tools</SectionHeader>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E6D5B7" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className="border-b"
                        style={{ backgroundColor: "#F5F2ED", borderColor: "#E6D5B7" }}
                      >
                        <th
                          className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wider"
                          style={{ color: "#8B7355" }}
                        >
                          Tool
                        </th>
                        <th
                          className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wider"
                          style={{ color: "#8B7355" }}
                        >
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mcpTools.map((tool, index) => (
                        <tr
                          key={tool.name}
                          className="border-b last:border-0"
                          style={{
                            backgroundColor: index % 2 === 1 ? "#FBF8F3" : "white",
                            borderColor: "#F0E6D3",
                          }}
                        >
                          <td className="px-5 py-3 align-top">
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs whitespace-nowrap"
                              style={{
                                backgroundColor: "#C8944B12",
                                color: "#B8843F",
                                border: "1px solid #E6D5B7",
                              }}
                            >
                              {tool.name}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{tool.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Example Prompts */}
            <section id="examples" className="mb-16 scroll-mt-24">
              <SectionHeader icon={Lightbulb}>Example Prompts</SectionHeader>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                After authenticating, try asking your AI assistant any of these:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {examplePrompts.map((prompt) => (
                  <div
                    key={prompt}
                    className="rounded-xl p-4 flex items-start gap-3"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #E6D5B7",
                      borderLeft: "3px solid #C8944B",
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#C8944B" }} />
                    <p className="text-sm">{prompt}</p>
                  </div>
                ))}
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
