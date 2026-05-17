const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

// Mapuje typ položky na typ jej povinného rodiča. SKLAD je koreň (null).
// Zdieľané s backendom (backend/src/constants.ts) — pri zmene udržiavať obe.
export const PARENT_TYPE_BY_CHILD: Record<string, string | null> = {
  SKLAD: null,
  PALETA: "SKLAD",
  KRABICA: "PALETA",
  ZLOZKA: "KRABICA",
};

// Pre daný typ rodiča vráti typ ktorý môže byť jeho dieťaťom.
// Používa sa v UI pri "Pridať dieťa" na ItemDetailPage.
export const CHILD_TYPE_BY_PARENT: Record<string, string | null> = {
  SKLAD: "PALETA",
  PALETA: "KRABICA",
  KRABICA: "ZLOZKA",
  ZLOZKA: null,
};

export const TYPE_LABEL: Record<string, string> = {
  SKLAD: "Sklad",
  PALETA: "Paleta",
  KRABICA: "Krabica",
  ZLOZKA: "Zložka",
};

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

export type QrStatus = "FREE" | "ASSIGNED";

export type QRTag = {
  id: string;
  code: string;
  status: QrStatus;
  assigned_item_id: string | null;
  created_at: string;
  assigned_item?: {
    id: string;
    name: string | null;
    type_code: string;
  } | null;
};

export type PathNode = {
  id: string;
  type_code: string;
  name: string | null;
  parent_id: string | null;
};

export type QRLookup = {
  id: string;
  code: string;
  status: QrStatus;
  assignedItem: {
    id: string;
    name: string | null;
    type_code: string;
    path: PathNode[];
  } | null;
};

export type OcrStatus = "PENDING" | "DONE" | "FAILED";

export type Photo = {
  id: string;
  signed_url: string;
  ocr_raw_text: string | null;
  ocr_status: OcrStatus;
  created_at: string;
  // item_id sa vracia iba z /photos/:id (detail), nie z list endpointu.
  item_id?: string;
};

export type UploadPhotoResponse = {
  id: string;
  signed_url: string;
  ocr_status: OcrStatus;
  created_at: string;
};

// ─── OCR types ───────────────────────────────────────────────────────────────

export type OcrStatusCounts = {
  pending: number;
  done: number;
  failed: number;
  total: number;
};

export type FailedPhoto = {
  id: string;
  item_id: string;
  item_name: string | null;
  signed_url: string;
  created_at: string;
};

export type RecentOcrPhoto = {
  id: string;
  item_id: string;
  item_name: string | null;
  item_type_code: string;
  signed_url: string;
  ocr_status: OcrStatus;
  ocr_text_preview: string | null;
  created_at: string;
};

export type ProcessPendingResponse = {
  started: boolean;
  queuedCount: number;
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

  // ─── QR ────────────────────────────────────────────────────────────────────
  qrList: (params?: { status?: QrStatus }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    const q = qs.toString();
    return request<QRTag[]>(`/qr${q ? `?${q}` : ""}`);
  },
  qrLookup: (code: string) =>
    request<QRLookup>(`/qr/${encodeURIComponent(code)}`),
  qrGenerate: (data: { count: number; prefix?: string }) =>
    request<QRTag[]>("/qr/generate", { method: "POST", json: data }),
  qrImport: (data: { codes: string[] }) =>
    request<{ created: number; skipped: number; codes: string[] }>("/qr/import", {
      method: "POST",
      json: data,
    }),
  qrAssign: (code: string, item_id: string) =>
    request<QRTag>(`/qr/${encodeURIComponent(code)}/assign`, {
      method: "POST",
      json: { item_id },
    }),
  qrUnassign: (code: string) =>
    request<QRTag>(`/qr/${encodeURIComponent(code)}/unassign`, { method: "POST" }),

  // ─── Photos ────────────────────────────────────────────────────────────────
  listPhotos: (itemId: string) =>
    request<Photo[]>(`/items/${itemId}/photos`),
  getPhoto: (id: string) => request<Photo>(`/photos/${id}`),
  deletePhoto: (id: string) =>
    request<{ id: string; deleted: true }>(`/photos/${id}`, { method: "DELETE" }),

  // ─── OCR ───────────────────────────────────────────────────────────────────
  fetchOcrStatus: () => request<OcrStatusCounts>("/ocr/status"),
  processOcrPending: (limit?: number) =>
    request<ProcessPendingResponse>("/ocr/process-pending", {
      method: "POST",
      json: limit !== undefined ? { limit } : {},
    }),
  // Vracia Photo v rovnakom tvare ako getPhoto (vrátane item_id) — backend
  // /ocr/retry/:id zámerne mirroruje shape /photos/:id.
  retryOcr: (photoId: string) =>
    request<Photo>(`/ocr/retry/${photoId}`, { method: "POST" }),
  fetchFailedPhotos: () => request<FailedPhoto[]>("/ocr/failed"),
  fetchRecentOcrPhotos: (limit = 20) =>
    request<RecentOcrPhoto[]>(`/ocr/recent?limit=${limit}`),

  // Upload ide mimo request() — FormData potrebuje aby fetch sám nastavil
  // multipart/form-data Content-Type s boundary stringom. Keby sme nastavili
  // 'Content-Type: application/json' z request(), multer by request odmietol.
  uploadPhoto: async (itemId: string, file: File): Promise<UploadPhotoResponse> => {
    const creds = getCredentials();
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch(`${API_URL}/items/${itemId}/photos`, {
      method: "POST",
      headers: creds ? { Authorization: authHeader(creds) } : {},
      body: formData,
    });
    return handle<UploadPhotoResponse>(res);
  },

  // Stiahne PDF so štítkami ako Blob. Volajúci si otvorí URL.createObjectURL(blob)
  // v novom tabe (window.open neumie poslať Basic Auth header).
  qrPrintBlob: async (codes: string[]): Promise<Blob> => {
    const creds = getCredentials();
    const qs = new URLSearchParams();
    qs.set("codes", codes.join(","));
    const res = await fetch(`${API_URL}/qr/print?${qs.toString()}`, {
      headers: creds ? { Authorization: "Basic " + btoa(`${creds.user}:${creds.pass}`) } : {},
    });
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (body && body.error) msg = String(body.error);
      } catch {
        // not JSON; keep the default message
      }
      throw new Error(msg);
    }
    return await res.blob();
  },
};
