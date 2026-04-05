import { useState, useEffect, type ReactNode, type ElementType } from "react";
import { Link } from "wouter";
import {
  Copy, Check, BookOpen, Terminal, MessageSquare,
  Lightbulb, ArrowLeft, Monitor, Apple, Package, Globe,
  Zap, Shield, RefreshCw, Database, ChevronRight,
  AlertCircle, Info, Key, Code2, Layers, ArrowRight,
  Activity, Search, UserPlus, List, FileText, Sparkles,
  ExternalLink, Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const MCP_URL = "https://tapestry.design/mcp";
const BASE_URL = "https://tapestry.design";

// ─── Tool definitions with parameters ────────────────────────────────────────

type ToolParam = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

type McpTool = {
  name: string;
  category: string;
  description: string;
  params: ToolParam[];
  returns?: string;
};

const mcpTools: McpTool[] = [
  {
    name: "authenticate",
    category: "auth",
    description: "Authenticate with your Tapestry API token. Must be called before any other tool.",
    params: [
      { name: "token", type: "string", required: true, description: "Your API token starting with tap_" },
    ],
    returns: "Confirmation with your user email and workspace name.",
  },
  {
    name: "search_designers",
    category: "designers",
    description: "Search designers by name, title, company, skills, or location with pagination.",
    params: [
      { name: "query", type: "string", required: false, description: "Free-text search (name, title, company, email)" },
      { name: "skill", type: "string", required: false, description: "Filter by specific skill" },
      { name: "location", type: "string", required: false, description: "Filter by location" },
      { name: "limit", type: "number", required: false, description: "Max results (default 20, max 50)" },
      { name: "offset", type: "number", required: false, description: "Pagination offset (default 0)" },
    ],
    returns: "{ results, total, count, offset, hasMore }",
  },
  {
    name: "quick_search",
    category: "designers",
    description: "Lightweight search returning only id, name, and title — ideal for lookups before detailed queries.",
    params: [
      { name: "query", type: "string", required: true, description: "Search term (matches name or title)" },
      { name: "limit", type: "number", required: false, description: "Max results (default 10, max 25)" },
    ],
    returns: "Array of { id, name, title }",
  },
  {
    name: "get_designer",
    category: "designers",
    description: "Retrieve the full profile for a specific designer including skills, bio, availability, and metadata.",
    params: [
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
    ],
    returns: "Full designer object with all fields.",
  },
  {
    name: "create_designer",
    category: "designers",
    description: "Add a new designer to your workspace.",
    params: [
      { name: "name", type: "string", required: true, description: "Full name" },
      { name: "title", type: "string", required: true, description: "Job title (e.g. Senior Product Designer)" },
      { name: "level", type: "string", required: true, description: "Seniority: Junior | Mid | Senior | Lead | Principal | Staff" },
      { name: "skills", type: "string[]", required: true, description: "Array of skill strings" },
      { name: "company", type: "string", required: false, description: "Current employer" },
      { name: "location", type: "string", required: false, description: "City/region" },
      { name: "email", type: "string", required: false, description: "Contact email" },
      { name: "linkedIn", type: "string", required: false, description: "LinkedIn profile URL" },
      { name: "website", type: "string", required: false, description: "Personal site or portfolio URL" },
      { name: "available", type: "boolean", required: false, description: "Open to opportunities (default false)" },
    ],
    returns: "Newly created designer object with assigned ID.",
  },
  {
    name: "update_designer",
    category: "designers",
    description: "Update any fields on an existing designer profile. Only supplied fields are changed.",
    params: [
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
      { name: "name", type: "string", required: false, description: "Updated name" },
      { name: "title", type: "string", required: false, description: "Updated title" },
      { name: "company", type: "string", required: false, description: "Updated company" },
      { name: "location", type: "string", required: false, description: "Updated location" },
      { name: "email", type: "string", required: false, description: "Updated email" },
      { name: "skills", type: "string[]", required: false, description: "Replaces skill list entirely" },
      { name: "available", type: "boolean", required: false, description: "Availability status" },
    ],
  },
  {
    name: "get_designer_timeline",
    category: "designers",
    description: "Retrieve the activity timeline for a designer — notes, outreach, status changes, and system events.",
    params: [
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
      { name: "limit", type: "number", required: false, description: "Max entries (default 20, max 100)" },
    ],
    returns: "Array of timeline events with type, content, source, and timestamp.",
  },
  {
    name: "add_note",
    category: "designers",
    description: "Append a freeform note to a designer's timeline. Useful for logging calls, impressions, or follow-ups.",
    params: [
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
      { name: "content", type: "string", required: true, description: "The note text" },
    ],
    returns: "Confirmation with the created timeline event.",
  },
  {
    name: "workspace_info",
    category: "workspace",
    description: "Get metadata about your current workspace — name, slug, role, member count, and stats.",
    params: [],
    returns: "Workspace object with usage stats.",
  },
  {
    name: "list_lists",
    category: "lists",
    description: "Retrieve all curated designer lists in your workspace.",
    params: [],
    returns: "Array of list objects with name, description, and designer count.",
  },
  {
    name: "get_list_designers",
    category: "lists",
    description: "Get all designers within a specific list.",
    params: [
      { name: "listId", type: "number", required: true, description: "The list's numeric ID" },
    ],
    returns: "{ list, designers, total }",
  },
  {
    name: "create_list",
    category: "lists",
    description: "Create a new designer list in your workspace.",
    params: [
      { name: "name", type: "string", required: true, description: "List name" },
      { name: "description", type: "string", required: false, description: "Optional description" },
      { name: "isPublic", type: "boolean", required: false, description: "Whether the list is publicly shareable (default false)" },
    ],
    returns: "The newly created list object.",
  },
  {
    name: "add_designer_to_list",
    category: "lists",
    description: "Add a designer to a list, optionally attaching context notes.",
    params: [
      { name: "listId", type: "number", required: true, description: "The list's numeric ID" },
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
      { name: "notes", type: "string", required: false, description: "Why they were added (stored in list membership)" },
    ],
  },
  {
    name: "remove_designer_from_list",
    category: "lists",
    description: "Remove a designer from a list.",
    params: [
      { name: "listId", type: "number", required: true, description: "The list's numeric ID" },
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
    ],
  },
  {
    name: "enrich_designer",
    category: "enrichment",
    description: "Use AI to find additional publicly available information about a designer and surface suggestions.",
    params: [
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
    ],
    returns: "Enrichment suggestions for email, location, LinkedIn, skills, and bio.",
  },
  {
    name: "enrich_designer_from_url",
    category: "enrichment",
    description: "Extract designer information from a URL — portfolio sites, Dribbble, Behance, or personal websites.",
    params: [
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
      { name: "url", type: "string", required: true, description: "URL to extract from (portfolio, Dribbble, Behance, etc.)" },
    ],
    returns: "Extracted fields with confidence scores.",
  },
  {
    name: "apply_enrichment",
    category: "enrichment",
    description: "Apply specific enrichment suggestions to a designer's live profile. Only passed fields are updated.",
    params: [
      { name: "designerId", type: "number", required: true, description: "The designer's numeric ID" },
      { name: "email", type: "string", required: false, description: "Email to apply" },
      { name: "location", type: "string", required: false, description: "Location to apply" },
      { name: "company", type: "string", required: false, description: "Company to apply" },
      { name: "title", type: "string", required: false, description: "Title to apply" },
      { name: "linkedIn", type: "string", required: false, description: "LinkedIn URL to apply" },
      { name: "website", type: "string", required: false, description: "Website to apply" },
      { name: "skills", type: "string[]", required: false, description: "Skills to apply" },
      { name: "bio", type: "string", required: false, description: "Bio/description to apply" },
    ],
  },
  {
    name: "bulk_enrich_designers",
    category: "enrichment",
    description: "Enrich multiple designer profiles in a single call. Runs enrichment concurrently. Max 10 per call.",
    params: [
      { name: "designerIds", type: "number[]", required: true, description: "Array of designer IDs (max 10)" },
    ],
    returns: "Array of enrichment results keyed by designer ID.",
  },
];

const toolCategories = [
  { id: "auth", label: "Auth", color: "#7C3AED" },
  { id: "designers", label: "Designers", color: "#C8944B" },
  { id: "workspace", label: "Workspace", color: "#0891B2" },
  { id: "lists", label: "Lists", color: "#059669" },
  { id: "enrichment", label: "Enrichment", color: "#DC2626" },
];

// ─── Example prompts, grouped by use case ────────────────────────────────────

const promptGroups = [
  {
    title: "Find talent",
    icon: Search,
    prompts: [
      "Search for product designers in San Francisco with Figma experience",
      "Find senior UX researchers available for freelance work",
      "Show me all designers with motion design or After Effects skills",
      "Who in my network has experience with design systems at scale?",
    ],
  },
  {
    title: "Manage profiles",
    icon: UserPlus,
    prompts: [
      "Create a new designer: Jane Smith, Lead Product Designer at Stripe, based in NYC",
      "Update designer #42 — they just moved to Berlin and are now available",
      "Add a note to designer #15: spoke today, interested in 0→1 roles, follow up in Q2",
      "Enrich the profile for designer #28 and apply their LinkedIn and skills",
    ],
  },
  {
    title: "Curate lists",
    icon: List,
    prompts: [
      "Create a list called 'Q3 Candidates' for our upcoming product design hire",
      "Show me everyone on the 'Potential Hires' list",
      "Add designer #42 to the Q3 Candidates list — strong portfolio, met at Config",
      "What lists do I have and how many designers are in each?",
    ],
  },
  {
    title: "Bulk operations",
    icon: Sparkles,
    prompts: [
      "Enrich designers 10, 14, 22, and 31 all at once",
      "Enrich designer 55 from their Dribbble: https://dribbble.com/janesmith",
      "Show me the timeline for designer #7 — did we ever follow up?",
      "What's the current state of my workspace — how many designers and lists?",
    ],
  },
];

// ─── Navigation sections ──────────────────────────────────────────────────────

const sections = [
  {
    id: "overview", label: "Overview", icon: BookOpen, children: [
      { id: "what-is-tapestry", label: "What is Tapestry?" },
      { id: "auth-tokens", label: "API Tokens" },
    ]
  },
  {
    id: "mcp", label: "MCP Integration", icon: Zap, children: [
      { id: "what-is-mcp", label: "What is MCP?" },
      { id: "mcp-claude-desktop", label: "Claude Desktop" },
      { id: "mcp-claude-code", label: "Claude Code" },
      { id: "mcp-chatgpt", label: "ChatGPT Desktop" },
      { id: "mcp-cursor", label: "Cursor" },
      { id: "mcp-verify", label: "Verify & Authenticate" },
    ]
  },
  {
    id: "tools", label: "Tool Reference", icon: Terminal, children: [
      { id: "tools-auth", label: "Auth" },
      { id: "tools-designers", label: "Designers" },
      { id: "tools-lists", label: "Lists" },
      { id: "tools-enrichment", label: "Enrichment" },
    ]
  },
  {
    id: "cli", label: "CLI", icon: Package, children: [
      { id: "cli-install", label: "Installation" },
      { id: "cli-commands", label: "Commands" },
      { id: "cli-scripting", label: "Scripting" },
    ]
  },
  {
    id: "rest-api", label: "REST API", icon: Globe, children: [
      { id: "api-auth", label: "Authentication" },
      { id: "api-endpoints", label: "Endpoints" },
      { id: "api-caching", label: "Caching" },
    ]
  },
  {
    id: "examples", label: "Example Prompts", icon: Lightbulb, children: [],
  },
  {
    id: "troubleshooting", label: "Troubleshooting", icon: AlertCircle, children: [],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="text-gray-400 hover:text-gray-200 transition-colors" title="Copy">
      {copied
        ? <Check className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        : <Copy className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
    </button>
  );
}

function CodeBlock({
  code, lang = "bash", label, className,
}: { code: string; lang?: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={cn("rounded-xl overflow-hidden", className)} style={{ border: "1px solid #1F2937" }}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          {label && <span className="ml-3 text-xs font-mono text-gray-500">{label}</span>}
          {!label && lang && <span className="ml-3 text-xs font-mono text-gray-600">{lang}</span>}
        </div>
        <button
          onClick={handle}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre
        className="bg-gray-950 text-gray-100 px-5 py-4 text-[13px] font-mono overflow-x-auto leading-relaxed"
        style={{ tabSize: 2 }}
      >{code}</pre>
    </div>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 text-xs font-mono">
      {children}
    </code>
  );
}

function Callout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warn" | "tip";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    info: { border: "#3B82F6", bg: "#EFF6FF", icon: Info, color: "#2563EB", labelColor: "#1D4ED8" },
    warn: { border: "#F59E0B", bg: "#FFFBEB", icon: AlertCircle, color: "#D97706", labelColor: "#B45309" },
    tip: { border: "#C8944B", bg: "#FBF8F3", icon: Lightbulb, color: "#C8944B", labelColor: "#B8843F" },
  }[type];
  const Icon = styles.icon;
  return (
    <div
      className="rounded-xl px-5 py-4 flex gap-3"
      style={{ backgroundColor: styles.bg, borderLeft: `3px solid ${styles.border}`, border: `1px solid ${styles.border}30` }}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: styles.color }} />
      <div className="min-w-0">
        {title && <p className="text-sm font-semibold mb-1" style={{ color: styles.labelColor }}>{title}</p>}
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-28" />;
}

