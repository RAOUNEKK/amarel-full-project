import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CATEGORIES, formatPrice, imageLibrary, type Category, type Product } from "@/data/products";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { addProduct, deleteProduct, setProducts, updateProduct } from "@/store/catalogSlice";
import { useUI } from "@/components/AppProviders";
import { AuthForm } from "@/components/AuthForm";
import {
  ApiError, ORDER_STATUSES, allOrdersApi, createProductApi, deleteProductApi, fetchProducts, setOrderStatusApi,
  updateProductApi, uploadImageApi, type AuthUser, type Order, type OrderStatus,
} from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — AMARÉL" },
      { name: "description", content: "AMARÉL product and stock management, connected to the backend API." },
      { property: "og:title", content: "Owner dashboard — AMARÉL" },
      { property: "og:description", content: "AMARÉL product and stock management, connected to the backend API." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const images = Object.entries(imageLibrary);

function Admin() {
  const { user, authReady, setUser, logout } = useUI();
  if (!authReady) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-20 md:px-0">
        <p className="eyebrow">Owner dashboard</p>
        <h1 className="mt-3 text-5xl text-foreground">Log in</h1>
        <p className="mt-3 mb-8 text-sm text-muted-foreground">Authentication required. Only the store owner can manage products and orders.</p>
        <AuthForm onDone={setUser} />
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-5 pt-20 text-center md:px-0">
        <p className="eyebrow">403</p>
        <h1 className="mt-3 text-4xl text-foreground">Access denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">You are logged in as {user.email}, which is a customer account. The dashboard is reserved for the store owner.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/shop" className="btn-glow">Back to the shop</Link>
          <button onClick={logout} className="btn-ghost-glow">Log out</button>
        </div>
      </div>
    );
  }
  return <Dashboard user={user} onLogout={logout} onExpired={() => setUser(null)} />;
}

