# Tapestry API Documentation

Tapestry provides two API interfaces for external integrations:

1. **Mobile API** - REST endpoints with JWT authentication for mobile apps
2. **MCP Server** - Model Context Protocol server for AI assistants like Claude

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

### Authenticated Endpoints

All authenticated endpoints require the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

#### Get Current User

```http
GET /api/mobile/user
Authorization: Bearer <accessToken>
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
Authorization: Bearer <accessToken>
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

#### Get Recommendations

Returns designer recommendations from the user's default workspace (the workspace where they are an owner, or their first workspace).

```http
GET /api/mobile/recommendations
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "workspace": {
    "id": 1,
    "name": "My Workspace",
    "slug": "my-workspace"
  },
  "recommendations": [
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
      "skills": ["Figma", "Product Design", "Design Systems"],
      "description": "Experienced product designer...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad request (missing required fields)
- `401` - Unauthorized (invalid or expired token)
- `404` - Not found
- `500` - Server error

---

## MCP Server

The MCP (Model Context Protocol) server allows AI assistants like Claude Desktop to interact with Tapestry through natural language.

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

### Available Tools

#### authenticate

Authenticate with your Tapestry API token. Required before using other tools.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Your Tapestry API token (starts with `tap_`) |

#### search_designers

Search for designers in your workspace by name, title, skills, or location.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search term to match against name, title, or skills |
| `skill` | string | No | Filter by specific skill |
| `location` | string | No | Filter by location |
| `limit` | number | No | Maximum results to return |

#### get_designer

Retrieve detailed information about a specific designer.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerId` | number | Yes | The designer's ID |

#### create_designer

Create a new designer profile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Designer's full name |
| `title` | string | Yes | Job title |
| `level` | string | Yes | Experience level |
| `skills` | string[] | No | List of skills |
| `location` | string | No | Location |
| `company` | string | No | Current company |
| `email` | string | No | Email address |
| `linkedIn` | string | No | LinkedIn URL |
| `website` | string | No | Portfolio website |
| `description` | string | No | Bio or description |
| `notes` | string | No | Private notes |

#### update_designer

Update an existing designer's profile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `designerId` | number | Yes | The designer's ID |
| `name` | string | No | Designer's full name |
| `title` | string | No | Job title |
| `level` | string | No | Experience level |
| `skills` | string[] | No | List of skills |
| `location` | string | No | Location |
| `company` | string | No | Current company |
| `email` | string | No | Email address |
| `linkedIn` | string | No | LinkedIn URL |
| `website` | string | No | Portfolio website |
| `description` | string | No | Bio or description |
| `notes` | string | No | Private notes |
| `available` | boolean | No | Availability status |

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

Enrich a designer's profile by extracting information from a URL (LinkedIn, portfolio, etc.).

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
- "Show me designers with Figma skills"
- "Create a new designer profile for John Smith, Senior UX Designer at Apple"
- "Add designer #42 to the 'Potential Hires' list"
- "Enrich the profile for designer #15"
- "What lists do I have?"

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
