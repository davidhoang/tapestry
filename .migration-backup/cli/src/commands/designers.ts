import chalk from "chalk";
import { api, ApiError } from "../client.js";

interface Designer {
  id: number;
  name: string;
  title: string;
  level: string;
  company?: string;
  location?: string;
  email?: string;
  skills?: string[];
  available: boolean;
  description?: string;
  notes?: string;
  linkedIn?: string;
  website?: string;
  createdAt?: string;
}

interface SearchResult {
  results: Designer[];
  total: number;
  offset: number;
  limit: number;
}

function formatDesignerRow(d: Designer) {
  const avail = d.available ? chalk.green("✓") : chalk.gray("–");
  const skills = d.skills?.slice(0, 3).join(", ") ?? "";
  return (
    `${chalk.bold(String(d.id).padStart(5))}  ${avail}  ${chalk.bold(d.name.padEnd(24))}  ${(d.title ?? "").padEnd(28)}  ${(d.company ?? "").padEnd(20)}  ${skills}`
  );
}

function formatDesignerDetail(d: Designer) {
  const lines: string[] = [
    `${chalk.bold("ID:")}         ${d.id}`,
    `${chalk.bold("Name:")}       ${d.name}`,
    `${chalk.bold("Title:")}      ${d.title}`,
    `${chalk.bold("Level:")}      ${d.level}`,
    `${chalk.bold("Company:")}    ${d.company ?? "—"}`,
    `${chalk.bold("Location:")}   ${d.location ?? "—"}`,
    `${chalk.bold("Email:")}      ${d.email ?? "—"}`,
    `${chalk.bold("LinkedIn:")}   ${d.linkedIn ?? "—"}`,
    `${chalk.bold("Website:")}    ${d.website ?? "—"}`,
    `${chalk.bold("Available:")}  ${d.available ? chalk.green("Yes") : chalk.gray("No")}`,
    `${chalk.bold("Skills:")}     ${d.skills?.join(", ") ?? "—"}`,
    `${chalk.bold("Bio:")}        ${d.description ?? "—"}`,
    `${chalk.bold("Notes:")}      ${d.notes ?? "—"}`,
    `${chalk.bold("Added:")}      ${d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}`,
  ];
  return lines.join("\n");
}

export async function searchDesignersCommand(
  query: string | undefined,
  opts: { skill?: string; location?: string; limit?: string; offset?: string; json?: boolean }
) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (opts.skill) params.set("skill", opts.skill);
  if (opts.location) params.set("location", opts.location);
  if (opts.limit) params.set("limit", opts.limit);
  if (opts.offset) params.set("offset", opts.offset);

  try {
    const data = await api.get<SearchResult>(`/api/cli/designers?${params}`);

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    if (data.results.length === 0) {
      console.log(chalk.yellow("No designers found."));
      return;
    }

    const header =
      `${"   ID".padEnd(7)}  ${"  "}  ${"Name".padEnd(24)}  ${"Title".padEnd(28)}  ${"Company".padEnd(20)}  Skills`;
    console.log(chalk.dim(header));
    console.log(chalk.dim("─".repeat(120)));
    data.results.forEach((d) => console.log(formatDesignerRow(d)));
    console.log(chalk.dim(`\nShowing ${data.offset + 1}–${data.offset + data.results.length} of ${data.total}`));
  } catch (e) {
    if (e instanceof ApiError) {
      console.error(chalk.red(`✗ ${e.message}`));
      process.exit(1);
    }
    throw e;
  }
}

export async function getDesignerCommand(id: string, opts: { json?: boolean }) {
  try {
    const d = await api.get<Designer>(`/api/cli/designers/${id}`);
    if (opts.json) {
      console.log(JSON.stringify(d, null, 2));
      return;
    }
    console.log(formatDesignerDetail(d));
  } catch (e) {
    if (e instanceof ApiError) {
      console.error(chalk.red(`✗ ${e.message}`));
      process.exit(1);
    }
    throw e;
  }
}

export async function addDesignerCommand(opts: {
  name: string;
  title: string;
  level: string;
  skills: string;
  location?: string;
  company?: string;
  email?: string;
  linkedin?: string;
  website?: string;
  bio?: string;
  notes?: string;
  json?: boolean;
}) {
  const body = {
    name: opts.name,
    title: opts.title,
    level: opts.level,
    skills: opts.skills.split(",").map((s) => s.trim()).filter(Boolean),
    location: opts.location,
    company: opts.company,
    email: opts.email,
    linkedIn: opts.linkedin,
    website: opts.website,
    description: opts.bio,
    notes: opts.notes,
  };

  try {
    const d = await api.post<Designer>("/api/cli/designers", body);
    if (opts.json) {
      console.log(JSON.stringify(d, null, 2));
      return;
    }
    console.log(chalk.green(`✓ Created designer "${d.name}" (ID: ${d.id})`));
  } catch (e) {
    if (e instanceof ApiError) {
      console.error(chalk.red(`✗ ${e.message}`));
      process.exit(1);
    }
    throw e;
  }
}

export async function updateDesignerCommand(
  id: string,
  opts: {
    name?: string;
    title?: string;
    level?: string;
    skills?: string;
    location?: string;
    company?: string;
    email?: string;
    linkedin?: string;
    website?: string;
    bio?: string;
    notes?: string;
    available?: boolean;
    json?: boolean;
  }
) {
  const body: Record<string, unknown> = {};
  if (opts.name !== undefined) body.name = opts.name;
  if (opts.title !== undefined) body.title = opts.title;
  if (opts.level !== undefined) body.level = opts.level;
  if (opts.skills !== undefined) body.skills = opts.skills.split(",").map((s) => s.trim()).filter(Boolean);
  if (opts.location !== undefined) body.location = opts.location;
  if (opts.company !== undefined) body.company = opts.company;
  if (opts.email !== undefined) body.email = opts.email;
  if (opts.linkedin !== undefined) body.linkedIn = opts.linkedin;
  if (opts.website !== undefined) body.website = opts.website;
  if (opts.bio !== undefined) body.description = opts.bio;
  if (opts.notes !== undefined) body.notes = opts.notes;
  if (opts.available !== undefined) body.available = opts.available;

  if (Object.keys(body).length === 0) {
    console.error(chalk.red("✗ No fields specified. Use --help to see available options."));
    process.exit(1);
  }

  try {
    const d = await api.patch<Designer>(`/api/cli/designers/${id}`, body);
    if (opts.json) {
      console.log(JSON.stringify(d, null, 2));
      return;
    }
    console.log(chalk.green(`✓ Updated "${d.name}" (ID: ${d.id})`));
  } catch (e) {
    if (e instanceof ApiError) {
      console.error(chalk.red(`✗ ${e.message}`));
      process.exit(1);
    }
    throw e;
  }
}
