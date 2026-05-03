/**
 * SSRF-hardened fetch utilities.
 *
 * Key design decisions:
 *
 * 1. DNS resolution and socket connection are done atomically via a custom
 *    `lookup` override on the http/https Agent.  The same IP that is validated
 *    is the one the kernel actually connects to — eliminating the TOCTOU window
 *    that exists if you validate via dns.lookup() and then let fetch() re-resolve.
 *
 * 2. Redirects are followed manually; each Location header is validated before
 *    the next hop is attempted, and a hard hop-count limit prevents redirect loops.
 *
 * 3. Response bodies are streamed with a byte cap; Content-Length is also checked
 *    before any buffering begins.
 *
 * 4. Only `http:` and `https:` scheme URLs are permitted.
 */

import dns from "dns/promises";
import http from "http";
import https from "https";
import net from "net";

// ---------------------------------------------------------------------------
// Private IPv4 detection
// ---------------------------------------------------------------------------

const BLOCKED_CIDRS_V4: Array<[number, number]> = [
  [0x00000000, 0xff000000],   // 0.0.0.0/8
  [0x0a000000, 0xff000000],   // 10.0.0.0/8
  [0x64400000, 0xffc00000],   // 100.64.0.0/10 (shared address space / CGNAT)
  [0x7f000000, 0xff000000],   // 127.0.0.0/8 (loopback)
  [0xa9fe0000, 0xffff0000],   // 169.254.0.0/16 (link-local + cloud metadata)
  [0xac100000, 0xfff00000],   // 172.16.0.0/12
  [0xc0000000, 0xffffff00],   // 192.0.0.0/24 (IETF protocol assignments)
  [0xc0000200, 0xffffff00],   // 192.0.2.0/24 (TEST-NET-1)
  [0xc0a80000, 0xffff0000],   // 192.168.0.0/16
  [0xc6336400, 0xffffff00],   // 198.51.100.0/24 (TEST-NET-2)
  [0xcb007100, 0xffffff00],   // 203.0.113.0/24 (TEST-NET-3)
  [0xe0000000, 0xf0000000],   // 224.0.0.0/4 (multicast)
  [0xf0000000, 0xf0000000],   // 240.0.0.0/4 (reserved)
  [0xffffffff, 0xffffffff],   // 255.255.255.255
];

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

export function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return BLOCKED_CIDRS_V4.some(([base, mask]) => (n & mask) === (base & mask));
}

// ---------------------------------------------------------------------------
// Private IPv6 detection — handles all mapped/translated forms
// ---------------------------------------------------------------------------

/**
 * Convert two 16-bit hex groups (as strings) to a dotted-decimal IPv4 string.
 * e.g. ("7f00", "0001") → "127.0.0.1"
 */
function hexGroupsToIPv4(hi: string, lo: string): string {
  const hiN = parseInt(hi, 16);
  const loN = parseInt(lo, 16);
  return [
    (hiN >>> 8) & 0xff,
    hiN & 0xff,
    (loN >>> 8) & 0xff,
    loN & 0xff,
  ].join(".");
}

/**
 * Expand an IPv6 address to its canonical 8-group full form (no :: shorthand,
 * no embedded IPv4 notation). Returns null if the input is not parseable.
 */
