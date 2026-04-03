import chalk from "chalk";
import { api, ApiError } from "../client.js";

interface TapestryList {
  id: number;
  name: string;
  description?: string;
  slug: string;
  isPublic: boolean;
  designerCount?: number;
  createdAt?: string;
}

export async function listListsCommand(opts: { json?: boolean }) {
  try {
    const rows = await api.get<TapestryList[]>("/api/cli/lists");
    if (opts.json) { console.log(JSON.stringify(rows, null, 2)); return; }
    if (rows.length === 0) { console.log(chalk.yellow("No lists found.")); return; }

    const header = `${"   ID".padEnd(7)}  ${"Name".padEnd(30)}  ${"Designers".padEnd(10)}  ${"Public".padEnd(8)}  Description`;
    console.log(chalk.dim(header));
    console.log(chalk.dim("─".repeat(100)));
    for (const l of rows) {
      const pub = l.isPublic ? chalk.green("Yes") : chalk.gray("No");
      console.log(
        `${String(l.id).padStart(5)}  ${""}  ${chalk.bold(l.name.padEnd(30))}  ${String(l.designerCount ?? 0).padEnd(10)}  ${pub.padEnd(8)}  ${l.description ?? ""}`
      );
    }
    console.log(chalk.dim(`\n${rows.length} list(s)`));
  } catch (e) {
    if (e instanceof ApiError) { console.error(chalk.red(`✗ ${e.message}`)); process.exit(1); }
    throw e;
  }
}

export async function createListCommand(opts: {
  name: string;
  description?: string;
  public?: boolean;
  json?: boolean;
}) {
  try {
    const l = await api.post<TapestryList>("/api/cli/lists", {
      name: opts.name,
      description: opts.description,
      isPublic: opts.public ?? false,
    });
    if (opts.json) { console.log(JSON.stringify(l, null, 2)); return; }
    console.log(chalk.green(`✓ Created list "${l.name}" (ID: ${l.id})`));
  } catch (e) {
    if (e instanceof ApiError) { console.error(chalk.red(`✗ ${e.message}`)); process.exit(1); }
    throw e;
  }
}

export async function addToListCommand(listId: string, designerId: string, opts: { notes?: string; json?: boolean }) {
  try {
    const result = await api.post<{ message: string }>(`/api/cli/lists/${listId}/designers`, {
      designerId: parseInt(designerId),
      notes: opts.notes,
    });
    if (opts.json) { console.log(JSON.stringify(result, null, 2)); return; }
    console.log(chalk.green(`✓ ${result.message}`));
  } catch (e) {
    if (e instanceof ApiError) { console.error(chalk.red(`✗ ${e.message}`)); process.exit(1); }
    throw e;
  }
}

export async function removeFromListCommand(listId: string, designerId: string, opts: { json?: boolean }) {
  try {
    const result = await api.delete<{ message: string }>(`/api/cli/lists/${listId}/designers/${designerId}`);
    if (opts.json) { console.log(JSON.stringify(result, null, 2)); return; }
    console.log(chalk.green(`✓ ${result.message}`));
  } catch (e) {
    if (e instanceof ApiError) { console.error(chalk.red(`✗ ${e.message}`)); process.exit(1); }
    throw e;
  }
}
