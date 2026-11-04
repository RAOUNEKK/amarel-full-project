import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Minus, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUI } from "./AppProviders";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { addToCart, clearCart, decreaseQuantity, increaseQuantity, removeFromCart, selectCartCount, selectCartSubtotal } from "@/store/cartSlice";
import { setProducts } from "@/store/catalogSlice";
import { formatPrice } from "@/data/products";
import { ApiError, createOrderApi, fetchProducts, type Order } from "@/lib/api";
import { readMyOrders, rememberOrder, MY_ORDERS_EVENT } from "@/lib/myOrders";
import { DELIVERY_CITIES, deliveryFeeFor, isValidPhone } from "@/data/delivery";

export function CartDrawer() {
  const { cartOpen, setCartOpen, setCheckoutOpen } = useUI();
  const items = useAppSelector((s) => s.cart.items);
  const count = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const dispatch = useAppDispatch();
  const [recent, setRecent] = useState<Order[]>([]);
  useEffect(() => {
    const load = () => setRecent(readMyOrders().slice(0, 3));
    load();
    window.addEventListener(MY_ORDERS_EVENT, load);
    return () => window.removeEventListener(MY_ORDERS_EVENT, load);
  }, []);

  // no account needed: anyone can go straight to the order confirmation
  const checkout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex w-full flex-col border-l border-border bg-background p-0 sm:max-w-md">
        <div className="border-b border-border p-6">
          <SheetTitle className="font-display text-3xl font-medium text-foreground">Your cart</SheetTitle>
          <SheetDescription className="text-muted-foreground">{count} {count === 1 ? "item" : "items"}</SheetDescription>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {items.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-display text-2xl text-foreground">Your cart is quiet.</p>
              <p className="mt-2 text-sm text-muted-foreground">Add a piece you love to begin.</p>
              <Link to="/shop" onClick={() => setCartOpen(false)} className="btn-ghost-glow mt-6">Browse the shop</Link>
            </div>
          )}
          {recent.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="eyebrow">Your orders</p>
              <div className="mt-3 space-y-2">
                {recent.map((o) => (
                  <Link key={o.id} to="/orders" onClick={() => setCartOpen(false)} className="flex items-center justify-between gap-3 text-sm hover:text-primary">
                    <span className="font-medium text-foreground">{o.number}</span>
                    <span className="text-muted-foreground">{o.status} · {formatPrice(o.total)}</span>
                  </Link>
                ))}
              </div>
              <Link to="/orders" onClick={() => setCartOpen(false)} className="mt-3 inline-block text-sm text-primary underline">See all my orders</Link>
            </div>
          )}
          {items.map((i) => (
            <div key={i.id} className="flex gap-4 rounded-2xl border border-border bg-card p-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <img src={i.image} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-display text-lg text-foreground">{i.name}</p>
                  <button onClick={() => dispatch(removeFromCart(i.id))} aria-label={`Remove ${i.name}`} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                </div>
                <p className="text-sm text-primary">{formatPrice(i.price)}</p>
                <div className="mt-2 inline-flex items-center rounded-full border border-border">
                  <button onClick={() => dispatch(decreaseQuantity(i.id))} aria-label="Decrease quantity" className="p-1.5 hover:text-primary"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm" aria-live="polite">{i.quantity}</span>
                  <button onClick={() => dispatch(increaseQuantity(i.id))} aria-label="Increase quantity" className="p-1.5 hover:text-primary"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="space-y-4 border-t border-border p-6">
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <button onClick={checkout} className="btn-glow w-full justify-center">Checkout</button>
            <button onClick={() => dispatch(clearCart())} className="w-full text-sm text-muted-foreground hover:text-primary">Clear cart</button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function CheckoutDialog() {
  const { checkoutOpen, setCheckoutOpen, user } = useUI();
  const items = useAppSelector((s) => s.cart.items);
  const subtotal = useAppSelector(selectCartSubtotal);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", city: "", notes: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  // full final price: products + delivery to the chosen city
  const fee = deliveryFeeFor(form.city);
  const finalTotal = subtotal + (fee ?? 0);

  const close = (open: boolean) => {
    setCheckoutOpen(open);
    if (!open && placed) {
      // the order is done, next time starts with a clean form
      setPlaced(null);
      setForm({ fullName: "", phone: "", address: "", city: "", notes: "" });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const data = { ...form, fullName: form.fullName.trim() || user?.name || "" };
    if (!data.fullName || !data.address.trim() || !data.city) return setError("Please fill in your name, city and address.");
    if (!data.phone.trim()) return setError("Please enter your phone number so we can call you to confirm the delivery.");
    if (!isValidPhone(data.phone)) return setError("The phone number is not valid.");
    setBusy(true);
    try {
      const order = await createOrderApi(items, data);
      dispatch(clearCart());
      rememberOrder(order);
      setPlaced(order);
      toast.success(`Order ${order.number} placed`);
      // stock changed, so reload the catalogue
      fetchProducts().then((list) => dispatch(setProducts(list))).catch(() => {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      // the stock may have changed under us, refresh it so the page is not out of date
      if (err instanceof ApiError && err.status === 409) fetchProducts().then((list) => dispatch(setProducts(list))).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={checkoutOpen} onOpenChange={close}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto rounded-3xl border-border bg-background">
        {placed ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto text-primary" size={44} strokeWidth={1.5} />
            <DialogTitle className="mt-4 font-display text-3xl font-medium text-foreground">Thank you, {placed.shippingAddress.fullName.split(" ")[0]}</DialogTitle>
            <DialogDescription className="mt-2 text-muted-foreground">
              Order {placed.number} is confirmed. We will call you on {placed.shippingAddress.phone} to arrange the delivery to {placed.shippingAddress.city}.
            </DialogDescription>
            <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-left text-sm">
              <Row label="Products" value={formatPrice(placed.subtotal)} />
              <Row label={`Delivery · ${placed.shippingAddress.city}`} value={formatPrice(placed.deliveryFee)} />
              <Row label="To pay in cash on delivery" value={formatPrice(placed.total)} strong />
            </div>
            <button onClick={() => { close(false); navigate({ to: "/orders" }); }} className="btn-ghost-glow mt-6 w-full justify-center">Track my order</button>
            <button onClick={() => close(false)} className="btn-glow mt-3 w-full justify-center">Continue shopping</button>
          </div>
        ) : (
          <>
            <DialogTitle className="font-display text-3xl font-medium text-foreground">Confirm your order</DialogTitle>
            <DialogDescription className="text-muted-foreground">No account needed. Payment is in cash on delivery.</DialogDescription>
            <form onSubmit={submit} className="space-y-4">
              <input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder={user?.name ? `Full name (${user.name})` : "Full name"} aria-label="Full name" autoComplete="name" className="input-glow" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Phone number" aria-label="Phone number" inputMode="tel" autoComplete="tel" required className="input-glow" />
                <select value={form.city} onChange={(e) => set({ city: e.target.value })} aria-label="City" required className="input-glow">
                  <option value="">Choose your city</option>
                  {DELIVERY_CITIES.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
              </div>
              <input value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Delivery address (street, building, landmark)" aria-label="Delivery address" autoComplete="street-address" className="input-glow" />
              <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} maxLength={300} placeholder="Delivery notes (optional): floor, best time to call…" aria-label="Delivery notes" className="input-glow !rounded-2xl" />
              <div className="rounded-2xl border border-border bg-card p-4 text-sm">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-3 py-0.5">
                    <span className="truncate text-muted-foreground">{i.quantity} × {i.name}</span>
                    <span>{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="mt-2 space-y-1 border-t border-border pt-2">
                  <Row label="Products" value={formatPrice(subtotal)} />
                  <Row label="Delivery" value={fee === null ? "Choose a city" : formatPrice(fee)} />
                  <Row label="Final price" value={fee === null ? "—" : formatPrice(finalTotal)} strong />
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <button disabled={busy || items.length === 0} className="btn-glow w-full justify-center">{busy ? "Placing order…" : "Confirm order"}</button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "pt-1 text-base font-semibold text-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

export function ProductModal() {
  const { activeProduct: p, openProduct, setCartOpen } = useUI();
  const dispatch = useAppDispatch();
  return (
    <Dialog open={!!p} onOpenChange={(o) => !o && openProduct(null)}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border-border bg-background p-0">
        {p && (
          <div className="grid md:grid-cols-2">
            <img src={p.image} alt={p.name} className="aspect-[4/5] h-full w-full object-cover" />
            <div className="flex flex-col p-8">
              <p className="eyebrow">{p.category}</p>
              <DialogTitle className="mt-3 font-display text-4xl font-medium text-foreground">{p.name}</DialogTitle>
              <p className="mt-3 text-2xl text-primary">{formatPrice(p.price)}</p>
              <DialogDescription className="mt-5 leading-relaxed text-muted-foreground">{p.description}</DialogDescription>
              <p className="mt-4 text-sm text-muted-foreground">{p.stock > 0 ? `${p.stock} in stock` : "Currently unavailable"}</p>
              <button
                disabled={p.stock <= 0}
                onClick={() => { dispatch(addToCart(p)); openProduct(null); setCartOpen(true); }}
                className="btn-glow mt-auto justify-center"
              >
                Add to cart
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SearchDialog() {
  const { searchOpen, setSearchOpen } = useUI();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate({ to: "/shop", search: { q, category: undefined } });
    setQ("");
  };
  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="rounded-3xl border-border bg-background">
        <DialogTitle className="font-display text-3xl font-medium text-foreground">Search the collection</DialogTitle>
        <DialogDescription className="sr-only">Search products by name</DialogDescription>
        <form onSubmit={submit} className="relative mt-2">
          <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" size={18} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sofa, lamp, throw…" className="input-glow !pl-11" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { X };
