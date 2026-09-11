import { ReplitConnectors } from "@replit/connectors-sdk";

type SupabaseRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: string;
};

export class SupabaseConfigError extends Error {
  constructor() {
    super("Supabase is not connected. Add a Supabase Replit connection, or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    this.name = "SupabaseConfigError";
  }
}

export class SupabaseRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "SupabaseRequestError";
    this.status = status;
  }
}

function getLegacySupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;

  return url && key ? { url, key } : null;
}

export async function supabaseRequest<T>(table: string, options: SupabaseRequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const path = `/rest/v1/${table}${options.query ?? ""}`;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  const legacyConfig = getLegacySupabaseConfig();
  let response: Response;

  if (legacyConfig) {
    response = await fetch(`${legacyConfig.url}${path}`, {
      method,
      headers: {
        ...headers,
        apikey: legacyConfig.key,
        Authorization: `Bearer ${legacyConfig.key}`,
      },
      body,
    });
  } else if (process.env.REPLIT_CONNECTORS_HOSTNAME) {
    const connectors = new ReplitConnectors();
    response = await connectors.proxy("supabase", path, { method, headers, body });
  } else {
    throw new SupabaseConfigError();
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "message" in payload
      ? String(payload.message)
      : `Supabase request failed with status ${response.status}`;
    throw new SupabaseRequestError(response.status, message);
  }

  return payload as T;
}