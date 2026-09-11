import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

export const ADMIN_COOKIE_NAME = "onetrip_admin_session";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

function getSessionSecret() {
  return process.env.SESSION_SECRET;
}

function sign(value: string) {
  const secret = getSessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function isAdminConfigured() {
  return Boolean(getSessionSecret() && process.env.ADMIN_PANEL_PASSWORD);
}

export function verifyAdminPassword(password: unknown) {
  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (typeof password !== "string" || !expected) return false;

  const actualBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createAdminSession() {
  const payload = `${Date.now()}:${crypto.randomUUID()}`;
  const signature = sign(payload);
  if (!signature) return null;
  return `${payload}.${signature}`;
}

export function isValidAdminSession(token: string | undefined) {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload);
  if (!expected || signature.length !== expected.length) return false;

  const isSignatureValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!isSignatureValid) return false;

  const timestamp = Number(payload.split(":", 1)[0]);
  return Number.isFinite(timestamp) && Date.now() - timestamp >= 0 && Date.now() - timestamp < SESSION_MAX_AGE_MS;
}

export function hasAdminSession(req: Request) {
  return isValidAdminSession(req.cookies?.[ADMIN_COOKIE_NAME]);
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!hasAdminSession(req)) {
    res.status(401).json({ error: "Admin login required." });
    return;
  }
  next();
};

export function setAdminCookie(res: Response, session: string) {
  res.cookie(ADMIN_COOKIE_NAME, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.ADMIN_COOKIE_SECURE !== "false",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });
}

export function clearAdminCookie(res: Response) {
  res.clearCookie(ADMIN_COOKIE_NAME, { httpOnly: true, sameSite: "lax", path: "/" });
}

export function handleAsync(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}