function SectionHeading({
  icon: Icon,
  children,
  id,
  sub,
}: {
  icon?: ElementType;
  children: ReactNode;
  id?: string;
  sub?: boolean;
}) {
  if (sub) {
    return (
      <div className="mb-4 mt-10 first:mt-0">
        {id && <SectionAnchor id={id} />}
        <h4 className="text-base font-semibold text-foreground">{children}</h4>
        <div className="mt-2 h-px" style={{ backgroundColor: "#E6D5B720" }} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 mb-7 pb-4 border-b border-border">
      {id && <SectionAnchor id={id} />}
      {Icon && (
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#C8944B15" }}
        >
          <Icon className="h-5 w-5" style={{ color: "#C8944B" }} />
        </div>
      )}
      <h3 className="text-xl font-semibold">{children}</h3>
    </div>
  );
}

function StepItem({
  number, title, isLast = false, children,
}: { number: number; title: string; isLast?: boolean; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: "#C8944B" }}
        >
          {number}
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-2 mb-0" style={{ backgroundColor: "#E6D5B7", minHeight: "16px" }} />
        )}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-8"}`}>
        <h5 className="font-semibold text-sm mb-3" style={{ paddingTop: "4px" }}>{title}</h5>
        {children}
      </div>
    </div>
  );
}

