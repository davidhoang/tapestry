import chalk from "chalk";
import { loadConfig, saveConfig, getBaseUrl } from "../config.js";
import { api, ApiError } from "../client.js";

export async function loginCommand(token: string, opts: { url?: string }) {
  if (!token.startsWith("tap_")) {
    console.error(chalk.red("✗ Token must start with tap_"));
    process.exit(1);
  }

  const config = loadConfig();
  if (opts.url) config.baseUrl = opts.url.replace(/\/$/, "");
  config.token = token;
  saveConfig(config);

  try {
    const ws = await api.get<{ name: string; role: string; userEmail: string }>(
      "/api/cli/workspace"
    );
    console.log(
      chalk.green("✓ Authenticated"),
      `as ${chalk.bold(ws.userEmail)} in workspace ${chalk.bold(ws.name)} (role: ${ws.role})`
    );
  } catch (e) {
    if (e instanceof ApiError) {
      console.error(chalk.red(`✗ ${e.message}`));
      config.token = undefined;
      saveConfig(config);
      process.exit(1);
    }
    throw e;
  }
}

export async function logoutCommand() {
  const config = loadConfig();
  config.token = undefined;
  saveConfig(config);
  console.log(chalk.green("✓ Logged out"));
}

export async function whoamiCommand() {
  try {
    const ws = await api.get<{
      name: string;
      slug: string;
      role: string;
      userEmail: string;
      stats: { designers: number; lists: number };
    }>("/api/cli/workspace");
    console.log(
      `${chalk.bold("Email:")}    ${ws.userEmail}\n` +
      `${chalk.bold("Workspace:")} ${ws.name} (${ws.slug})\n` +
      `${chalk.bold("Role:")}     ${ws.role}\n` +
      `${chalk.bold("Designers:")} ${ws.stats.designers}\n` +
      `${chalk.bold("Lists:")}    ${ws.stats.lists}\n` +
      `${chalk.bold("Server:")}   ${getBaseUrl()}`
    );
  } catch (e) {
    if (e instanceof ApiError) {
      console.error(chalk.red(`✗ ${e.message}`));
      process.exit(1);
    }
    throw e;
  }
}
