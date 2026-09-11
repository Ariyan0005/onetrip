import type { TravelWidget } from '@/lib/widget-store';

export type WidgetInput = Omit<TravelWidget, 'id' | 'updatedAt'>;

export class WidgetApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'WidgetApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
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
    const message = typeof payload === 'object' && payload !== null && 'error' in payload
      ? String(payload.error)
      : 'Widget service request failed.';
    throw new WidgetApiError(response.status, message);
  }
  return payload as T;
}

export function getPublicWidgets() {
  return request<TravelWidget[]>('/widgets');
}

export function getAdminSession() {
  return request<{ authenticated: boolean; configured: boolean }>('/admin/session');
}

export function loginAdmin(password: string) {
  return request<{ authenticated: boolean }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function logoutAdmin() {
  return request<{ authenticated: boolean }>('/admin/logout', { method: 'POST' });
}

export function getAdminWidgets() {
  return request<TravelWidget[]>('/admin/widgets');
}

export function createWidget(widget: WidgetInput) {
  return request<TravelWidget>('/admin/widgets', {
    method: 'POST',
    body: JSON.stringify(widget),
  });
}

export function updateWidget(id: string, widget: Partial<WidgetInput>) {
  return request<TravelWidget>(`/admin/widgets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(widget),
  });
}

export function deleteWidget(id: string) {
  return request<void>(`/admin/widgets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}