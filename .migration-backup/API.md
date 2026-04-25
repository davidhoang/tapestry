# Tapestry API Documentation

Tapestry provides two API interfaces for external integrations:

1. **Mobile API** - REST endpoints with JWT authentication for mobile apps (Expo, React Native)
2. **MCP Server** - Model Context Protocol server for AI assistants like Claude Desktop and Claude Code

## Mobile API

The Mobile API uses JWT (JSON Web Token) authentication for stateless, secure access from mobile applications.

### Base URL

```
https://tapestry-dh-design.replit.app
```

### Authentication

#### Login

Authenticate with email and password to receive access and refresh tokens.

```http
POST /api/mobile/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "isAdmin": false
  }
}
```

#### Refresh Token

Exchange a refresh token for new access and refresh tokens.

```http
POST /api/mobile/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Authenticated Endpoints

All authenticated endpoints require the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

#### Get Current User

```http
GET /api/mobile/user
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "isAdmin": false,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### Get User's Workspaces

Returns all workspaces the authenticated user belongs to.

```http
GET /api/mobile/workspaces
```

**Response:**
```json
{
  "workspaces": [
    {
      "id": 1,
      "name": "My Workspace",
      "slug": "my-workspace",
      "role": "owner",
      "isDefault": true
    }
  ]
}
```

**Cache:** 5 minutes (300 seconds)

#### Get Recommendations

Returns designer recommendations from the user's default workspace.

```http
GET /api/mobile/recommendations
```

**Response:**
```json
{
  "workspace": {
    "id": 1,
    "name": "My Workspace",
    "slug": "my-workspace"
  },
  "recommendations": [...],
  "total": 20
}
```

**Cache:** 1 minute (60 seconds)

---

### Designer Endpoints

All designer endpoints require `workspaceId` as a query parameter.

#### Search/List Designers

Search designers with filtering and pagination.

