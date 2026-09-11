import { Router, type IRouter, type Request } from "express";
import { createAdminSession, clearAdminCookie, handleAsync, hasAdminSession, isAdminConfigured, requireAdmin, setAdminCookie, verifyAdminPassword } from "../lib/admin-session";
import { SupabaseConfigError, SupabaseRequestError, supabaseRequest } from "../lib/supabase";

const router: IRouter = Router();
const categories = new Set(["flights", "hotels", "cars", "bikes", "tours", "transfers", "other"]);
const placements = new Set(["hero", "after-destinations", "before-faq", "footer"]);

type WidgetRecord = {
  id: string;
  title: string;
  provider: string;
  category: string;
  placement: string;
  code: string;
  script_url: string;
  active: boolean;
  updated_at: string;
};

function toWidget(record: WidgetRecord) {
  return {
    id: record.id,
    title: record.title,
    provider: record.provider,
    category: record.category,
    placement: record.placement,
    code: record.code,
    scriptUrl: record.script_url,
    active: record.active,
    updatedAt: record.updated_at,
  };
}

function supabaseError(res: import("express").Response, error: unknown) {
  if (error instanceof SupabaseConfigError) {
    res.status(503).json({ error: "Widget storage is not configured on the server." });
    return;
  }
  if (error instanceof SupabaseRequestError) {
    res.status(502).json({ error: "Widget storage request failed." });
    return;
  }
  res.status(500).json({ error: "Widget service failed." });
}

function validateWidgetInput(body: unknown, partial = false) {
  if (!body || typeof body !== "object") return "A widget object is required.";
  const input = body as Record<string, unknown>;
  const required = ["title", "provider", "category", "placement", "code"];
  if (!partial && required.some((key) => typeof input[key] !== "string" || !String(input[key]).trim())) return "Title, provider, category, placement, and code are required.";
  if (input.title !== undefined && (typeof input.title !== "string" || input.title.length > 160)) return "Widget title is invalid.";
  if (input.provider !== undefined && (typeof input.provider !== "string" || input.provider.length > 120)) return "Provider name is invalid.";
  if (input.code !== undefined && (typeof input.code !== "string" || input.code.length > 300000)) return "Widget code is invalid or too large.";
  if (input.scriptUrl !== undefined && input.scriptUrl !== "" && (typeof input.scriptUrl !== "string" || input.scriptUrl.length > 2000)) return "Script URL is invalid.";
  if (input.category !== undefined && (typeof input.category !== "string" || !categories.has(input.category))) return "Widget category is invalid.";
  if (input.placement !== undefined && (typeof input.placement !== "string" || !placements.has(input.placement))) return "Widget placement is invalid.";
  if (input.active !== undefined && typeof input.active !== "boolean") return "Widget active status is invalid.";
  return null;
}

function toRecord(body: Record<string, unknown>, id: string) {
  return {
    id,
    title: String(body.title).trim(),
    provider: String(body.provider).trim(),
    category: String(body.category),
    placement: String(body.placement),
    code: String(body.code),
    script_url: typeof body.scriptUrl === "string" ? body.scriptUrl.trim() : "",
    active: body.active !== false,
    updated_at: new Date().toISOString(),
  };
}

router.get("/widgets", handleAsync(async (_req, res) => {
  try {
    const records = await supabaseRequest<WidgetRecord[]>("travel_widgets", {
      query: "?select=*&active=eq.true&order=updated_at.desc",
    });
    res.json(records.map(toWidget));
  } catch (error) {
    supabaseError(res, error);
  }
}));

router.post("/admin/login", handleAsync(async (req, res) => {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: "Admin login is not configured on the server." });
    return;
  }
  if (!verifyAdminPassword(req.body?.password)) {
    res.status(401).json({ error: "Invalid admin password." });
    return;
  }
  const session = createAdminSession();
  if (!session) {
    res.status(503).json({ error: "Admin session is not configured on the server." });
    return;
  }
  setAdminCookie(res, session);
  res.json({ authenticated: true });
}));

router.post("/admin/logout", (_req, res) => {
  clearAdminCookie(res);
  res.json({ authenticated: false });
});

router.get("/admin/session", (req, res) => {
  res.json({ authenticated: hasAdminSession(req), configured: isAdminConfigured() });
});

router.get("/admin/widgets", requireAdmin, handleAsync(async (_req, res) => {
  try {
    const records = await supabaseRequest<WidgetRecord[]>("travel_widgets", {
      query: "?select=*&order=updated_at.desc",
    });
    res.json(records.map(toWidget));
  } catch (error) {
    supabaseError(res, error);
  }
}));

router.post("/admin/widgets", requireAdmin, handleAsync(async (req, res) => {
  const validationError = validateWidgetInput(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const id = crypto.randomUUID();
    const record = toRecord(req.body as Record<string, unknown>, id);
    const created = await supabaseRequest<WidgetRecord[]>("travel_widgets", { method: "POST", body: record });
    res.status(201).json(toWidget(created[0]));
  } catch (error) {
    supabaseError(res, error);
  }
}));

router.patch("/admin/widgets/:id", requireAdmin, handleAsync(async (req, res) => {
  const validationError = validateWidgetInput(req.body, true);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const body = req.body as Record<string, unknown>;
    const record: Record<string, unknown> = {
      ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
      ...(body.provider !== undefined ? { provider: String(body.provider).trim() } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.placement !== undefined ? { placement: body.placement } : {}),
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.scriptUrl !== undefined ? { script_url: body.scriptUrl } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      updated_at: new Date().toISOString(),
    };
    const updated = await supabaseRequest<WidgetRecord[]>("travel_widgets", {
      method: "PATCH",
      query: `?id=eq.${encodeURIComponent(String(req.params.id))}`,
      body: record,
    });
    if (!updated[0]) {
      res.status(404).json({ error: "Widget not found." });
      return;
    }
    res.json(toWidget(updated[0]));
  } catch (error) {
    supabaseError(res, error);
  }
}));

router.delete("/admin/widgets/:id", requireAdmin, handleAsync(async (req, res) => {
  try {
    await supabaseRequest("travel_widgets", {
      method: "DELETE",
      query: `?id=eq.${encodeURIComponent(String(req.params.id))}`,
    });
    res.status(204).end();
  } catch (error) {
    supabaseError(res, error);
  }
}));

export default router;