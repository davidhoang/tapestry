import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const CONFIG_DIR = join(homedir(), ".tapestry");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface Config {
  token?: string;
  baseUrl?: string;
}

export function loadConfig(): Config {
  try {
    if (!existsSync(CONFIG_FILE)) return {};
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getToken(): string | undefined {
  return loadConfig().token;
}

export function getBaseUrl(): string {
  return loadConfig().baseUrl ?? "https://tapestry.replit.app";
}
