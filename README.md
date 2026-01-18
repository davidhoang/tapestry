# Tapestry: Intelligent Design Matchmaking

Tapestry is a [Proof of Concept](http://www.proofofconcept.pub) experiment.

Problem statement: I get reached out by a lot of people in my network asking for recommendations of designers. Though I'd like to help, this is time consuming and often results in me needing to manually go through a repository of talent.

<img width="540" alt="Screenshot 2025-06-19 at 10 43 00 PM" src="https://github.com/user-attachments/assets/3f773bfa-6313-4df8-9538-ff113fad6e9b" />


## Tech stack
- Replit for vibe coding - [Use my referral](https://replit.com/refer/dh-design)
- Resend for email
- Backend: Express.js (TypeScript)
- Frontend: React with Tailwind CSS
- Database: PostgreSQL (Replit's built-in)
- AI: OpenAI for recommendations and matching

## Features

- User authentication and workspace management
- AI-powered designer recommendation system
- Designer directory with profiles, skills, and availability tracking
- CRM-style timeline with notes and activity logging
- Curated designer lists with sharing capabilities
- Recruiting board with drag-and-drop pipeline management
- Mobile API with JWT authentication
- MCP server for Claude Desktop integration

## API Documentation

Tapestry provides two API interfaces for external integrations:

### Mobile API

REST endpoints with JWT authentication for mobile apps.

#### Authentication

```bash
# Login
curl -X POST https://tapestry-dh-design.replit.app/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "your-password"}'

# Use the returned accessToken for authenticated requests
curl https://tapestry-dh-design.replit.app/api/mobile/workspaces \
  -H "Authorization: Bearer <accessToken>"
```

#### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mobile/login` | POST | Authenticate and receive JWT tokens |
| `/api/mobile/refresh` | POST | Refresh expired access token |
| `/api/mobile/user` | GET | Get current user info |
| `/api/mobile/workspaces` | GET | List user's workspaces |
| `/api/mobile/recommendations` | GET | Get designer recommendations |

### MCP Server (Claude Desktop)

The MCP (Model Context Protocol) server allows AI assistants like Claude Desktop to interact with Tapestry through natural language.

#### Setup

1. Generate an API token in Tapestry (Settings > API Tokens)
2. Add the MCP server to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tapestry": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://tapestry-dh-design.replit.app/mcp"
      ]
    }
  }
}
```

3. Restart Claude Desktop
4. Use the `authenticate` tool with your API token

#### Available Tools

| Tool | Description |
|------|-------------|
| `authenticate` | Authenticate with your API token (required first) |
| `search_designers` | Search designers by name, title, skills, or location |
| `get_designer` | Get detailed designer information |
| `create_designer` | Create a new designer profile |
| `update_designer` | Update an existing designer |
| `list_lists` | List all designer lists |
| `get_list_designers` | Get designers in a specific list |
| `create_list` | Create a new designer list |
| `add_designer_to_list` | Add a designer to a list |
| `remove_designer_from_list` | Remove a designer from a list |
| `workspace_info` | Get current workspace info |
| `enrich_designer` | AI-enrich a designer's profile |
| `enrich_designer_from_url` | Enrich profile from a URL |
| `apply_enrichment` | Apply enrichment suggestions |
| `bulk_enrich_designers` | Enrich multiple designers |

#### Example Usage in Claude

After authenticating, you can use natural language:

- "Search for product designers in San Francisco"
- "Show me designers with Figma skills"
- "Create a new designer profile for John Smith, Senior UX Designer at Apple"
- "Add designer #42 to the 'Potential Hires' list"
- "Enrich the profile for designer #15"

### Token Management

1. Log into Tapestry
2. Navigate to Settings > API Tokens
3. Click "Create token"
4. Copy the token immediately (it won't be shown again)

Tokens have the format: `tap_xxxxxxxxxxxx`

For detailed API documentation, see [API.md](./API.md).

## Product screenshots

### Homepage
![Tapestry 4](https://github.com/user-attachments/assets/515f5172-1d62-4b5e-b334-a812ba1e417f)

### Directory
![Tapestry 2](https://github.com/user-attachments/assets/31c7b3bc-4af6-42c4-912e-53a0b83cded3)

### Intelligent match
![Tapestry 3](https://github.com/user-attachments/assets/614a3940-8d8d-4c0a-a23d-584c013be155)

## Report bugs
There are still many known bugs in the Alpha but if you spot them I would appreciate if you [submit an issue](https://github.com/davidhoang/tapestry/issues).

Try it at [tapestry.design](http://tapestry.design)