function ParamTable({ params }: { params: ToolParam[] }) {
  return (
    <div className="rounded-lg overflow-hidden text-sm" style={{ border: "1px solid #E6D5B7" }}>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: "#F5F2ED", borderBottom: "1px solid #E6D5B7" }}>
            {["Parameter", "Type", "Required", "Description"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B7355" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              style={{ backgroundColor: i % 2 === 1 ? "#FBF8F3" : "white", borderTop: "1px solid #F0E6D3" }}
            >
              <td className="px-4 py-2.5 align-top">
                <code className="text-xs font-mono font-semibold" style={{ color: "#B8843F" }}>{p.name}</code>
              </td>
              <td className="px-4 py-2.5 align-top">
                <code className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{p.type}</code>
              </td>
              <td className="px-4 py-2.5 align-top">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: p.required ? "#FEF3C7" : "#F3F4F6",
                    color: p.required ? "#92400E" : "#6B7280",
                  }}
                >
                  {p.required ? "required" : "optional"}
                </span>
              </td>
              <td className="px-4 py-2.5 align-top text-muted-foreground text-xs leading-relaxed">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToolCard({ tool }: { tool: McpTool }) {
  const cat = toolCategories.find((c) => c.id === tool.category);
  return (
    <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid #E6D5B7" }}>
      <div
        className="px-5 py-4 flex items-center justify-between gap-4"
        style={{ backgroundColor: "#FAFAF8", borderBottom: "1px solid #E6D5B7" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <code
            className="text-sm font-mono font-bold shrink-0"
            style={{ color: cat?.color ?? "#C8944B" }}
          >
            {tool.name}
          </code>
          {cat && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
            >
              {cat.label}
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-4 bg-white">
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{tool.description}</p>
        {tool.params.length > 0 ? (
          <ParamTable params={tool.params} />
        ) : (
          <p className="text-xs text-muted-foreground italic">No parameters required.</p>
        )}
        {tool.returns && (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Returns: </span>{tool.returns}
          </p>
        )}
      </div>
    </div>
  );
}

function PlatformBadge({ os }: { os: "mac" | "win" | "linux" }) {
  const map = {
    mac: { icon: Apple, label: "macOS" },
    win: { icon: Monitor, label: "Windows" },
    linux: { icon: Terminal, label: "Linux" },
  }[os];
  const Icon = map.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {map.label}
    </span>
  );
}

function PathRow({ os, path }: { os: "mac" | "win" | "linux"; path: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0 border-border">
      <div className="w-16 shrink-0 mt-0.5">
        <PlatformBadge os={os} />
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <code
          className="text-xs font-mono break-all leading-relaxed flex-1"
          style={{ color: "#B8843F" }}
        >
          {path}
        </code>
        <CopyButton text={path} size="xs" />
      </div>
    </div>
  );
}

// ─── Config snippets ──────────────────────────────────────────────────────────

const claudeDesktopConfig = JSON.stringify({ mcpServers: { tapestry: { command: "npx", args: ["-y", "mcp-remote", MCP_URL] } } }, null, 2);

const claudeCodeConfig = `# Add via CLI (recommended)
claude mcp add tapestry --transport http \\
  --url ${MCP_URL} \\
  --header "Authorization: Bearer tap_your_token_here"

# Or add to .claude/settings.json manually:
# {
#   "mcpServers": {
#     "tapestry": {
#       "type": "http",
#       "url": "${MCP_URL}",
#       "headers": { "Authorization": "Bearer tap_your_token_here" }
#     }
#   }
# }`;

const chatgptConfig = JSON.stringify({ mcpServers: { tapestry: { type: "url", url: MCP_URL } } }, null, 2);

const cursorConfig = JSON.stringify({
  mcpServers: {
    tapestry: {
      command: "npx",
      args: ["-y", "mcp-remote", MCP_URL],
    },
  },
}, null, 2);

const healthCheck = `curl ${MCP_URL}/health
# → {"status":"ok","service":"tapestry-mcp"}`;

const loginExample = `tapestry login tap_your_token_here

# ✓ Authenticated as you@company.com in workspace "My Workspace" (role: admin)`;

const whoamiExample = `tapestry whoami

# User:      you@company.com
# Workspace: My Workspace (my-workspace)
# Role:      admin
# Designers: 142
# Lists:     8`;

const cliSearchExample = `# Free-text search
tapestry designer search "ux researcher"

# Filter by skill
tapestry designer search --skill "Figma"

# Combine filters
tapestry designer search --skill "Figma" --location "San Francisco" --limit 50`;

const cliAddExample = `tapestry designer add \\
  --name "Jane Smith" \\
  --title "Senior Product Designer" \\
  --level "Senior" \\
  --skills "Figma,UX Research,Prototyping" \\
  --company "Acme Corp" \\
  --location "New York, NY" \\
  --email "jane@example.com" \\
  --linkedin "https://linkedin.com/in/janesmith" \\
  --website "https://janesmith.design"`;

const scriptingExample = `#!/bin/bash
# Export available designers with Figma skills to JSON
tapestry designer search --skill "Figma" --available --limit 100 --json \\
  | jq '[.results[] | {id, name, title, location}]' \\
  > figma-designers.json

# Find a designer by name, grab their ID
ID=$(tapestry designer search "Jane Smith" --json | jq '.results[0].id')

# Add them to a list with notes
tapestry list add 3 "$ID" --notes "Strong portfolio, met at Config"

# Bulk update — mark all designers at Stripe as available
tapestry designer search --company "Stripe" --json \\
  | jq -r '.results[].id' \\
  | xargs -I {} tapestry designer update {} --available`;

const cliCommands = [
  { group: "Auth", rows: [
    { cmd: "tapestry login <token>", desc: "Save API token and authenticate" },
    { cmd: "tapestry login <token> --url <url>", desc: "Authenticate against a custom server" },
    { cmd: "tapestry logout", desc: "Remove saved credentials" },
    { cmd: "tapestry whoami", desc: "Show user, workspace, role, and stats" },
  ]},
  { group: "Designers", rows: [
    { cmd: "tapestry designer search [query]", desc: "Search by name, title, or filters" },
    { cmd: "tapestry designer search --skill <s>", desc: "Filter by skill" },
    { cmd: "tapestry designer search --location <l>", desc: "Filter by location" },
    { cmd: "tapestry designer search --available", desc: "Only available designers" },
    { cmd: "tapestry designer get <id>", desc: "Full profile for a designer" },
    { cmd: "tapestry designer add [flags]", desc: "Create a new designer" },
    { cmd: "tapestry designer update <id> [flags]", desc: "Update designer fields" },
  ]},
  { group: "Lists", rows: [
    { cmd: "tapestry list ls", desc: "All lists with counts" },
    { cmd: "tapestry list create --name <n>", desc: "Create a new list" },
    { cmd: "tapestry list add <listId> <designerId>", desc: "Add a designer to a list" },
    { cmd: "tapestry list add ... --notes <text>", desc: "Add with membership notes" },
    { cmd: "tapestry list remove <listId> <designerId>", desc: "Remove from a list" },
  ]},
  { group: "Global flags", rows: [
    { cmd: "--json", desc: "Machine-readable JSON output (pipe to jq)" },
    { cmd: "--help", desc: "Help for any command" },
    { cmd: "--version", desc: "CLI version number" },
  ]},
];

const restEndpoints = [
  { method: "POST", path: "/api/mobile/login", desc: "Authenticate, receive JWT access + refresh tokens" },
  { method: "POST", path: "/api/mobile/refresh", desc: "Exchange a refresh token for new tokens" },
  { method: "GET", path: "/api/mobile/user", desc: "Current authenticated user" },
  { method: "GET", path: "/api/mobile/workspaces", desc: "User's workspaces" },
  { method: "GET", path: "/api/mobile/recommendations", desc: "AI-powered designer recommendations" },
  { method: "GET", path: "/api/mobile/designers", desc: "Search/list designers (query, skill, location, limit, offset)" },
  { method: "GET", path: "/api/mobile/designers/:id", desc: "Full designer profile" },
  { method: "GET", path: "/api/mobile/designers/:id/timeline", desc: "Designer timeline events" },
  { method: "GET", path: "/api/mobile/lists", desc: "All lists in workspace" },
  { method: "GET", path: "/api/mobile/lists/:id/designers", desc: "Designers in a specific list" },
];

const methodColors: Record<string, { bg: string; text: string }> = {
  GET: { bg: "#DCFCE7", text: "#166534" },
  POST: { bg: "#DBEAFE", text: "#1E40AF" },
  PATCH: { bg: "#FEF9C3", text: "#854D0E" },
  DELETE: { bg: "#FEE2E2", text: "#991B1B" },
};

const troubleshootItems = [
  {
    q: "\"Not logged in\" error in the CLI",
    a: "Run `tapestry login tap_your_token_here` first. Your credentials are stored in `~/.tapestry/config.json`.",
  },
  {
    q: "\"Invalid or expired API token\"",
    a: "Your token may have been revoked or has never been set. Go to Settings → API Tokens, generate a new token, and log in again.",
  },
  {
    q: "Tapestry doesn't appear in Claude's tool menu",
    a: "Make sure you fully quit and restarted Claude Desktop (use Quit from the menu bar, not just close the window). Then open a new conversation.",
  },
  {
    q: "\"MCP connection refused\" in Claude Desktop",
    a: `Check that the MCP URL is correct: ${MCP_URL}. Verify it's reachable with: curl ${MCP_URL}/health`,
  },
  {
    q: "Claude Code says \"No MCP servers configured\"",
    a: "Run `claude mcp list` to see registered servers. Re-add with `claude mcp add tapestry --transport http --url " + MCP_URL + "`.",
  },
  {
    q: "Enrichment returns low-confidence or empty results",
    a: "Some sites (e.g. LinkedIn) block automated access. Personal portfolio sites and Dribbble/Behance work best. Use `enrich_designer_from_url` with a direct portfolio link.",
  },
  {
    q: "Commands not found after npm install -g",
    a: "Your npm global bin directory may not be in $PATH. Run `npm bin -g` to find the path and add it to your shell profile (~/.zshrc or ~/.bashrc).",
  },
  {
    q: "\"Your role does not allow this operation\"",
    a: "Some write operations require editor, admin, or owner role. Check your role with `tapestry whoami`.",
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activeSection }: { activeSection: string }) {
  return (
    <nav className="sticky top-24 space-y-0.5">
      <p className="text-xs font-bold uppercase tracking-wider px-3 mb-3" style={{ color: "#C8944B" }}>
        Documentation
      </p>
      {sections.map((section) => {
        const Icon = section.icon;
        const isActiveParent = activeSection === section.id || section.children.some((c) => c.id === activeSection);
        return (
          <div key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md transition-all",
                isActiveParent
                  ? "font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5"
              )}
              style={isActiveParent ? {
                borderLeft: "2px solid #C8944B",
                color: "#C8944B",
                backgroundColor: "#C8944B0D",
              } : { borderLeft: "2px solid transparent" }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {section.label}
            </a>
            {section.children.length > 0 && isActiveParent && (
              <div className="ml-6 mt-0.5 space-y-0.5 pl-3 border-l border-border">
                {section.children.map((child) => {
                  const isActive = activeSection === child.id;
                  return (
                    <a
                      key={child.id}
                      href={`#${child.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(child.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={cn(
                        "block py-1 text-xs transition-colors rounded",
                        isActive
                          ? "font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      style={{ color: isActive ? "#C8944B" : undefined }}
                    >
                      {child.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const allSectionIds = sections.flatMap((s) => [
    s.id,
    ...s.children.map((c) => c.id),
  ]);

  useEffect(() => {
    const onScroll = () => {
      for (let i = allSectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(allSectionIds[i]);
        if (el && el.getBoundingClientRect().top <= 130) {
          setActiveSection(allSectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FBF8F3" }}>

      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "rgba(251,248,243,0.97)", backdropFilter: "blur(10px)" }}
      >
        <div className="container mx-auto px-4 h-14 flex items-center gap-4 max-w-7xl">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Tapestry</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold text-foreground">Developer Documentation</h1>
          <div className="ml-auto flex items-center gap-3">
            <a
              href={`${MCP_URL}/health`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Activity className="h-3.5 w-3.5" />
              API status
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div
        className="border-b"
        style={{
          background: "linear-gradient(135deg, #1C1917 0%, #292524 40%, #1C1917 100%)",
        }}
      >
        <div className="container mx-auto px-4 max-w-7xl py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-5">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#C8944B" }}
              >
                Developer Docs
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-xs text-gray-500">v1.0</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-tight">
              Build with Tapestry
            </h2>
            <p className="text-lg leading-relaxed mb-10" style={{ color: "#A8967A" }}>
              A platform for managing your design talent network — with a Model Context Protocol server
              that puts your entire roster inside your AI assistant, a CLI for terminal-first workflows,
              and a REST API for mobile and custom integrations.
            </p>

            {/* Quick cards */}
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Zap, label: "MCP", desc: "Claude, Cursor, ChatGPT", href: "mcp" },
                { icon: Package, label: "CLI", desc: "Terminal tool chain", href: "cli" },
                { icon: Globe, label: "REST API", desc: "Mobile & programmatic", href: "rest-api" },
              ].map(({ icon: Icon, label, desc, href }) => (
                <a
                  key={href}
                  href={`#${href}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(href)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all cursor-pointer"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#C8944B22" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#C8944B" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{label}</p>
                    <p className="text-xs" style={{ color: "#7A6A58" }}>{desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-600 group-hover:text-amber-500 transition-colors" />
                </a>
              ))}
            </div>

            {/* MCP endpoint pill */}
            <div className="flex items-center gap-3 mt-8 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "#6B5549" }}>MCP endpoint</span>
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-mono"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(200,148,75,0.3)",
                  color: "#C8944B",
                }}
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span>{MCP_URL}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(MCP_URL)}
                  className="text-gray-500 hover:text-gray-300 transition-colors ml-0.5"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex gap-0 py-12">

          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0 pr-6">
            <Sidebar activeSection={activeSection} />
          </aside>
          <div className="hidden lg:block w-px bg-border shrink-0 mr-10" />

          {/* Main content */}
          <main className="flex-1 min-w-0 max-w-3xl space-y-16">

            {/* ═══════════════════════════════════════════════════════════════
                OVERVIEW
            ═══════════════════════════════════════════════════════════════ */}
            <section id="overview">
              <SectionHeading icon={BookOpen} id="overview">Overview</SectionHeading>

              <SectionAnchor id="what-is-tapestry" />
              <h4 className="text-base font-semibold mb-3">What is Tapestry?</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Tapestry is a design talent CRM and AI matchmaking platform. It gives design leaders a
                single place to maintain a curated network of designers — with profiles, skills, availability,
                a CRM-style timeline for notes and outreach, and AI-powered matching that surfaces the right
                person for any job description or brief.
              </p>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                The platform exposes three integration surfaces: an{" "}
                <strong className="text-foreground">MCP server</strong> that lets AI assistants talk to
                your talent pool in natural language, a{" "}
                <strong className="text-foreground">CLI</strong> for terminal-first workflows and scripting,
                and a <strong className="text-foreground">REST API</strong> for mobile apps and custom
                integrations.
              </p>

              <SectionAnchor id="auth-tokens" />
              <h4 className="text-base font-semibold mb-3">API Tokens</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                All three integration methods authenticate with a long-lived API token. Tokens have full
                access to your workspace and start with <InlineCode>tap_</InlineCode>.
              </p>

              <div
                className="rounded-xl p-6 mb-4"
                style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}
              >
                <StepItem number={1} title="Open Settings">
                  <p className="text-sm text-muted-foreground">
                    In Tapestry, click your name or avatar in the top navigation, then go to{" "}
                    <strong>Settings → API Tokens</strong>.
                  </p>
                </StepItem>
                <StepItem number={2} title="Generate a token">
                  <p className="text-sm text-muted-foreground">
                    Click <strong>Generate token</strong>, give it a descriptive name (e.g. "Claude Desktop"
                    or "CLI"), and click confirm. The token is shown only once — copy it immediately.
                  </p>
                </StepItem>
                <StepItem number={3} title="Keep it safe" isLast>
                  <p className="text-sm text-muted-foreground">
                    Tokens grant full access to your workspace. Store them in a secrets manager or your OS
                    keychain, never in plaintext in version-controlled files.
                  </p>
                </StepItem>
              </div>

              <Callout type="warn" title="Token security">
                API tokens provide full read/write access to your workspace. If a token is exposed, revoke
                it immediately from Settings → API Tokens and generate a new one. Each token records its
                last-used time for auditing.
              </Callout>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                MCP
            ═══════════════════════════════════════════════════════════════ */}
            <section id="mcp">
              <SectionHeading icon={Zap} id="mcp">MCP Integration</SectionHeading>

              {/* What is MCP */}
              <SectionAnchor id="what-is-mcp" />
              <h4 className="text-base font-semibold mb-3">What is MCP?</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                The{" "}
                <a
                  href="https://modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                  style={{ color: "#C8944B" }}
                >
                  Model Context Protocol (MCP)
                </a>{" "}
                is an open standard that lets AI assistants connect to external data sources and tools.
                When you configure Tapestry as an MCP server, your AI assistant gains the ability to
                search your designer database, create profiles, add notes, manage lists, and run AI
                enrichment — all through natural language conversation.
              </p>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Tapestry's MCP server is hosted remotely at{" "}
                <InlineCode>{MCP_URL}</InlineCode>. No local server process
                to run or maintain — connect once and your AI assistant has live access to your workspace.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Zap, title: "Hosted remotely", desc: "No local process. The MCP server runs on Tapestry's infrastructure." },
                  { icon: Shield, title: "Authenticated", desc: "Every request is tied to your API token and workspace." },
                  { icon: RefreshCw, title: "Always live", desc: "Data is fetched in real time — no sync lag or stale caches." },
                  { icon: Layers, title: "18 tools", desc: "Search, enrich, annotate, and manage lists through natural language." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-xl p-4 flex gap-3"
                    style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#C8944B12" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "#C8944B" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Claude Desktop ── */}
              <SectionAnchor id="mcp-claude-desktop" />
              <h4 className="text-base font-semibold mb-3">Claude Desktop</h4>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Claude Desktop supports MCP via a JSON config file. The setup takes about 2 minutes.
              </p>

              <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}>
                <StepItem number={1} title="Locate the config file">
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #E6D5B7" }}>
                    <PathRow os="mac" path="~/Library/Application Support/Claude/claude_desktop_config.json" />
                    <PathRow os="win" path="%APPDATA%\Claude\claude_desktop_config.json" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Create the file if it doesn't exist yet.
                  </p>
                </StepItem>

                <StepItem number={2} title="Add the Tapestry server">
                  <CodeBlock code={claudeDesktopConfig} label="claude_desktop_config.json" lang="json" />
                  <p className="text-xs text-muted-foreground mt-2">
                    This uses <InlineCode>mcp-remote</InlineCode> (installed automatically via npx) as a
                    bridge to connect Claude Desktop to Tapestry's remote HTTP MCP endpoint.
                  </p>
                </StepItem>

                <StepItem number={3} title="Restart Claude Desktop">
                  <p className="text-sm text-muted-foreground">
                    Fully quit Claude Desktop — on macOS, use{" "}
                    <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">⌘Q</kbd>{" "}
                    or right-click the dock icon → Quit. Don't just close the window. Reopen it after.
                  </p>
                </StepItem>

                <StepItem number={4} title="Authenticate" isLast>
                  <p className="text-sm text-muted-foreground mb-3">
                    Open a new conversation and tell Claude your token:
                  </p>
                  <div
                    className="rounded-lg px-4 py-3 text-sm italic"
                    style={{ backgroundColor: "#F5F2ED", border: "1px solid #E6D5B7", borderLeft: "3px solid #C8944B" }}
                  >
                    "Authenticate with Tapestry using this token: tap_xxxxxxxxxxxx"
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Claude will automatically call the <InlineCode>authenticate</InlineCode> tool and confirm your identity.
                    You can say it in plain English — Claude knows what to do.
                  </p>
                </StepItem>
              </div>

              <Callout type="tip" title="Check the toolbar">
                After restarting, look for the hammer/tool icon at the bottom of Claude's input box. Click it to
                see the Tapestry tools listed — that confirms the connection is working.
              </Callout>

              {/* ── Claude Code ── */}
              <div className="mt-10">
                <SectionAnchor id="mcp-claude-code" />
                <h4 className="text-base font-semibold mb-3">Claude Code</h4>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Claude Code supports MCP with native HTTP transport — no <InlineCode>mcp-remote</InlineCode> needed.
                  Authentication is passed via HTTP headers, so you authenticate at config time rather than in conversation.
                </p>

                <div className="rounded-xl p-6 mb-5" style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}>
                  <StepItem number={1} title="Add via CLI (recommended)">
                    <CodeBlock
                      code={`claude mcp add tapestry --transport http \\\n  --url ${MCP_URL} \\\n  --header "Authorization: Bearer tap_your_token_here"`}
                      lang="bash"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Replace <InlineCode>tap_your_token_here</InlineCode> with your actual API token. This
                      registers the MCP server globally for your Claude Code session.
                    </p>
                  </StepItem>

                  <StepItem number={2} title="Verify it's registered">
                    <CodeBlock code="claude mcp list" lang="bash" />
                    <p className="text-xs text-muted-foreground mt-2">
                      You should see <InlineCode>tapestry</InlineCode> listed with status "connected".
                    </p>
                  </StepItem>

                  <StepItem number={3} title="Or configure manually" isLast>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add to <InlineCode>.claude/settings.json</InlineCode> in your project or home directory:
                    </p>
                    <CodeBlock
                      code={JSON.stringify({
                        mcpServers: {
                          tapestry: {
                            type: "http",
                            url: MCP_URL,
                            headers: { Authorization: "Bearer tap_your_token_here" },
                          },
                        },
                      }, null, 2)}
                      label=".claude/settings.json"
                      lang="json"
                    />
                  </StepItem>
                </div>

                <Callout type="info">
                  With Claude Code, authentication is handled at the config level via the{" "}
                  <InlineCode>Authorization</InlineCode> header — you don't need to call the{" "}
                  <InlineCode>authenticate</InlineCode> tool in conversation. Just start using Tapestry tools directly.
                </Callout>
              </div>

              {/* ── ChatGPT ── */}
              <div className="mt-10">
                <SectionAnchor id="mcp-chatgpt" />
                <h4 className="text-base font-semibold mb-3">ChatGPT Desktop</h4>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  ChatGPT Desktop (macOS / Windows) supports MCP via a URL-type server configuration.
                </p>

                <div className="rounded-xl p-6 mb-5" style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}>
                  <StepItem number={1} title="Locate the config file">
                    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #E6D5B7" }}>
                      <PathRow os="mac" path="~/Library/Application Support/ChatGPT/chatgpt_mcp_config.json" />
                      <PathRow os="win" path="%APPDATA%\ChatGPT\chatgpt_mcp_config.json" />
                    </div>
                  </StepItem>

                  <StepItem number={2} title="Add the Tapestry server">
                    <CodeBlock code={chatgptConfig} label="chatgpt_mcp_config.json" lang="json" />
                  </StepItem>

                  <StepItem number={3} title="Restart ChatGPT Desktop">
                    <p className="text-sm text-muted-foreground">
                      Fully quit and reopen ChatGPT Desktop.
                    </p>
                  </StepItem>

                  <StepItem number={4} title="Authenticate" isLast>
                    <div
                      className="rounded-lg px-4 py-3 text-sm italic"
                      style={{ backgroundColor: "#F5F2ED", border: "1px solid #E6D5B7", borderLeft: "3px solid #C8944B" }}
                    >
                      "Authenticate with Tapestry using token: tap_xxxxxxxxxxxx"
                    </div>
                  </StepItem>
                </div>
              </div>

              {/* ── Cursor ── */}
              <div className="mt-10">
                <SectionAnchor id="mcp-cursor" />
                <h4 className="text-base font-semibold mb-3">Cursor</h4>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Cursor supports MCP servers via its settings. Add Tapestry to bring your talent network
                  into your code editor — useful for generating briefs, sourcing designers for a project,
                  or logging notes without leaving your flow.
                </p>

                <div className="rounded-xl p-6 mb-5" style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}>
                  <StepItem number={1} title="Open Cursor Settings">
                    <p className="text-sm text-muted-foreground">
                      Go to <strong>Cursor → Settings → Features → MCP</strong> and click{" "}
                      <strong>Add new MCP server</strong>.
                    </p>
                  </StepItem>

                  <StepItem number={2} title="Or edit mcp.json directly">
                    <p className="text-sm text-muted-foreground mb-3">
                      Edit <InlineCode>~/.cursor/mcp.json</InlineCode>:
                    </p>
                    <CodeBlock code={cursorConfig} label="~/.cursor/mcp.json" lang="json" />
                  </StepItem>

                  <StepItem number={3} title="Restart Cursor" isLast>
                    <p className="text-sm text-muted-foreground">
                      Reload the window or restart Cursor. In Agent mode, Tapestry tools will appear automatically.
                    </p>
                  </StepItem>
                </div>
              </div>

              {/* ── Verify ── */}
              <div className="mt-10">
                <SectionAnchor id="mcp-verify" />
                <h4 className="text-base font-semibold mb-3">Verify your connection</h4>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Before troubleshooting your AI client config, verify the MCP endpoint is reachable:
                </p>
                <CodeBlock code={healthCheck} lang="bash" />
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  A <InlineCode>200 OK</InlineCode> response with{" "}
                  <InlineCode>{"{"}"status":"ok"{"}"}</InlineCode> confirms the server is healthy.
                  If this fails, check your network or try again in a moment.
                </p>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                TOOL REFERENCE
            ═══════════════════════════════════════════════════════════════ */}
            <section id="tools">
              <SectionHeading icon={Terminal} id="tools">Tool Reference</SectionHeading>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Tapestry exposes 18 tools to connected AI assistants. Every tool call is scoped to your
                authenticated workspace. Tools are grouped by function below.
              </p>

              {/* Auth */}
              <SectionAnchor id="tools-auth" />
              <div className="mb-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4"
                  style={{ backgroundColor: "#7C3AED18", color: "#7C3AED" }}
                >
                  <Key className="h-3 w-3" /> Auth
                </span>
              </div>
              {mcpTools.filter((t) => t.category === "auth").map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}

              {/* Designers */}
              <SectionAnchor id="tools-designers" />
              <div className="mb-2 mt-6">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4"
                  style={{ backgroundColor: "#C8944B18", color: "#C8944B" }}
                >
                  <Database className="h-3 w-3" /> Designers
                </span>
              </div>
              {mcpTools.filter((t) => t.category === "designers").map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}

              {/* Workspace */}
              <div className="mb-2 mt-6">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4"
                  style={{ backgroundColor: "#0891B218", color: "#0891B2" }}
                >
                  <Layers className="h-3 w-3" /> Workspace
                </span>
              </div>
              {mcpTools.filter((t) => t.category === "workspace").map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}

              {/* Lists */}
              <SectionAnchor id="tools-lists" />
              <div className="mb-2 mt-6">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4"
                  style={{ backgroundColor: "#05966918", color: "#059669" }}
                >
                  <List className="h-3 w-3" /> Lists
                </span>
              </div>
              {mcpTools.filter((t) => t.category === "lists").map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}

              {/* Enrichment */}
              <SectionAnchor id="tools-enrichment" />
              <div className="mb-2 mt-6">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4"
                  style={{ backgroundColor: "#DC262618", color: "#DC2626" }}
                >
                  <Sparkles className="h-3 w-3" /> Enrichment
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Enrichment tools use AI to surface publicly available information about a designer and
                propose updates. Changes are staged as suggestions — you review and selectively apply
                them with <InlineCode>apply_enrichment</InlineCode>.
              </p>
              <Callout type="info" title="Enrichment workflow">
                The recommended pattern is: <InlineCode>enrich_designer</InlineCode> (or{" "}
                <InlineCode>enrich_designer_from_url</InlineCode>) → review suggestions →{" "}
                <InlineCode>apply_enrichment</InlineCode> with only the fields you want to keep.
                This gives you human-in-the-loop control over AI-generated data.
              </Callout>
              <div className="mt-5" />
              {mcpTools.filter((t) => t.category === "enrichment").map((tool) => (
                <ToolCard key={tool.name} tool={tool} />
              ))}
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                CLI
            ═══════════════════════════════════════════════════════════════ */}
            <section id="cli">
              <SectionHeading icon={Package} id="cli">CLI</SectionHeading>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                <InlineCode>tapestry-cli</InlineCode> is a Node.js command-line tool for managing your
                designer network from the terminal. All commands support <InlineCode>--json</InlineCode>{" "}
                output for scripting and automation with tools like <InlineCode>jq</InlineCode>.
              </p>

              {/* Install */}
              <SectionAnchor id="cli-install" />
              <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}>
                <StepItem number={1} title="Install">
                  <CodeBlock code="npm install -g tapestry-cli" lang="bash" />
                  <p className="text-sm text-muted-foreground mt-3">
                    Requires Node.js 18+. Verify the install:
                  </p>
                  <CodeBlock code="tapestry --version" lang="bash" className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-3">
                    Or run without installing:{" "}
                    <InlineCode>npx tapestry-cli &lt;command&gt;</InlineCode>
                  </p>
                </StepItem>

                <StepItem number={2} title="Get an API token">
                  <p className="text-sm text-muted-foreground">
                    Go to <strong>Settings → API Tokens</strong> in Tapestry, click{" "}
                    <strong>Generate token</strong>, and copy it. Your token starts with{" "}
                    <InlineCode>tap_</InlineCode>.
                  </p>
                </StepItem>

                <StepItem number={3} title="Log in">
                  <CodeBlock code={loginExample} lang="bash" />
                  <p className="text-sm text-muted-foreground mt-3">
                    Credentials are saved to <InlineCode>~/.tapestry/config.json</InlineCode> and reused
                    automatically for all future commands.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Connecting to a self-hosted instance?
                  </p>
                  <CodeBlock
                    code={`tapestry login tap_your_token_here --url https://your-tapestry.com`}
                    lang="bash"
                    className="mt-2"
                  />
                </StepItem>

                <StepItem number={4} title="Verify" isLast>
                  <CodeBlock code={whoamiExample} lang="bash" />
                </StepItem>
              </div>

              {/* Commands reference */}
              <SectionAnchor id="cli-commands" />
              <h4 className="text-base font-semibold mb-4">Command Reference</h4>

              {cliCommands.map(({ group, rows }) => (
                <div key={group} className="mb-5">
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid #E6D5B7" }}
                  >
                    <div
                      className="px-5 py-3 border-b"
                      style={{ backgroundColor: "#F5F2ED", borderColor: "#E6D5B7" }}
                    >
                      <h5 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8B7355" }}>
                        {group}
                      </h5>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {rows.map((row, i) => (
                            <tr
                              key={row.cmd}
                              style={{
                                backgroundColor: i % 2 === 1 ? "#FBF8F3" : "white",
                                borderTop: i > 0 ? "1px solid #F0E6D3" : undefined,
                              }}
                            >
                              <td className="px-5 py-3 align-top w-1/2">
                                <code
                                  className="text-xs font-mono whitespace-nowrap font-semibold"
                                  style={{ color: "#B8843F" }}
                                >
                                  {row.cmd}
                                </code>
                              </td>
                              <td className="px-5 py-3 text-muted-foreground text-xs">{row.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}

              {/* Search deep dive */}
              <h4 className="text-base font-semibold mt-8 mb-3">Detailed examples</h4>
              <CodeBlock code={cliSearchExample} lang="bash" className="mb-4" />
              <CodeBlock code={cliAddExample} lang="bash" className="mb-4" />

              {/* Scripting */}
              <SectionAnchor id="cli-scripting" />
              <h4 className="text-base font-semibold mt-8 mb-3">Scripting & automation</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Every command outputs clean JSON with <InlineCode>--json</InlineCode>, making it trivial
                to chain commands or integrate into shell scripts and CI pipelines.
              </p>
              <CodeBlock code={scriptingExample} lang="bash" />
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                REST API
            ═══════════════════════════════════════════════════════════════ */}
            <section id="rest-api">
              <SectionHeading icon={Globe} id="rest-api">REST API</SectionHeading>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                The Mobile REST API uses JWT authentication and is designed for Expo, React Native, and
                other mobile clients. It supports HTTP caching via ETag headers for efficient data sync.
              </p>

              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 mb-8 text-sm font-mono"
                style={{ backgroundColor: "white", border: "1px solid #E6D5B7" }}
              >
                <span className="text-muted-foreground text-xs">Base URL</span>
                <code style={{ color: "#B8843F" }}>{BASE_URL}</code>
                <CopyButton text={BASE_URL} />
              </div>

              {/* Auth */}
              <SectionAnchor id="api-auth" />
              <h4 className="text-base font-semibold mb-3">Authentication</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Exchange credentials for a short-lived access token (JWT) and a long-lived refresh token.
                Include the access token in every subsequent request.
              </p>

              <CodeBlock
                code={`# 1. Login
curl -X POST ${BASE_URL}/api/mobile/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"your-password"}'

# Response includes accessToken + refreshToken
# {
#   "accessToken": "eyJhbGci...",
#   "refreshToken": "eyJhbGci...",
#   "user": { "id": 1, "email": "you@example.com" }
# }

# 2. Use the access token
curl ${BASE_URL}/api/mobile/designers?workspaceId=1 \\
  -H "Authorization: Bearer <accessToken>"`}
                lang="bash"
                className="mb-4"
              />

              <CodeBlock
                code={`# 3. Refresh an expired access token
curl -X POST ${BASE_URL}/api/mobile/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"eyJhbGci..."}'`}
                lang="bash"
                className="mb-6"
              />

              {/* Endpoints */}
              <SectionAnchor id="api-endpoints" />
              <h4 className="text-base font-semibold mb-4">Endpoints</h4>
              <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid #E6D5B7" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#F5F2ED", borderBottom: "1px solid #E6D5B7" }}>
                      {["Method", "Path", "Description"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B7355" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {restEndpoints.map((ep, i) => {
                      const m = methodColors[ep.method] ?? { bg: "#F3F4F6", text: "#374151" };
                      return (
                        <tr key={ep.path} style={{ backgroundColor: i % 2 === 1 ? "#FBF8F3" : "white", borderTop: "1px solid #F0E6D3" }}>
                          <td className="px-5 py-3 align-top w-16">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded font-mono"
                              style={{ backgroundColor: m.bg, color: m.text }}
                            >
                              {ep.method}
                            </span>
                          </td>
                          <td className="px-5 py-3 align-top">
                            <code className="text-xs font-mono" style={{ color: "#B8843F" }}>{ep.path}</code>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground text-xs">{ep.desc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Caching */}
              <SectionAnchor id="api-caching" />
              <h4 className="text-base font-semibold mb-3">HTTP Caching</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                All GET endpoints return <InlineCode>ETag</InlineCode> headers. Clients should store the
                ETag and send it as <InlineCode>If-None-Match</InlineCode> on subsequent requests. A{" "}
                <InlineCode>304 Not Modified</InlineCode> response means your cached data is still current.
              </p>
              <CodeBlock
                code={`# First request
GET /api/mobile/designers?workspaceId=1
# Response: ETag: "abc123"

# Subsequent request — send the ETag back
GET /api/mobile/designers?workspaceId=1
If-None-Match: "abc123"

# If unchanged: 304 Not Modified (no body, use cache)
# If changed:   200 OK with new ETag + fresh data`}
                lang="http"
                className="mb-6"
              />

              {/* Error handling */}
              <h4 className="text-base font-semibold mb-3">Error responses</h4>
              <p className="text-sm text-muted-foreground mb-4">
                All error responses follow a consistent structure:
              </p>
              <CodeBlock
                code={`{ "error": "Descriptive error message" }

# Common HTTP status codes:
# 304  Not Modified (use cached data)
# 400  Bad Request (missing or invalid params)
# 401  Unauthorized (invalid or expired token)
# 403  Forbidden (insufficient workspace permissions)
# 404  Not Found
# 500  Server error`}
                lang="json"
              />
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                EXAMPLE PROMPTS
            ═══════════════════════════════════════════════════════════════ */}
            <section id="examples">
              <SectionHeading icon={Lightbulb} id="examples">Example Prompts</SectionHeading>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Once you've authenticated, here are some prompts to get you started. Your AI assistant
                will figure out which tools to call — you just describe what you want.
              </p>

              <div className="space-y-8">
                {promptGroups.map(({ title, icon: Icon, prompts }) => (
                  <div key={title}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4" style={{ color: "#C8944B" }} />
                      <h4 className="text-sm font-semibold">{title}</h4>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {prompts.map((prompt) => (
                        <div
                          key={prompt}
                          className="rounded-xl px-4 py-3 flex items-start gap-3"
                          style={{
                            backgroundColor: "white",
                            border: "1px solid #E6D5B7",
                            borderLeft: "3px solid #C8944B",
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#C8944B" }} />
                          <p className="text-sm leading-relaxed">{prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Enrichment workflow */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4" style={{ color: "#C8944B" }} />
                  <h4 className="text-sm font-semibold">Multi-step enrichment workflow</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Enrichment works best as a multi-turn conversation:
                </p>
                <div className="space-y-2">
                  {[
                    { role: "you", msg: "Enrich designer #42 from https://dribbble.com/johndoe" },
                    { role: "ai", msg: "Found: title 'Senior Product Designer', skills include Figma, Motion Design, and Design Systems. Portfolio shows strong 0→1 product work. Confidence: high on skills, medium on title." },
                    { role: "you", msg: "Apply the skills and update their title to 'Senior Product Designer'" },
                    { role: "ai", msg: "Done. Designer #42 updated — skills list replaced with [Figma, Motion Design, Design Systems] and title updated." },
                  ].map(({ role, msg }, i) => (
                    <div
                      key={i}
                      className="rounded-xl px-4 py-3 text-sm"
                      style={{
                        backgroundColor: role === "you" ? "#F5F2ED" : "white",
                        border: "1px solid #E6D5B7",
                        borderLeft: `3px solid ${role === "you" ? "#C8944B" : "#6B7280"}`,
                      }}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider mr-2" style={{ color: role === "you" ? "#C8944B" : "#6B7280" }}>
                        {role === "you" ? "You" : "Claude"}
                      </span>
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                TROUBLESHOOTING
            ═══════════════════════════════════════════════════════════════ */}
            <section id="troubleshooting">
              <SectionHeading icon={AlertCircle} id="troubleshooting">Troubleshooting</SectionHeading>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Common issues and how to resolve them. If something isn't in this list,{" "}
                <a
                  href="https://github.com/davidhoang/tapestry/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                  style={{ color: "#C8944B" }}
                >
                  open an issue on GitHub
                </a>.
              </p>

              <div className="space-y-3">
                {troubleshootItems.map((item, i) => (
                  <details
                    key={i}
                    className="group rounded-xl overflow-hidden"
                    style={{ border: "1px solid #E6D5B7" }}
                  >
                    <summary
                      className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-sm font-semibold select-none"
                      style={{ backgroundColor: "#FAFAF8" }}
                    >
                      <span className="flex items-center gap-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#C8944B" }} />
                        {item.q}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-5 py-4 text-sm text-muted-foreground leading-relaxed bg-white border-t border-border">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>

              <div className="mt-10">
                <Callout type="info" title="Still stuck?">
                  Check the{" "}
                  <a
                    href={`${MCP_URL}/health`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                    style={{ color: "#2563EB" }}
                  >
                    MCP health endpoint
                  </a>{" "}
                  first to confirm the server is running. Then verify your API token is valid in{" "}
                  Settings → API Tokens. If the issue persists,{" "}
                  <a
                    href="https://github.com/davidhoang/tapestry/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                    style={{ color: "#2563EB" }}
                  >
                    file an issue
                  </a>{" "}
                  with your OS, client version, and the exact error message.
                </Callout>
              </div>
            </section>

            {/* ── Footer ── */}
            <div className="pt-8 pb-16 border-t border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-sm font-semibold mb-1">Tapestry Developer Docs</p>
                  <p className="text-xs text-muted-foreground">
                    An open experiment by{" "}
                    <a
                      href="https://proofofconcept.pub"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      Proof of Concept
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/davidhoang/tapestry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    GitHub
                  </a>
                  <a
                    href={`${MCP_URL}/health`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Activity className="h-3 w-3" />
                    API Status
                  </a>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
