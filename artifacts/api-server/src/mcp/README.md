# Tapestry MCP Server

Connect Claude to Tapestry for natural language designer and list management.

## Setup

### 1. Create an API Token

1. Log in to Tapestry
2. Click your profile dropdown → "API tokens"
3. Create a new token and copy it (shown only once)

### 2. Configure Claude Code (Remote HTTP)

Add to your Claude Code config (`.claude/settings.json` or via `claude mcp add`):

```json
{
  "mcpServers": {
    "tapestry": {
      "type": "http",
      "url": "https://tapestry.design/mcp",
      "headers": {
        "Authorization": "Bearer tap_your_token_here"
      }
    }
  }
}
```

Replace `tap_your_token_here` with your actual API token.

### 3. Local stdio mode (alternative)

For local development, you can also run the MCP server via stdio. Add to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tapestry": {
      "command": "npx",
      "args": ["tsx", "/path/to/your/tapestry/server/mcp/index.ts"],
      "env": {
        "DATABASE_URL": "your-database-url"
      }
    }
  }
}
```

Replace `/path/to/your/tapestry` with the actual path to your Tapestry installation.

## Authentication

- **Remote HTTP**: Auth is handled via the `Authorization: Bearer tap_xxx` header — no additional steps needed.
- **Local stdio**: In Claude, say: "Authenticate with Tapestry using token tap_xxxxx"

## Available Commands

Once connected, you can ask Claude to:

- "Search for designers with UX skills"
- "Create a designer named John Smith, Senior Product Designer at Acme Corp"
- "Show me all my lists"
- "Add designer 123 to list 456"
- "Update designer 42 to set their location to San Francisco"
- "Get workspace info"

## Tools Reference

### Core Tools

| Tool | Description |
|------|-------------|
| search_designers | Find designers by name, skills, or location (with pagination) |
| quick_search | Lightweight search returning id, name, and title |
| get_designer | Get full profile for a designer |
| get_designer_timeline | Get timeline events for a designer |
| add_note | Add a note to a designer's timeline |
| create_designer | Add a new designer |
| update_designer | Modify an existing designer |
| workspace_info | Get workspace details |

### List Management

| Tool | Description |
|------|-------------|
| list_lists | See all your lists |
| get_list_designers | See designers in a list |
| create_list | Make a new list |
| add_designer_to_list | Add designer to a list |
| remove_designer_from_list | Remove designer from a list |

### Enrichment Tools

| Tool | Description |
|------|-------------|
| enrich_designer | Use AI to find publicly available information about a designer |
| enrich_designer_from_url | Extract information from a URL (LinkedIn, portfolio, Dribbble, Behance) |
| apply_enrichment | Apply enrichment suggestions to a designer's profile |
| bulk_enrich_designers | Enrich multiple designers at once (max 10) |

## Enrichment Workflow

1. **Enrich a designer**: `enrich_designer` with designer ID
2. **Review suggestions**: See what information was found
3. **Apply changes**: Use `apply_enrichment` to update the profile with specific fields

Example conversation:
- "Enrich designer 42"
- "Apply the LinkedIn and skills from the enrichment to designer 42"

You can also enrich from URLs:
- "Enrich designer 42 from https://dribbble.com/johndoe"
- "Enrich designer 42 from https://johndoe.com" (personal portfolio)

**Note:** Some sites like LinkedIn block automated access. When a page cannot be fetched, only URL metadata (profile type, username) will be extracted with low confidence. Personal portfolio sites typically work best for URL enrichment.
