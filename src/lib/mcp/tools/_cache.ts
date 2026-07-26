/**
 * Tiny per-instance TTL cache for MCP tool results.
 * Keyed by (user, tool, arg-hash). Lives on `globalThis` so it survives
 * across warm invocations of the same edge function instance.
 */

type Entry = { value: unknown; expiresAt: number };
const store: Map<string, Entry> =
  (globalThis as unknown as { __mcpCache?: Map<string, Entry> }).__mcpCache ??
  ((globalThis as unknown as { __mcpCache?: Map<string, Entry> }).__mcpCache = new Map());

const DEFAULT_TTL_MS = 60_000;

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): T {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheInvalidate(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}

export function cacheKey(user: string, tool: string, args: unknown): string {
  return `${user}::${tool}::${JSON.stringify(args ?? {})}`;
}
