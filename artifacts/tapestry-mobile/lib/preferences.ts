import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tiny key/value store on top of AsyncStorage for per-user preferences
 * that don't deserve a backend round-trip — recent searches, recently
 * viewed designers, onboarding flags, push-notification opt-in, etc.
 *
 * Keys are namespaced under `tapestry:` so they don't collide with
 * Clerk's SecureStore tokens or React Query's persisted cache.
 */

const PREFIX = "tapestry:";
const RECENT_SEARCHES_KEY = `${PREFIX}recent-searches`;
const RECENT_DESIGNERS_KEY = `${PREFIX}recent-designers`;
const ONBOARDED_KEY = `${PREFIX}onboarded`;
const INTERESTS_KEY = `${PREFIX}interests`;
const PUSH_OPTED_IN_KEY = `${PREFIX}push-opted-in`;
const PUSH_TOKEN_KEY = `${PREFIX}push-token`;

const MAX_RECENT_SEARCHES = 6;
const MAX_RECENT_DESIGNERS = 12;

// ---------- recent searches ----------

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(term: string): Promise<void> {
  const trimmed = term.trim();
  if (!trimmed) return;
  const current = await getRecentSearches();
  const next = [trimmed, ...current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(
    0,
    MAX_RECENT_SEARCHES,
  );
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
}

// ---------- recently viewed designers ----------

export type RecentDesigner = {
  id: number;
  name: string;
  title: string | null;
  company: string | null;
  photoUrl: string | null;
  viewedAt: number;
};

export async function getRecentDesigners(): Promise<RecentDesigner[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_DESIGNERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addRecentDesigner(d: Omit<RecentDesigner, "viewedAt">): Promise<void> {
  if (!d?.id || !d?.name) return;
  const current = await getRecentDesigners();
  const next = [
    { ...d, viewedAt: Date.now() },
    ...current.filter((x) => x.id !== d.id),
  ].slice(0, MAX_RECENT_DESIGNERS);
  await AsyncStorage.setItem(RECENT_DESIGNERS_KEY, JSON.stringify(next));
}

// ---------- onboarding ----------

export async function hasOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === "true";
}

export async function setOnboarded(value: boolean): Promise<void> {
  if (value) await AsyncStorage.setItem(ONBOARDED_KEY, "true");
  else await AsyncStorage.removeItem(ONBOARDED_KEY);
}

export async function getInterests(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INTERESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function setInterests(interests: string[]): Promise<void> {
  await AsyncStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
}

// ---------- push notifications ----------

export async function getPushOptedIn(): Promise<boolean> {
  return (await AsyncStorage.getItem(PUSH_OPTED_IN_KEY)) === "true";
}

export async function setPushOptedIn(value: boolean): Promise<void> {
  if (value) await AsyncStorage.setItem(PUSH_OPTED_IN_KEY, "true");
  else await AsyncStorage.removeItem(PUSH_OPTED_IN_KEY);
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function setStoredPushToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  else await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}