```http
GET /api/mobile/designers?workspaceId=1&query=product&skill=Figma&limit=20&offset=0
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | number | Yes | Workspace ID |
| `query` | string | No | Search term (matches name, title, company, email) |
| `skill` | string | No | Filter by skill |
| `location` | string | No | Filter by location |
| `limit` | number | No | Max results (default 20, max 100) |
| `offset` | number | No | Skip results for pagination (default 0) |

**Response:**
```json
{
  "designers": [
    {
      "id": 1,
      "name": "Jane Designer",
      "title": "Senior Product Designer",
      "company": "Design Co",
      "location": "San Francisco, CA",
      "email": "jane@example.com",
      "linkedIn": "https://linkedin.com/in/jane",
      "website": "https://jane.design",
      "photoUrl": "https://...",
      "skills": ["Figma", "Product Design"],
      "description": "...",
      "available": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 45,
  "hasMore": true,
  "offset": 0
}
```

**Cache:** 1 minute (60 seconds)

#### Get Designer Details

```http
GET /api/mobile/designers/:id?workspaceId=1
```

**Response:**
```json
{
  "id": 1,
  "name": "Jane Designer",
  "title": "Senior Product Designer",
  "company": "Design Co",
  "location": "San Francisco, CA",
  "email": "jane@example.com",
  "linkedIn": "https://linkedin.com/in/jane",
  "website": "https://jane.design",
  "photoUrl": "https://...",
  "skills": ["Figma", "Product Design"],
  "description": "...",
  "available": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "timelineEventCount": 5
}
```

**Cache:** 2 minutes (120 seconds)

#### Get Designer Timeline

Get timeline events (notes, activities) for a designer.

```http
GET /api/mobile/designers/:id/timeline?workspaceId=1&limit=20&offset=0
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | number | Yes | Workspace ID |
| `limit` | number | No | Max results (default 20) |
| `offset` | number | No | Skip results for pagination (default 0) |

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "eventType": "note_added",
      "content": "Great initial interview",
      "source": "web",
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "eventType": "status_change",
      "content": "Marked as available",
      "source": "system",
      "createdAt": "2025-01-14T09:00:00.000Z"
    }
  ],
  "total": 12,
  "hasMore": false
}
```

**Cache:** 30 seconds

---

### List Endpoints

#### Get All Lists

```http
GET /api/mobile/lists?workspaceId=1
```

**Response:**
```json
{
  "lists": [
    {
      "id": 1,
      "name": "Potential Hires",
      "description": "Candidates for Q1 hiring",
      "isPublic": false,
      "designerCount": 12,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Cache:** 1 minute (60 seconds)

#### Get List Designers

```http
GET /api/mobile/lists/:id/designers?workspaceId=1
```

**Response:**
```json
{
  "list": {
    "id": 1,
    "name": "Potential Hires"
  },
  "designers": [...],
  "total": 12
}
```

**Cache:** 1 minute (60 seconds)

---

### Caching

All GET endpoints support HTTP caching with ETag headers. Clients should:

1. Store the `ETag` header from responses
2. Send `If-None-Match` header with the stored ETag on subsequent requests
3. Handle `304 Not Modified` responses to use cached data

Example:
```http
GET /api/mobile/designers?workspaceId=1
If-None-Match: "abc123def456"
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `304` - Not Modified (use cached data)
- `400` - Bad request (missing required fields)
- `401` - Unauthorized (invalid or expired token)
- `403` - Forbidden (no access to workspace)
- `404` - Not found
- `500` - Server error

---

## MCP Server

The MCP (Model Context Protocol) server allows AI assistants like Claude Desktop and Claude Code to interact with Tapestry through natural language.

### Setup

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

### Health Check

Verify the MCP server is accessible:

```bash
curl https://tapestry-dh-design.replit.app/mcp/health
```

**Response:**
```json
{"status": "ok", "service": "tapestry-mcp"}
```

### Available Tools

#### authenticate

Authenticate with your Tapestry API token. Required before using other tools.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Your Tapestry API token (starts with `tap_`) |

#### search_designers

Search for designers with filtering and pagination.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search term (case-insensitive) |
| `skill` | string | No | Filter by specific skill |
| `location` | string | No | Filter by location |
| `limit` | number | No | Max results (default 20, max 50) |
| `offset` | number | No | Skip results for pagination |

**Returns:** JSON object with:
- `results`: Array of designer objects (id, name, title, company, location, skills, email)
- `total`: Total number of matching designers
- `count`: Number of results in this response
- `offset`: Current offset
- `hasMore`: Boolean indicating if more results are available

#### quick_search

Lightweight search returning only essential fields for faster responses.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search term (matches name or title) |
| `limit` | number | No | Max results (default 10, max 25) |

**Returns:** List of `{ id, name, title }` objects.

#### get_designer

Retrieve detailed information about a specific designer.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerId` | number | Yes | The designer's ID |

#### get_designer_timeline

Get timeline entries (notes, activities) for a designer.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerId` | number | Yes | The designer's ID |
| `limit` | number | No | Max entries (default 20, max 100) |

#### add_note

Add a note to a designer's timeline.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerId` | number | Yes | The designer's ID |
| `content` | string | Yes | The note content/text |

#### list_lists

Retrieve all designer lists in your workspace. No parameters required.

#### get_list_designers

Get all designers within a specific list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listId` | number | Yes | The list's ID |

#### create_list

Create a new designer list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | List name |
| `description` | string | No | List description |
| `isPublic` | boolean | No | Whether the list is publicly visible |

#### add_designer_to_list

Add a designer to a list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listId` | number | Yes | The list's ID |
| `designerId` | number | Yes | The designer's ID |
| `notes` | string | No | Notes about why they were added |

#### remove_designer_from_list

Remove a designer from a list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listId` | number | Yes | The list's ID |
| `designerId` | number | Yes | The designer's ID |

#### workspace_info

Retrieve information about the current workspace. No parameters required.

#### enrich_designer

Enrich a designer's profile using AI to find additional information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerId` | number | Yes | The designer's ID |

#### enrich_designer_from_url

Enrich a designer's profile by extracting information from a URL.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerId` | number | Yes | The designer's ID |
| `url` | string | Yes | URL to extract information from |

#### apply_enrichment

Apply enrichment suggestions to a designer's profile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerId` | number | Yes | The designer's ID |
| `email` | string | No | Email to apply |
| `phoneNumber` | string | No | Phone number to apply |
| `location` | string | No | Location to apply |
| `company` | string | No | Company to apply |
| `title` | string | No | Title to apply |
| `linkedIn` | string | No | LinkedIn URL to apply |
| `website` | string | No | Website to apply |
| `skills` | string[] | No | Skills to apply |
| `bio` | string | No | Bio/description to apply |

#### bulk_enrich_designers

Enrich multiple designers at once.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerIds` | number[] | Yes | Array of designer IDs to enrich |

### Example Usage in Claude

After authenticating, you can use natural language:

- "Search for product designers in San Francisco"
- "Quick search for John"
- "Show me the timeline for designer #15"
- "Add a note to designer #42: Great portfolio, strong systems thinking"
- "Create a list called 'Q1 Candidates'"
- "Add designer #15 to the Q1 Candidates list"
- "What lists do I have?"
- "Enrich the profile for designer #15"

---

## Token Management

### Generating API Tokens

1. Log into Tapestry
2. Navigate to Settings > API Tokens
3. Click "Create token"
4. Copy the token immediately (it won't be shown again)

Tokens have the format: `tap_xxxxxxxxxxxx`

### Token Security

- Tokens provide full access to your workspace data
- Store tokens securely (environment variables, secrets managers)
- Revoke tokens immediately if compromised
- Each token tracks last usage for auditing

---

## Rate Limits

Currently, there are no enforced rate limits. Please use the API responsibly. Excessive requests may result in temporary throttling.

## Support

For issues or feature requests, please contact the Tapestry team or open an issue on GitHub.