function expandIPv6(raw: string): string[] | null {
  const ip = raw.toLowerCase().replace(/^\[|\]$/g, "");

  // Mixed notation with embedded IPv4 (e.g. ::ffff:192.168.1.1)
  const mixedMatch = ip.match(/^(.*):(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mixedMatch) {
    if (!net.isIPv4(mixedMatch[2])) return null;
    const [a, b, c, d] = mixedMatch[2].split(".").map(Number);
    const hiHex = ((a << 8) | b).toString(16).padStart(4, "0");
    const loHex = ((c << 8) | d).toString(16).padStart(4, "0");
    const prefix = mixedMatch[1] ? mixedMatch[1] + ":" : "";
    return expandIPv6(`${prefix}${hiHex}:${loHex}`);
  }

  if (ip.includes("::")) {
    const [left, right] = ip.split("::");
    const leftGroups = left ? left.split(":") : [];
    const rightGroups = right ? right.split(":") : [];
    const missingCount = 8 - leftGroups.length - rightGroups.length;
    if (missingCount < 0) return null;
    return [
      ...leftGroups,
      ...Array(missingCount).fill("0"),
      ...rightGroups,
    ];
  }

  const groups = ip.split(":");
  if (groups.length !== 8) return null;
  return groups;
}

export function isPrivateIpv6(rawIp: string): boolean {
  const ip = rawIp.toLowerCase().replace(/^\[|\]$/g, "");

  // Exact loopback shorthand
  if (ip === "::1") return true;

  const groups = expandIPv6(ip);
  if (!groups || groups.length !== 8) {
    // Unparseable — block to be safe
    return true;
  }

  const first = parseInt(groups[0], 16);

  // ::1 (fully expanded: 0:0:0:0:0:0:0:1)
  if (groups.slice(0, 7).every(g => parseInt(g, 16) === 0) && parseInt(groups[7], 16) === 1) {
    return true;
  }

  // :: (unspecified address — 0:0:0:0:0:0:0:0)
  if (groups.every(g => parseInt(g, 16) === 0)) return true;

  // fc00::/7 — unique local (fc00:: and fd00::)
  if ((first & 0xfe00) === 0xfc00) return true;

  // fe80::/10 — link-local
  if ((first & 0xffc0) === 0xfe80) return true;

  // ff00::/8 — multicast
  if ((first & 0xff00) === 0xff00) return true;

  // 0100::/64 — discard prefix (RFC 6666)
  if (
    first === 0x0100 &&
    parseInt(groups[1], 16) === 0 &&
    parseInt(groups[2], 16) === 0 &&
    parseInt(groups[3], 16) === 0
  ) return true;

  // 2001:db8::/32 — documentation/example range (RFC 3849)
  if (first === 0x2001 && parseInt(groups[1], 16) === 0x0db8) return true;

  // 2002::/16 — 6to4; block if embedded IPv4 (groups 1-2) is private
  if (first === 0x2002) {
    const embeddedIPv4 = hexGroupsToIPv4(groups[1], groups[2]);
    if (isPrivateIpv4(embeddedIPv4)) return true;
  }

  // ::ffff:0:0/96 — IPv4-mapped IPv6 (groups 0-4 are 0, group 5 is 0xffff)
  const allZeroPrefix = groups.slice(0, 5).every(g => parseInt(g, 16) === 0);
  if (allZeroPrefix && parseInt(groups[5], 16) === 0xffff) {
    const mappedIPv4 = hexGroupsToIPv4(groups[6], groups[7]);
    return isPrivateIpv4(mappedIPv4);
  }

  // ::ffff:0:0:0/80 — IPv4-translated (groups 0-3 zero, group 4 0xffff, group 5 zero)
  const zeroPrefix4 = groups.slice(0, 4).every(g => parseInt(g, 16) === 0);
  if (
    zeroPrefix4 &&
    parseInt(groups[4], 16) === 0xffff &&
    parseInt(groups[5], 16) === 0x0000
  ) {
    const mappedIPv4 = hexGroupsToIPv4(groups[6], groups[7]);
    return isPrivateIpv4(mappedIPv4);
  }

  // 64:ff9b::/96 — NAT64 well-known prefix (RFC 6146); last 32 bits are IPv4
  if (parseInt(groups[0], 16) === 0x0064 && parseInt(groups[1], 16) === 0xff9b) {
    const allZeroMid = groups.slice(2, 6).every(g => parseInt(g, 16) === 0);
    if (allZeroMid) {
      const mappedIPv4 = hexGroupsToIPv4(groups[6], groups[7]);
      return isPrivateIpv4(mappedIPv4);
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Unified private-IP check
// ---------------------------------------------------------------------------

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);
  if (net.isIPv6(ip)) return isPrivateIpv6(ip);
  // Unknown format — block to be safe
  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class SsrfError extends Error {
  /** Satisfies the optional `code` field on NodeJS.ErrnoException so instances
   *  can be passed directly to http.Agent lookup callbacks without casting. */
  readonly code = "ESSRF";

  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

/**
 * Validate a URL for use in server-side fetches. Checks scheme and resolves the
 * hostname's IP addresses to ensure none are private/internal.
 *
 * NOTE: This is a convenience helper for pre-flight validation. For actual
 * fetching, use `safeFetch()` which pins the validated IP at connect time and
 * thereby eliminates the TOCTOU window between validation and connection.
 */
export async function validatePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfError("Only http and https URLs are permitted");
  }

  // Pre-flight check on the literal hostname/IP (catches obvious literal IPs)
  const bare = parsed.hostname.replace(/^\[|\]$/g, "");
  if (net.isIPv4(bare) && isPrivateIpv4(bare)) {
    throw new SsrfError("Requests to private/internal IP addresses are not permitted");
  }
  if (net.isIPv6(bare) && isPrivateIpv6(bare)) {
    throw new SsrfError("Requests to private/internal IP addresses are not permitted");
  }

  // DNS pre-flight (TOCTOU window exists here; safeFetch() eliminates it via agent lookup)
  if (!net.isIPv4(bare) && !net.isIPv6(bare)) {
    let addresses: Array<{ address: string; family: number }>;
    try {
      addresses = await dns.lookup(bare, { all: true }) as Array<{ address: string; family: number }>;
    } catch {
      throw new SsrfError(`Could not resolve hostname: ${bare}`);
    }
    for (const { address } of addresses) {
      if (isPrivateIp(address)) {
        throw new SsrfError("Requests to private/internal addresses are not permitted");
      }
    }
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Size-capped, SSRF-safe HTTP/HTTPS request via pinned-IP agent
// ---------------------------------------------------------------------------

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB default cap
const MAX_REDIRECT_HOPS = 10;

/**
 * Custom `lookup` callback for http/https agents.
 *
 * This is called by the Node.js networking stack at connection time — the same
 * IP that is validated here is the one the socket actually connects to, which
 * eliminates the DNS rebinding TOCTOU gap that exists when validation and
 * connection are two separate operations.
 */
type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string,
  family: number
) => void;

function makeSafeLookup(hostname: string, _opts: dns.LookupOptions, callback: LookupCallback): void {
  dns.lookup(hostname, { all: true })
    .then((results) => {
      const addresses = results as Array<{ address: string; family: number }>;
      if (addresses.length === 0) {
        // SsrfError satisfies NodeJS.ErrnoException (extends Error, has .code)
        callback(new SsrfError(`Could not resolve hostname: ${hostname}`), "", 0);
        return;
      }
      for (const { address } of addresses) {
        if (isPrivateIp(address)) {
          callback(
            new SsrfError("Requests to private/internal addresses are not permitted"),
            "",
            0
          );
          return;
        }
      }
      const { address, family } = addresses[0];
      callback(null, address, family);
    })
    .catch((err: NodeJS.ErrnoException) => callback(err, "", 0));
}

interface SafeFetchOptions {
  headers?: Record<string, string>;
  maxBytes?: number;
  signal?: AbortSignal;
  /** Internal: redirect hop counter (do not set manually). */
  _redirectCount?: number;
}

interface SafeFetchResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}

/**
 * Fetch a URL safely:
 * - Only http/https destinations allowed
 * - Private/internal IPs blocked at DNS resolution AND at socket-connect time
 *   (eliminating the TOCTOU gap via a custom agent lookup function)
 * - Redirects validated before each hop; limited to MAX_REDIRECT_HOPS
 * - Response body streamed with a hard byte cap
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResponse> {
  const { maxBytes = MAX_RESPONSE_BYTES, signal, _redirectCount = 0 } = options;

  // Pre-flight URL validation (catches bad schemes and literal private IPs immediately)
  const parsed = await validatePublicUrl(rawUrl);

  return new Promise<SafeFetchResponse>((resolve, reject) => {
    const isHttps = parsed.protocol === "https:";
    const AgentClass = isHttps ? https.Agent : http.Agent;

    // The agent uses makeSafeLookup, which validates the IP at connect time.
    // This pins the validated IP so the kernel cannot connect to a different
    // address (DNS rebinding is not possible within a single connection).
    const agent = new AgentClass({ lookup: makeSafeLookup as http.AgentOptions["lookup"] });

    const port = parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80);

    const reqOptions: http.RequestOptions = {
      hostname: parsed.hostname.replace(/^\[|\]$/g, ""),
      port,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        ...(options.headers ?? {}),
        host: parsed.hostname,
      },
      agent,
    };

    const requestFn = isHttps ? https.request : http.request;
    const req = requestFn(reqOptions, (res) => {
      const status = res.statusCode ?? 0;
      const resHeaders = res.headers;

      // Follow redirects (manually so we can validate each hop)
      if (status >= 300 && status < 400) {
        req.destroy();
        if (_redirectCount >= MAX_REDIRECT_HOPS) {
          reject(new SsrfError(`Too many redirects (max ${MAX_REDIRECT_HOPS})`));
          return;
        }
        const locationRaw = Array.isArray(resHeaders.location)
          ? resHeaders.location[0]
          : resHeaders.location;
        if (!locationRaw) {
          reject(new SsrfError("Redirect with no Location header"));
          return;
        }
        let redirectUrl: URL;
        try {
          redirectUrl = new URL(locationRaw, parsed.toString());
        } catch {
          reject(new SsrfError("Invalid redirect URL"));
          return;
        }
        if (redirectUrl.protocol !== "http:" && redirectUrl.protocol !== "https:") {
          reject(new SsrfError("Redirect to non-http/https is not permitted"));
          return;
        }
        resolve(
          safeFetch(redirectUrl.toString(), { ...options, _redirectCount: _redirectCount + 1 })
        );
        return;
      }

      // Content-Length pre-check
      const contentLengthRaw = Array.isArray(resHeaders["content-length"])
        ? resHeaders["content-length"][0]
        : resHeaders["content-length"];
      if (contentLengthRaw) {
        const cl = parseInt(contentLengthRaw, 10);
        if (!isNaN(cl) && cl > maxBytes) {
          req.destroy();
          reject(new SsrfError(`Response too large (content-length ${cl} exceeds ${maxBytes} byte limit)`));
          return;
        }
      }

      // Stream response body with byte cap
      const chunks: Buffer[] = [];
      let totalBytes = 0;

      res.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          req.destroy();
          reject(new SsrfError(`Response body exceeded ${maxBytes} byte limit`));
          return;
        }
        chunks.push(chunk);
      });

      res.on("end", () => {
        const body = Buffer.concat(chunks);

        const headerMap: Record<string, string> = {};
        for (const [k, v] of Object.entries(resHeaders)) {
          if (typeof v === "string") headerMap[k.toLowerCase()] = v;
          else if (Array.isArray(v)) headerMap[k.toLowerCase()] = v[0] ?? "";
        }

        resolve({
          ok: status >= 200 && status < 300,
          status,
          headers: {
            get: (name: string) => headerMap[name.toLowerCase()] ?? null,
          },
          text: async () => body.toString("utf8"),
        });
      });

      res.on("error", reject);
    });

    req.on("error", reject);

    if (signal) {
      const onAbort = () => req.destroy();
      signal.addEventListener("abort", onAbort, { once: true });
      req.on("close", () => signal.removeEventListener("abort", onAbort));
    }

    req.end();
  });
}
