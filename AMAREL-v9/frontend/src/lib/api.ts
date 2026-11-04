import type { Product } from "@/data/products";
import type { CartLine } from "@/store/cartSlice";

// backend address, change it in .env (VITE_API_URL)
const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:5000";

const TOKEN_KEY = "amarel-token";
const USER_KEY = "amarel-user";

export interface AuthUser { id: string; name: string; email: string; role: "customer" | "admin" }

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY));
export const getUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
};
export const saveSession = (token: string, user: AuthUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// fired when the server says our token is no good, the app then logs out
export const AUTH_EXPIRED_EVENT = "amarel-auth-expired";

// error that carries the status code and the message from the API
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${API_URL}. Start the backend (cd backend && npm run dev) and check that its terminal says "MongoDB connected".`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = Array.isArray(data.errors) ? `: ${data.errors.join(", ")}` : "";
    // an expired token means we should log out
    if (res.status === 401 && auth) {
      clearSession();
      if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, `${data.message || "Request failed"}${details}`);
  }
  return data as T;
}

// Photos uploaded by the admin live on the API (/api/images/<id>). The database keeps the
// short path, the browser needs the full address.
const imageSrc = (u: string) => (u && u.startsWith("/api/images/") ? `${API_URL}${u}` : u);
const imageStored = (u?: string) => (u && u.startsWith(`${API_URL}/api/images/`) ? u.slice(API_URL.length) : u);

// the API sends dates as strings, the store wants a number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  description: p.description,
  image: imageSrc(p.imageUrl ?? p.image),
  badge: p.badge || undefined,
  bestseller: p.bestseller,
  stock: p.stock,
  createdAt: p.createdAt ? Date.parse(p.createdAt) : Date.now(),
});

const toBody = (p: Partial<Product>) => ({
  name: p.name,
  category: p.category,
  price: p.price,
  description: p.description,
  imageUrl: imageStored(p.image),
  stock: p.stock,
  badge: p.badge ?? "",
  bestseller: p.bestseller ?? false,
});

export async function fetchProducts(): Promise<Product[]> {
  const data = await request<{ products: unknown[] }>("/api/products");
  return data.products.map(toProduct);
}

export async function createProductApi(p: Product): Promise<Product> {
  const data = await request<{ product: unknown }>("/api/products", { method: "POST", body: JSON.stringify(toBody(p)) }, true);
  return toProduct(data.product);
}

export async function updateProductApi(p: Product): Promise<Product> {
  const data = await request<{ product: unknown }>(`/api/products/${p.id}`, { method: "PUT", body: JSON.stringify(toBody(p)) }, true);
  return toProduct(data.product);
}

export async function deleteProductApi(id: string): Promise<void> {
  await request(`/api/products/${id}`, { method: "DELETE" }, true);
}

interface AuthResponse { token: string; user: AuthUser }

export async function loginApi(email: string, password: string) {
  const data = await request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  saveSession(data.token, data.user);
  return data.user;
}

export async function registerApi(name: string, email: string, password: string) {
  const data = await request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  saveSession(data.token, data.user);
  return data.user;
}

// ---- cart and favourites (saved on the server for logged-in users) ----

export async function getCartApi(): Promise<CartLine[]> {
  const data = await request<{ items: { quantity: number; product: unknown }[] }>("/api/cart", {}, true);
  return data.items.map((i) => {
    const p = toProduct(i.product);
    return { id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, quantity: i.quantity };
  });
}

export async function saveCartApi(lines: CartLine[]): Promise<void> {
  const items = lines.map((l) => ({ productId: l.id, quantity: l.quantity }));
  await request("/api/cart", { method: "PUT", body: JSON.stringify({ items }) }, true);
}

export async function getFavoritesApi(): Promise<string[]> {
  const data = await request<{ favorites: string[] }>("/api/favorites", {}, true);
  return data.favorites;
}

export async function saveFavoritesApi(ids: string[]): Promise<void> {
  await request("/api/favorites", { method: "PUT", body: JSON.stringify({ favorites: ids }) }, true);
}

// ---- orders ----

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export const ORDER_STATUSES: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export interface ShippingAddress { fullName: string; phone: string; address: string; city: string; notes?: string }

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  isGuest: boolean;
  paymentMethod: string;
  createdAt: string;
  shippingAddress: ShippingAddress;
  items: { product: string; name: string; price: number; image?: string; quantity: number }[];
  // only for orders placed from an account
  customer?: { name: string; email: string };
}

// Works without an account. If someone is logged in the token is sent so the order
// shows up in "My orders"; otherwise the order is saved as a guest order.
export async function createOrderApi(lines: CartLine[], shippingAddress: ShippingAddress): Promise<Order> {
  const items = lines.map((l) => ({ productId: l.id, quantity: l.quantity }));
  const data = await request<{ order: Order }>("/api/orders", { method: "POST", body: JSON.stringify({ items, shippingAddress }) }, true);
  return data.order;
}

// status of the orders this browser remembers (guests have no account)
export async function lookupOrdersApi(saved: Order[]): Promise<Order[]> {
  const orders = saved.map((o) => ({ id: o.id, phone: o.shippingAddress.phone }));
  return (await request<{ orders: Order[] }>("/api/orders/lookup", { method: "POST", body: JSON.stringify({ orders }) })).orders;
}

export async function myOrdersApi(): Promise<Order[]> {
  return (await request<{ orders: Order[] }>("/api/orders/mine", {}, true)).orders;
}

export async function allOrdersApi(): Promise<Order[]> {
  return (await request<{ orders: Order[] }>("/api/orders", {}, true)).orders;
}

export async function setOrderStatusApi(id: string, status: OrderStatus): Promise<Order> {
  const data = await request<{ order: Order }>(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, true);
  return data.order;
}

// ---- product photos (admin only) ----

const MAX_SIDE = 1600;

// shrinks big phone photos before sending, so uploads are fast and stay under the 4 MB limit
async function shrinkImage(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // the browser could not read it, let the server decide
  }
}

/** Uploads a photo and returns the address to show it with. */
export async function uploadImageApi(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new ApiError(400, "Please choose a JPEG, PNG or WebP image.");
  const body = await shrinkImage(file);
  if (body.size > 4 * 1024 * 1024) throw new ApiError(413, "This image is too large (4 MB max).");
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/images`, {
      method: "POST",
      headers: { "Content-Type": body.type || file.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body,
    });
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${API_URL}.`);
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  if (!res.ok) throw new ApiError(res.status, data.message || "Upload failed");
  return imageSrc(data.url as string);
}
// ---- contact form ----

// The backend emails the message to the store owner (through Resend).
export async function sendContactApi(data: { name: string; email: string; message: string; website?: string }): Promise<void> {
  await request<{ success: boolean }>("/api/contact", { method: "POST", body: JSON.stringify(data) });
}