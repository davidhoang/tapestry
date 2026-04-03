# tapestry-cli

Manage your [Tapestry](https://tapestry.replit.app) designer talent pool from the terminal.

## Install

```bash
npm install -g tapestry-cli
# or run without installing:
npx tapestry-cli <command>
```

**Requires Node.js 18 or higher.**

## Quick start

```bash
# 1. Get an API token from Settings → API Tokens in the Tapestry web app
# 2. Authenticate
tapestry login tap_your_token_here

# 3. Check who you're logged in as
tapestry whoami

# 4. Search designers
tapestry designer search "product designer"
tapestry designer search --skill "Figma" --location "New York"

# 5. Get full details
tapestry designer get 42

# 6. Add a designer
tapestry designer add \
  --name "Jane Smith" \
  --title "Senior Product Designer" \
  --level "Senior" \
  --skills "Figma,UX Research,Prototyping" \
  --company "Acme Corp" \
  --email "jane@example.com"
```

## Commands

### Auth

| Command | Description |
|---|---|
| `tapestry login <token>` | Save your API token |
| `tapestry login <token> --url <url>` | Connect to a custom Tapestry instance |
| `tapestry logout` | Remove saved credentials |
| `tapestry whoami` | Show current user and workspace stats |

### Designers

| Command | Description |
|---|---|
| `tapestry designer search [query]` | Search designers |
| `tapestry designer search --skill <skill>` | Filter by skill |
| `tapestry designer search --location <loc>` | Filter by location |
| `tapestry designer search --limit <n>` | Limit results (default 20) |
| `tapestry designer search --offset <n>` | Paginate |
| `tapestry designer get <id>` | Full designer profile |
| `tapestry designer add --name ... --title ... --level ... --skills ...` | Add new designer |
| `tapestry designer update <id> [--name ...] [--title ...] ...` | Update a designer |

### Lists

| Command | Description |
|---|---|
| `tapestry list ls` | Show all lists |
| `tapestry list create --name "My List"` | Create a new list |
| `tapestry list add <listId> <designerId>` | Add designer to a list |
| `tapestry list remove <listId> <designerId>` | Remove designer from a list |

### Global flags

| Flag | Description |
|---|---|
| `--json` | Output raw JSON (useful for scripting) |
| `--help` | Show help for any command |

## Scripting example

```bash
# Export all designers matching "senior" as JSON
tapestry designer search senior --limit 50 --json | jq '.results[] | .name'

# Add a designer and capture their ID
ID=$(tapestry designer add --name "Alex" --title "Designer" --level "Mid" --skills "Figma" --json | jq .id)
tapestry list add 3 $ID
```

## Configuration

Credentials are stored at `~/.tapestry/config.json`. You can edit this file manually to switch between workspaces or server URLs.

## Building from source

```bash
git clone ...
cd cli
npm install
npm run build
node dist/index.js --help
```
