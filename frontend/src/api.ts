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
  OHRADKA: "Ohradka",
  POLICA: "Polica",
};

export type NameSource = "GENERATED" | "OCR" | "MANUAL";

export const KIND_DEFAULTS: Record<number, string[]> = {
  1: ["SKLAD", "ARCHÍV", "DEPOZIT"],
  2: ["OHRADKA", "CAST", "MIESTNOST", "SEKCIA"],
  3: ["POLICA", "PALETA", "REGAL", "ŠUPLÍK"],
  4: ["KRABICA", "TUBA", "OBAL"],
  5: ["ZLOZKA", "EUROOBAL", "ZAKLADAC", "ŠANÓN"],
  6: ["EUROOBAL", "OBALKA", "FOLIA"],
  7: ["DOKUMENT", "VYKRES", "FOTODOKUMENTACIA"],
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

export type MetadataStatus = "NONE" | "EXTRACTED" | "REVIEWED";

// Hybrid metadata: odporúčané polia + ľubovoľné ďalšie kľúče z LLM.
export type ItemMetadata = {
  stavba?: string | null;
  cast?: string | null;
  projektant?: string | null;
  adresa?: string | null;
  cislo?: string | null;
  datum?: string | null;
  stupen?: string | null;
  [key: string]: string | null | undefined;
};

export const KNOWN_METADATA_KEYS = [
  "stavba",
  "cast",
  "projektant",
  "adresa",
  "cislo",
  "datum",
  "stupen",
  "typ_dokumentu",
  "investor",
  "autor_casti",
] as const;

export const METADATA_LABELS: Record<string, string> = {
  stavba: "Stavba",
  cast: "Časť",
  projektant: "Projektant",
  adresa: "Adresa",
  cislo: "Číslo",
  datum: "Dátum",
  stupen: "Stupeň",
  typ_dokumentu: "Typ dokumentu",
  investor: "Investor",
  autor_casti: "Autor časti",
};

export type Item = {
  id: string;
  level: number;
  kind: string;
  name: string;
  name_source: NameSource;
  ocr_name_suggestion?: string | null;
  type_code?: string | null;
  auto_name?: string | null;
  parent_id: string | null;
  qr_code: string | null;
  note: string | null;
  status: Status;
  metadata?: ItemMetadata;
  metadata_status?: MetadataStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  parent?: Item | null;
};

/** Položka z GET /items/inventory — bez deleted_at, s agregátmi a OCR textom pre tabuľku. */
export type InventoryItem = {
  id: string;
  level: number;
  kind: string;
  name: string;
  name_source: NameSource;
  ocr_name_suggestion?: string | null;
  type_code?: string | null;
  parent_id: string | null;
  qr_code: string | null;
  note: string | null;
  status: Status;
  auto_name?: string | null;
  metadata: ItemMetadata;
  metadata_status: MetadataStatus;
  created_at: string;
  updated_at: string;
  /** Zreťazený OCR text z max 3 najnovších DONE fotiek. Null ak žiadna fotka s OCR. */
  ocr_text: string | null;
  _count: {
    children: number;
    photos: number;
  };
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
    name: string;
    level?: number;
    kind?: string;
    type_code?: string | null;
  } | null;
};

export type PathNode = {
  id: string;
  level: number;
  kind: string;
  name: string;
  parent_id: string | null;
  type_code?: string | null;
};

export type QRLookup = {
  id: string;
  code: string;
  status: QrStatus;
  assignedItem: {
    id: string;
    name: string;
    level?: number;
    kind?: string;
    type_code?: string | null;
    path: PathNode[];
  } | null;
};

export type OcrStatus = "PENDING" | "DONE" | "FAILED";

// Sprint 6: rozlíšenie fotky štítku (vstup do OCR) od vizuálnej referencie
// celej položky (krabica/paleta). OVERVIEW fotky preskočia OCR pipeline,
// frontend PhotoGallery ich zobrazuje v samostatnej sekcii.
export type PhotoType = "LABEL" | "OVERVIEW";

