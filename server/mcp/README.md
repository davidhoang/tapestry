# Tapestry MCP Server

Connect Claude Desktop to Tapestry for natural language designer and list management.

## Setup

### 1. Create an API Token

1. Log in to Tapestry
2. Click your profile dropdown → "API tokens"
3. Create a new token and copy it (shown only once)

### 2. Configure Claude Desktop

Add to your Claude Desktop config file:

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

### 3. Restart Claude Desktop

Restart Claude Desktop to load the MCP server.

### 4. Authenticate

In Claude, say: "Authenticate with Tapestry using token tap_xxxxx"

## Available Commands

Once authenticated, you can ask Claude to:

- "Search for designers with UX skills"
- "Create a designer named John Smith, Senior Product Designer at Acme Corp"
- "Show me all my lists"
- "Add designer 123 to list 456"
- "Update designer 42 to set their location to San Francisco"
- "Get workspace info"

## Tools Reference

| Tool | Description |
|------|-------------|
| authenticate | Connect with your API token |
| search_designers | Find designers by name, skills, or location |
| get_designer | Get full profile for a designer |
| create_designer | Add a new designer |
| update_designer | Modify an existing designer |
| list_lists | See all your lists |
| get_list_designers | See designers in a list |
| create_list | Make a new list |
| add_designer_to_list | Add designer to a list |
| remove_designer_from_list | Remove designer from a list |
| workspace_info | Get workspace stats |
