const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

// Credentials stored in sessionStorage so they survive React re-renders but reset on tab close.
const STORAGE_KEY = "archiveapp_creds";

type Creds = { user: string; pass: string };

export function getCredentials(): Creds | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Creds) : null;
  } catch {
    return null;
  }
}

export function setCredentials(creds: Creds): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function clearCredentials(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function authHeader(creds: Creds): string {
  return "Basic " + btoa(`${creds.user}:${creds.pass}`);
}

export type ItemType = {
  code: string;
  label: string;
};

export type Status = "NA_MIESTE" | "VYNESENE" | "NEZNAME";

export type Item = {
  id: string;
  type_code: string;
  name: string | null;
  parent_id: string | null;
  qr_code: string | null;
  note: string | null;
  status: Status;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  parent?: Item | null;
};

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body && String(body.error)) ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return body as T;
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const creds = getCredentials();
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(creds ? { Authorization: authHeader(creds) } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: json !== undefined ? JSON.stringify(json) : (init?.body as BodyInit | null | undefined),
  });
  return handle<T>(res);
}

export const api = {
  itemTypes: () => request<ItemType[]>("/item-types"),
  listItems: (params?: { type_code?: string; parent_id?: string | null }) => {
    const qs = new URLSearchParams();
    if (params?.type_code) qs.set("type_code", params.type_code);
    if (params?.parent_id !== undefined) {
      qs.set("parent_id", params.parent_id === null ? "null" : params.parent_id);
    }
    const q = qs.toString();
    return request<Item[]>(`/items${q ? `?${q}` : ""}`);
  },
  getItem: (id: string) => request<Item & { _count: { children: number } }>(`/items/${id}`),
  getItemPath: (id: string) => request<Item[]>(`/items/${id}/path`),
  getChildren: (id: string) => request<Item[]>(`/items/${id}/children`),
  createItem: (data: {
    type_code: string;
    name?: string | null;
    parent_id?: string | null;
    note?: string | null;
    qr_code?: string | null;
  }) =>
    request<Item>("/items", {
      method: "POST",
      json: data,
    }),
  updateItem: (
    id: string,
    data: {
      name?: string | null;
      note?: string | null;
      status?: Status;
      parent_id?: string | null;
    },
  ) =>
    request<Item>(`/items/${id}`, {
      method: "PATCH",
      json: data,
    }),
  deleteItem: (id: string) =>
    request<void>(`/items/${id}`, {
      method: "DELETE",
    }),
};
