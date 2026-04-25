# tapestry-cli

Manage your Tapestry designer talent pool from the terminal. Search, add, and organize designers without opening the web app.

---

## Requirements

- Node.js 18 or higher
- A Tapestry account and workspace
- A Tapestry API token (see below)

---

## Step 1 — Install

```bash
npm install -g tapestry-cli
```

Or run it without installing:

```bash
npx tapestry-cli <command>
```

Verify the install worked:

```bash
tapestry --version
```

---

## Step 2 — Get an API token

1. Sign in to your Tapestry workspace at [tapestry.replit.app](https://tapestry.replit.app)
2. Go to **Settings** in the top navigation
3. Click **API Tokens**
4. Click **Generate token**, give it a name (e.g. "CLI"), and copy it

Your token starts with `tap_` and looks like:

```
tap_a1b2c3d4e5f6...
```

Keep this token private — it has the same access as your account.

---

## Step 3 — Log in

```bash
tapestry login tap_your_token_here
```

You should see:

```
✓ Authenticated as you@company.com in workspace "My Workspace" (role: admin)
```

Your token is saved to `~/.tapestry/config.json` and reused automatically for all future commands.

If you're connecting to a self-hosted Tapestry instance, pass the URL:

```bash
tapestry login tap_your_token_here --url https://your-tapestry-server.com
```

---

## Step 4 — Try it out

Check your workspace:

```bash
tapestry whoami
```

Search for designers:

```bash
tapestry designer search "product designer"
tapestry designer search --skill "Figma" --location "San Francisco"
```

View a designer's full profile:

```bash
tapestry designer get 42
```

---

## All commands

### Auth

| Command | What it does |
|---|---|
| `tapestry login <token>` | Save your API token and log in |
| `tapestry login <token> --url <url>` | Log in to a custom Tapestry instance |
| `tapestry logout` | Remove saved credentials |
| `tapestry whoami` | Show your current user, workspace, and stats |

---

### Designers

**Search**

```bash
tapestry designer search                       # list all
tapestry designer search "ux researcher"       # free-text search
tapestry designer search --skill "Figma"       # filter by skill
tapestry designer search --location "Remote"   # filter by location
tapestry designer search --limit 50            # show up to 50 results (default: 20)
tapestry designer search --offset 20           # skip the first 20 (pagination)
```

**View a profile**

```bash
tapestry designer get <id>
```

**Add a designer**

```bash
tapestry designer add \
  --name "Jane Smith" \
  --title "Senior Product Designer" \
  --level "Senior" \
  --skills "Figma,UX Research,Prototyping" \
  --company "Acme Corp" \
  --location "New York, NY" \
  --email "jane@example.com" \
  --linkedin "https://linkedin.com/in/janesmith" \
  --website "https://janesmith.design"
```

Required fields: `--name`, `--title`, `--level`, `--skills` (comma-separated).

**Update a designer**

```bash
tapestry designer update 42 --available          # mark as available
tapestry designer update 42 --company "New Co"
tapestry designer update 42 --skills "Figma,Framer,Motion Design"
```

Any field can be updated. Only the fields you pass will change.

---

### Lists

```bash
tapestry list ls                                # show all lists with designer counts
tapestry list create --name "Q2 Pipeline"       # create a new list
tapestry list create --name "Contractors" --description "Freelance pool" --public
tapestry list add <listId> <designerId>         # add a designer to a list
tapestry list add 3 42 --notes "Met at Config"
tapestry list remove <listId> <designerId>      # remove a designer from a list
```

---

### Global flags

| Flag | What it does |
|---|---|
| `--json` | Output raw JSON instead of formatted text |
| `--help` | Show help for any command |
| `--version` | Show the CLI version |

---

## Scripting and automation

All commands support `--json` for machine-readable output, making it easy to pipe into `jq` or other tools.

**Export all available designers to a JSON file:**

```bash
tapestry designer search --available --limit 50 --json > designers.json
```

**Find a designer by name and get their ID:**

```bash
tapestry designer search "Jane Smith" --json | jq '.results[0].id'
```

**Add a designer and immediately put them on a list:**

```bash
ID=$(tapestry designer add \
  --name "Alex Chen" \
  --title "Product Designer" \
  --level "Senior" \
  --skills "Figma,Systems Design" \
  --json | jq .id)

tapestry list add 3 $ID --notes "Strong portfolio"
```

**Batch-search by skill:**

```bash
for skill in "Figma" "Framer" "Webflow"; do
  echo "--- $skill ---"
  tapestry designer search --skill "$skill" --limit 5
done
```

---

## Configuration

Your login details are stored in `~/.tapestry/config.json`:

```json
{
  "token": "tap_...",
  "baseUrl": "https://tapestry.replit.app"
}
```

To switch between workspaces, log in again with a different token. To switch between servers (e.g. staging vs production), update `baseUrl` directly in this file or log in with `--url`.

---

## Troubleshooting

**"Not logged in" error**
Run `tapestry login tap_your_token_here` first.

**"Invalid or expired API token"**
Your token may have been revoked. Generate a new one in Settings → API Tokens and log in again.

**"Your role does not allow..."**
Some operations require editor, admin, or owner role. Check your role with `tapestry whoami`.

**Commands not found after install**
Make sure your npm global bin directory is in your `PATH`. Run `npm bin -g` to find it.

---

## Building from source

```bash
git clone <repo>
cd cli
npm install
npm run build          # compiles TypeScript to dist/
node dist/index.js --help
```

To link the CLI locally for development:

```bash
npm link
tapestry --help
```