export type Photo = {
  id: string;
  signed_url: string;
  ocr_raw_text: string | null;
  ocr_status: OcrStatus;
  photo_type: PhotoType;
  created_at: string;
  // item_id sa vracia iba z /photos/:id (detail), nie z list endpointu.
  item_id?: string;
};

export type UploadPhotoResponse = {
  id: string;
  signed_url: string;
  ocr_status: OcrStatus;
  photo_type: PhotoType;
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

// ─── Search types (Sprint 4 + Sprint 5) ──────────────────────────────────────

export type MatchSource =
  | "name"
  | "meta_stavba"
  | "meta_cast"
  | "meta_projektant"
  | "meta_adresa"
  | "meta"
  | "note"
  | "ocr";

export type SearchHit = {
  item: {
    id: string;
    level: number;
    kind: string;
    typeCode: string | null;
    name: string;
    qrCode: string | null;
    status: Status;
    note: string | null;
  };
  path: PathNode[];
  matchSource: MatchSource;
  matchSnippet: string | null;
  photo: { storageKey: string; signedUrl: string } | null;
};

export type SearchResponse = {
  query: string;
  count: number;
  hits: SearchHit[];
};

// ─── Box contents types (Sprint 4) ───────────────────────────────────────────

export type BoxFolder = {
  id: string;
  name: string | null;
  qrCode: string | null;
  status: Status;
  note: string | null;
  photo: { storageKey: string; signedUrl: string } | null;
  photoCount: number;
};

export type BoxContents = {
  box: {
    id: string;
    name: string | null;
    qrCode: string | null;
    path: PathNode[];
  };
  folders: BoxFolder[];
};

// ─── Export types (Sprint 4) ─────────────────────────────────────────────────

export type ExportKind = "csv" | "json";

export type ExportDownload = {
  blob: Blob;
  filename: string;
};

// ─── LLM Metadata types (Sprint 7) ───────────────────────────────────────────

export type LlmMetadataStatusResponse = {
  total: number;
  none: number;
  eligible: number;
  extracted: number;
  reviewed: number;
  noApiKey: boolean;
};

export type LlmMetadataResult = {
  photoId: string | null;
  itemId: string;
  metadata: ItemMetadata | null;
  error: string | null;
  ocrTextChars?: number;
};

export type LlmMetadataProcessResponse = {
  processed: number;
  results: LlmMetadataResult[];
};

export type PendingMetadataReviewItem = {
  id: string;
  typeCode: string;
  name: string | null;
  autoName: string | null;
  metadata: ItemMetadata;
  metadataStatus: MetadataStatus;
  qrCode: string | null;
  path: PathNode[];
  photo: { storageKey: string; signedUrl: string } | null;
  /** OCR text poslaný do LLM (náhľad pre review). */
  ocrTextPreview: string | null;
};

export type PendingMetadataReviewResponse = {
  total: number;
  limit: number;
  offset: number;
  items: PendingMetadataReviewItem[];
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
  inventoryItems: () => request<InventoryItem[]>("/items/inventory"),
  previewName: (params: { kind: string; parent_id?: string | null }) => {
    const qs = new URLSearchParams({ kind: params.kind });
    if (params.parent_id) qs.set("parent_id", params.parent_id);
    return request<{ name: string }>(`/items/name-preview?${qs}`);
  },
  getItem: (id: string) => request<Item & { _count: { children: number } }>(`/items/${id}`),
  getItemPath: (id: string) => request<Item[]>(`/items/${id}/path`),
  getChildren: (id: string) => request<Item[]>(`/items/${id}/children`),
  createItem: (data: {
    level: number;
    kind: string;
    name?: string | null;
    parent_id?: string | null;
    note?: string | null;
    qr_code?: string | null;
    status?: Status;
  }) =>
    request<Item>("/items", {
      method: "POST",
      json: data,
    }),
  updateItemName: (id: string, name: string) =>
    request<Item>(`/items/${id}/name`, {
      method: "PATCH",
      json: { name },
    }),
  confirmOcrName: (id: string, name?: string) =>
    request<Item>(`/items/${id}/confirm-ocr-name`, {
      method: "POST",
      json: name !== undefined ? { name } : {},
    }),
  dismissOcrName: (id: string) =>
    request<Item>(`/items/${id}/dismiss-ocr-name`, {
      method: "POST",
      json: {},
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
  qrBulkDelete: (codes: string[]) =>
    request<{ deleted: number; not_found: number; requested: number }>("/qr/bulk-delete", {
      method: "POST",
      json: { codes },
    }),
  qrDelete: (code: string) =>
    request<{ deleted: true; code: string }>(`/qr/${encodeURIComponent(code)}`, {
      method: "DELETE",
    }),

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
  //
  // photoType (Sprint 6) ide cez query string aby backend mohol robiť parse
  // PRED konzumovaním multipart body — keby bol vo FormData, multer by ho
  // dekódoval ako field, ale je čistejšie mať diskriminátor v URL.
  uploadPhoto: async (
    itemId: string,
    file: File,
    photoType: PhotoType = "LABEL",
  ): Promise<UploadPhotoResponse> => {
    const creds = getCredentials();
    const formData = new FormData();
    formData.append("photo", file);
    const qs = new URLSearchParams({ photo_type: photoType }).toString();
    const res = await fetch(`${API_URL}/items/${itemId}/photos?${qs}`, {
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

  // ─── Search (Sprint 4) ─────────────────────────────────────────────────────
  searchItems: (q: string, limit = 50) => {
    const qs = new URLSearchParams();
    qs.set("q", q);
    qs.set("limit", String(limit));
    return request<SearchResponse>(`/search?${qs.toString()}`);
  },

  // ─── Box contents (Sprint 4) ───────────────────────────────────────────────
  fetchBoxContents: (qrCode: string) =>
    request<BoxContents>(`/items/by-qr/${encodeURIComponent(qrCode)}/contents`),

  // ─── LLM Metadata (Sprint 7) ───────────────────────────────────────────────
  fetchLlmMetadataStatus: () =>
    request<LlmMetadataStatusResponse>("/llm-metadata/status"),
  processLlmMetadata: (limit?: number) =>
    request<LlmMetadataProcessResponse>("/llm-metadata/process", {
      method: "POST",
      json: limit !== undefined ? { limit } : {},
    }),
  fetchPendingMetadataReview: (limit = 20, offset = 0) => {
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    qs.set("offset", String(offset));
    return request<PendingMetadataReviewResponse>(
      `/llm-metadata/pending-review?${qs.toString()}`,
    );
  },
  confirmLlmMetadata: (itemId: string, metadata?: ItemMetadata) =>
    request<Item>(`/llm-metadata/${itemId}/confirm`, {
      method: "POST",
      json: metadata !== undefined ? { metadata } : {},
    }),
  editLlmMetadata: (itemId: string, metadata: ItemMetadata) =>
    request<Item>(`/llm-metadata/${itemId}/edit`, {
      method: "POST",
      json: { metadata },
    }),
  rejectLlmMetadata: (itemId: string) =>
    request<Item>(`/llm-metadata/${itemId}/reject`, { method: "POST" }),
  extractLlmMetadata: (itemId: string) =>
    request<LlmMetadataResult>(`/llm-metadata/${itemId}/extract`, { method: "POST" }),

  // ─── Export (Sprint 4) ─────────────────────────────────────────────────────
  // Stiahne CSV/JSON ako Blob. Basic Auth musí ísť cez fetch header — <a href>
  // ho nepošle. Volajúci si vytvorí object URL a klikne na dočasný <a download>.
  exportBlob: async (kind: ExportKind): Promise<ExportDownload> => {
    const creds = getCredentials();
    const res = await fetch(`${API_URL}/export/${kind}`, {
      headers: creds ? { Authorization: authHeader(creds) } : {},
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
    // Parse filename z Content-Disposition: attachment; filename="..."
    // Fallback: archiveapp-export-YYYY-MM-DD.{csv|json}
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
    const filename =
      filenameMatch?.[1] ?? `archiveapp-export-${new Date().toISOString().slice(0, 10)}.${kind}`;
    return { blob: await res.blob(), filename };
  },
};
