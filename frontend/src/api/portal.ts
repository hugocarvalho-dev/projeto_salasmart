import type { Product, ProductCategory, Purchase } from "../app/portalData";

const BASE = "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly offline: boolean;

  constructor(message: string, status: number, offline = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.offline = offline;
  }
}

const OFFLINE_MSG =
  "Não foi possível conectar ao servidor. Verifique sua conexão ou se o sistema está no ar.";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...init,
    });
  } catch {
    throw new ApiError(OFFLINE_MSG, 0, true);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string | string[] };
      detail = Array.isArray(body.message) ? body.message.join("; ") : (body.message ?? "");
    } catch {
      detail = "";
    }
    const fallback =
      res.status >= 500
        ? "O servidor encontrou um erro. Tente novamente em instantes."
        : `Erro ${res.status} ao chamar ${path}`;
    throw new ApiError(detail || fallback, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

interface RawItem {
  name: string;
  qty: number;
}
interface RawPurchase {
  id: string;
  customerName: string;
  room: string;
  date: string;
  items: RawItem[];
  deletedAt: string | null;
  deletedBy: string | null;
  deletionReason: string | null;
}
interface RawProduct {
  id: number;
  name: string;
  category: ProductCategory;
  unit: string;
  active: boolean;
}

const mapPurchase = (p: RawPurchase): Purchase => ({
  id: p.id,
  customerName: p.customerName,
  room: p.room,
  date: new Date(p.date),
  items: p.items.map((i) => ({ name: i.name, qty: i.qty })),
  deletion: p.deletedAt
    ? { by: p.deletedBy ?? "—", reason: p.deletionReason ?? "", at: new Date(p.deletedAt) }
    : undefined,
});

const mapProduct = (p: RawProduct): Product => ({
  id: p.id,
  name: p.name,
  category: p.category,
  unit: p.unit,
  active: p.active,
});

export interface ProductInput {
  name: string;
  category: ProductCategory;
  unit: string;
}

export const getProducts = async (): Promise<Product[]> =>
  (await request<RawProduct[]>("/products")).map(mapProduct);

export const createProduct = async (input: ProductInput): Promise<Product> =>
  mapProduct(
    await request<RawProduct>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

export const updateProduct = async (
  id: number,
  input: Partial<ProductInput>,
): Promise<Product> =>
  mapProduct(
    await request<RawProduct>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );

export const deleteProduct = (id: number): Promise<void> =>
  request<void>(`/products/${id}`, { method: "DELETE" });

export interface PurchaseItemInput {
  productId?: number;
  name: string;
  qty: number;
}
export interface PurchaseInput {
  customerName: string;
  room: string;
  items: PurchaseItemInput[];
}

export const getOrders = async (
  includeDeleted = false,
  month?: string,
): Promise<Purchase[]> => {
  const params = new URLSearchParams();
  if (includeDeleted) params.set("includeDeleted", "true");
  if (month) params.set("month", month);
  const qs = params.toString();
  return (await request<RawPurchase[]>(`/purchases${qs ? `?${qs}` : ""}`)).map(mapPurchase);
};

export const getOrderMonths = (): Promise<string[]> => request<string[]>("/purchases/months");

export const createPurchase = async (input: PurchaseInput): Promise<Purchase> =>
  mapPurchase(
    await request<RawPurchase>("/purchases", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

export const softDeletePurchase = (
  id: string,
  data: { reason: string },
): Promise<unknown> =>
  request(`/purchases/${id}`, { method: "DELETE", body: JSON.stringify(data) });

export interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  administrador: boolean;
  protected: boolean;
}
export interface TeamMemberInput {
  firstName: string;
  lastName: string;
  email: string;
}

export const getTeam = () => request<TeamMember[]>("/team");

export const createTeamMember = (input: TeamMemberInput) =>
  request<TeamMember>("/team", { method: "POST", body: JSON.stringify(input) });

export const updateTeamMember = (id: number, input: Partial<TeamMemberInput>) =>
  request<TeamMember>(`/team/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deleteTeamMember = (id: number) =>
  request<void>(`/team/${id}`, { method: "DELETE" });

export interface Category {
  id: number;
  label: string;
}
export const getCategories = () => request<Category[]>("/settings/categories");
export const createCategory = (label: string) =>
  request<Category>("/settings/categories", { method: "POST", body: JSON.stringify({ label }) });
export const updateCategory = (id: number, label: string) =>
  request<Category>(`/settings/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ label }),
  });
export const deleteCategory = (id: number) =>
  request<void>(`/settings/categories/${id}`, { method: "DELETE" });

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  administrador: boolean;
  teamMemberId: number | null;
}
export const loginWithPassword = (username: string, password: string) =>
  request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const getMe = () => request<AuthUser>("/auth/me");

export const logout = () => request<{ ok: boolean }>("/auth/logout", { method: "POST" });