function Dashboard({ user, onLogout, onExpired }: { user: AuthUser; onLogout: () => void; onExpired: () => void }) {
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.catalog.products);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [tab, setTab] = useState<"products" | "orders">("products");

  const revenue = orders.filter((o) => o.status !== "Cancelled").reduce((n, o) => n + o.total, 0);
  const stats = [
    ["Products", products.length],
    ["Out of stock", products.filter((p) => p.stock <= 0).length],
    ["Orders", orders.length],
    ["Revenue", formatPrice(revenue)],
  ];

  // show the API error, and go back to the login form if the token is no good
  const fail = (err: unknown) => {
    const msg = err instanceof ApiError ? err.message : "Something went wrong";
    toast.error(msg);
    if (err instanceof ApiError && err.status === 401) onExpired();
  };

  useEffect(() => {
    allOrdersApi().then(setOrders).catch(fail);

    // keep orders (and stock, which drops when an order is placed) up to date
    // without a manual refresh: every 30 s, and when the admin returns to the tab.
    // (the API allows 100 requests / 15 min per IP, so keep this to one request per tick;
    // products are only reloaded when the number of orders changed)
    let known = -1;
    const refresh = () => {
      if (document.hidden) return;
      allOrdersApi()
        .then((list) => {
          setOrders(list);
          if (known !== -1 && list.length !== known) fetchProducts().then((p) => dispatch(setProducts(p))).catch(() => {});
          known = list.length;
        })
        .catch((err) => { if (err instanceof ApiError && err.status === 401) onExpired(); });
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeStatus = async (o: Order, status: OrderStatus) => {
    try {
      const updated = await setOrderStatusApi(o.id, status);
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, ...updated } : x)));
      toast.success(`Order ${o.number} is now ${status}`);
      // a cancelled order puts its items back in stock
      if (status === "Cancelled") dispatch(setProducts(await fetchProducts()));
    } catch (err) { fail(err); }
  };

  const changeStock = async (p: Product, value: number) => {
    const stock = Math.max(0, Math.floor(value) || 0);
    if (stock === p.stock) return;
    try {
      dispatch(updateProduct(await updateProductApi({ ...p, stock })));
      toast.success("Stock updated");
    } catch (err) { fail(err); }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    try {
      await deleteProductApi(p.id);
      dispatch(deleteProduct(p.id));
      toast("Product deleted");
    } catch (err) { fail(err); }
  };

  const save = async (p: Product, isNew: boolean) => {
    try {
      dispatch(isNew ? addProduct(await createProductApi(p)) : updateProduct(await updateProductApi(p)));
      toast.success(isNew ? "Product added" : "Product updated");
      setEditing(null);
    } catch (err) { fail(err); }
  };

  const blank = (): Product => ({ id: `p-${Date.now()}`, name: "", category: "Furniture", price: 0, description: "", image: imageLibrary.furniture, stock: 1, createdAt: Date.now(), badge: "New" });

  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-14 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Owner dashboard · {user.name}</p>
          <h1 className="mt-3 text-5xl text-foreground">Manage the <span className="font-medium">store</span></h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">Products, stock and orders are saved in the database.</p>
        </div>
        <button onClick={onLogout} className="btn-ghost-glow"><LogOut size={16} /> Log out</button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card-glow rounded-2xl p-6">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">{l}</p>
            <p className="mt-2 font-display text-4xl font-light">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex gap-2">
        {(["products", "orders"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-5 py-2 text-sm capitalize transition ${tab === t ? "border-foreground bg-foreground text-background" : "border-input text-foreground/80"}`}>{t}</button>
        ))}
        {tab === "products" && <button onClick={() => setEditing(blank())} className="btn-glow ml-auto !py-2"><Plus size={16} /> Add product</button>}
      </div>

      <div className="card-glow mt-6 overflow-x-auto rounded-2xl !transform-none">
        {tab === "products" ? (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs tracking-widest text-muted-foreground uppercase">
              <tr className="border-b border-border"><th className="p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="flex items-center gap-3 p-4"><img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" /><span className="font-display text-lg text-foreground">{p.name}</span></td>
                  <td className="text-muted-foreground">{p.category}</td>
                  <td className="text-primary">{formatPrice(p.price)}</td>
                  <td>
                    <input key={`${p.id}-${p.stock}`} type="number" min={0} defaultValue={p.stock} aria-label={`Stock for ${p.name}`} onBlur={(e) => changeStock(p, Number(e.target.value))} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className="input-glow !w-20 !rounded-lg !px-3 !py-1.5" />
                    {p.stock <= 0 && <span className="ml-2 text-xs text-destructive">Unavailable</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} className="p-2 hover:text-primary"><Pencil size={16} /></button>
                    <button onClick={() => remove(p)} aria-label={`Delete ${p.name}`} className="p-2 hover:text-destructive"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[960px] text-sm">
            <thead className="text-left text-xs tracking-widest text-muted-foreground uppercase">
              <tr className="border-b border-border"><th className="p-4">Order</th><th>Client</th><th>Order details</th><th>Total</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>}
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 align-top last:border-0">
                  <td className="p-4">
                    <p className="font-medium text-foreground">{o.number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </td>
                  {/* everything the client typed in the confirmation form */}
                  <td className="py-4 pr-4">
                    <p className="text-foreground">{o.shippingAddress.fullName}</p>
                    <p><a href={`tel:${o.shippingAddress.phone.replace(/[^\d+]/g, "")}`} className="text-primary hover:underline">{o.shippingAddress.phone}</a></p>
                    <p className="text-muted-foreground"><span className="text-foreground">{o.shippingAddress.city}</span> · {o.shippingAddress.address}</p>
                    {o.shippingAddress.notes && <p className="mt-1 text-xs text-muted-foreground italic">“{o.shippingAddress.notes}”</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{o.isGuest ? "Guest order (no account)" : `Account: ${o.customer?.email ?? ""}`}</p>
                  </td>
                  <td className="py-4 pr-4">
                    {o.items.map((i) => (
                      <div key={`${o.id}-${i.product}`} className="flex justify-between gap-4">
                        <span className="text-foreground">{i.quantity} × {i.name}</span>
                        <span className="text-muted-foreground">{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    ))}
                    <div className="mt-2 space-y-0.5 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Products</span><span>{formatPrice(o.subtotal)}</span></div>
                      <div className="flex justify-between"><span>Delivery ({o.shippingAddress.city})</span><span>{formatPrice(o.deliveryFee)}</span></div>
                      <div className="flex justify-between"><span>Payment</span><span>{o.paymentMethod}</span></div>
                    </div>
                  </td>
                  <td className="py-4 font-medium text-primary">{formatPrice(o.total)}</td>
                  <td className="p-4">
                    <select value={o.status} disabled={o.status === "Cancelled"} aria-label={`Status for ${o.number}`} onChange={(e) => changeStatus(o, e.target.value as OrderStatus)} className="input-glow !w-36 !rounded-lg !py-1.5">
                      {ORDER_STATUSES.map((st) => <option key={st}>{st}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductForm product={editing} isNew={!!editing && !products.some((p) => p.id === editing.id)} onClose={() => setEditing(null)} onSave={save} />
    </div>
  );
}

function ProductForm({ product, isNew, onClose, onSave }: { product: Product | null; isNew: boolean; onClose: () => void; onSave: (p: Product, isNew: boolean) => void | Promise<void> }) {
  const [draft, setDraft] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const p = draft && product && draft.id === product.id ? draft : product;
  if (product && (!draft || draft.id !== product.id)) queueMicrotask(() => setDraft(product));
  const set = (patch: Partial<Product>) => p && setDraft({ ...p, ...patch });

  const pickFile = async (file: File | undefined) => {
    if (!file || !p) return;
    setError("");
    setUploading(true);
    try {
      set({ image: await uploadImageApi(file) });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) return;
    if (uploading) return setError("Please wait for the photo to finish uploading.");
    if (!p.name.trim()) return setError("Name is required.");
    if (!(p.price > 0)) return setError("Price must be greater than 0.");
    setError("");
    onSave({ ...p, name: p.name.trim() }, isNew);
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl border-border bg-background">
        <DialogTitle className="font-display text-3xl font-medium text-foreground">{isNew ? "Add product" : "Edit product"}</DialogTitle>
        <DialogDescription className="text-muted-foreground">Saved to the database.</DialogDescription>
        {p && (
          <form onSubmit={save} className="space-y-4">
            <input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Name" aria-label="Name" className="input-glow" />
            <div className="grid grid-cols-3 gap-3">
              <select value={p.category} onChange={(e) => set({ category: e.target.value as Category })} aria-label="Category" className="input-glow">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input type="number" min={0} value={p.price} onChange={(e) => set({ price: Number(e.target.value) })} aria-label="Price (DA)" placeholder="Price (DA)" className="input-glow" />
              <input type="number" min={0} value={p.stock} onChange={(e) => set({ stock: Number(e.target.value) })} aria-label="Stock" placeholder="Stock" className="input-glow" />
            </div>
            <textarea rows={3} value={p.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" aria-label="Description" className="input-glow !rounded-2xl" />
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
              <img src={p.image} alt="Product preview" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <label className={`btn-ghost-glow cursor-pointer !py-2 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  <ImagePlus size={16} /> {uploading ? "Uploading…" : "Upload a photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG or WebP. Or pick one of the sample photos below.</p>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2" role="radiogroup" aria-label="Sample photos">
              {images.map(([k, src]) => (
                <button type="button" key={k} onClick={() => set({ image: src })} aria-label={k} aria-checked={p.image === src} role="radio"
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${p.image === src ? "border-primary" : "border-transparent"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button className="btn-glow w-full justify-center">Save</button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
