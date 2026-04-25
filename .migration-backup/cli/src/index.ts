#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand, logoutCommand, whoamiCommand } from "./commands/auth.js";
import {
  searchDesignersCommand,
  getDesignerCommand,
  addDesignerCommand,
  updateDesignerCommand,
} from "./commands/designers.js";
import {
  listListsCommand,
  createListCommand,
  addToListCommand,
  removeFromListCommand,
} from "./commands/lists.js";

const program = new Command();

program
  .name("tapestry")
  .description("Manage your Tapestry designer talent pool from the terminal")
  .version("1.0.0");

// ── Auth ──────────────────────────────────────────────────────────────────────
program
  .command("login <token>")
  .description("Authenticate with your Tapestry API token (tap_...)")
  .option("-u, --url <url>", "Tapestry server URL (default: https://tapestry.replit.app)")
  .action(loginCommand);

program
  .command("logout")
  .description("Remove saved credentials")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show current authenticated user and workspace stats")
  .action(whoamiCommand);

// ── Designers ─────────────────────────────────────────────────────────────────
const designer = program.command("designer").description("Manage designers");

designer
  .command("search [query]")
  .description("Search for designers")
  .option("--skill <skill>", "Filter by skill")
  .option("--location <location>", "Filter by location")
  .option("--limit <n>", "Max results (default 20)")
  .option("--offset <n>", "Skip results for pagination")
  .option("--json", "Output raw JSON")
  .action(searchDesignersCommand);

designer
  .command("get <id>")
  .description("Show full details for a designer")
  .option("--json", "Output raw JSON")
  .action(getDesignerCommand);

designer
  .command("add")
  .description("Add a new designer to your workspace")
  .requiredOption("--name <name>", "Full name")
  .requiredOption("--title <title>", "Job title")
  .requiredOption("--level <level>", "Experience level (e.g. Senior, Lead, Principal)")
  .requiredOption("--skills <skills>", "Comma-separated list of skills")
  .option("--location <location>", "Location")
  .option("--company <company>", "Current company")
  .option("--email <email>", "Email address")
  .option("--linkedin <url>", "LinkedIn URL")
  .option("--website <url>", "Portfolio URL")
  .option("--bio <bio>", "Bio / description")
  .option("--notes <notes>", "Private notes")
  .option("--json", "Output raw JSON")
  .action(addDesignerCommand);

designer
  .command("update <id>")
  .description("Update a designer's profile")
  .option("--name <name>", "Full name")
  .option("--title <title>", "Job title")
  .option("--level <level>", "Experience level")
  .option("--skills <skills>", "Comma-separated skills (replaces existing)")
  .option("--location <location>", "Location")
  .option("--company <company>", "Company")
  .option("--email <email>", "Email")
  .option("--linkedin <url>", "LinkedIn URL")
  .option("--website <url>", "Portfolio URL")
  .option("--bio <bio>", "Bio / description")
  .option("--notes <notes>", "Private notes")
  .option("--available", "Mark as available")
  .option("--no-available", "Mark as unavailable")
  .option("--json", "Output raw JSON")
  .action(updateDesignerCommand);

// ── Lists ─────────────────────────────────────────────────────────────────────
const list = program.command("list").description("Manage designer lists");

list
  .command("ls")
  .description("Show all lists in your workspace")
  .option("--json", "Output raw JSON")
  .action(listListsCommand);

list
  .command("create")
  .description("Create a new list")
  .requiredOption("--name <name>", "List name")
  .option("--description <desc>", "Description")
  .option("--public", "Make the list publicly shareable")
  .option("--json", "Output raw JSON")
  .action(createListCommand);

list
  .command("add <listId> <designerId>")
  .description("Add a designer to a list")
  .option("--notes <notes>", "Notes about why they're on this list")
  .option("--json", "Output raw JSON")
  .action(addToListCommand);

list
  .command("remove <listId> <designerId>")
  .description("Remove a designer from a list")
  .option("--json", "Output raw JSON")
  .action(removeFromListCommand);

program.parse();
