import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatPrice } from "@/data/products";
import { lookupOrdersApi, type Order } from "@/lib/api";
import { readMyOrders, writeMyOrders } from "@/lib/myOrders";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My orders — AMARÉL" },
      { name: "description", content: "Follow your AMARÉL orders and their delivery status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Orders,
});

const statusColor: Record<string, string> = {
  Pending: "bg-muted text-foreground",
  Processing: "bg-amber-100 text-amber-900",
  Shipped: "bg-sky-100 text-sky-900",
  Delivered: "bg-emerald-100 text-emerald-900",
  Cancelled: "bg-red-100 text-red-900",
};

// No account needed: the orders placed from this browser are remembered here, and their
// status is refreshed from the server (using the order id + the phone typed at checkout).
function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const saved = readMyOrders();
    setOrders(saved);
    if (saved.length === 0) return;
    lookupOrdersApi(saved)
      .then((fresh) => {
        // keep any order the server did not return (still shown from the saved copy)
        const byId = new Map(fresh.map((o) => [o.id, o]));
        const merged = saved.map((o) => byId.get(o.id) ?? o);
        setOrders(merged);
        writeMyOrders(merged);
      })
      .catch(() => setOffline(true));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 pt-14 md:px-10">
      <p className="eyebrow">Your purchases</p>
      <h1 className="mt-3 text-5xl text-foreground md:text-6xl">My <span className="font-medium">orders</span></h1>
      <p className="mt-3 text-sm text-muted-foreground">Orders placed from this device. No account needed. We call you on the phone number you gave to arrange the delivery.</p>
      {offline && <p className="mt-3 text-sm text-destructive">Could not refresh the status right now, showing what was saved.</p>}

      {orders === null ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-3xl text-foreground">No orders yet.</p>
          <Link to="/shop" search={{ q: undefined, category: undefined }} className="btn-glow mt-8">Browse the shop</Link>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {orders.map((o) => (
            <div key={o.id} className="card-glow rounded-2xl p-6 !transform-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl text-foreground">{o.number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${statusColor[o.status] ?? "bg-muted"}`}>{o.status}</span>
              </div>
              <div className="mt-4 space-y-3">
                {o.items.map((i) => (
                  <div key={i.product} className="flex items-center gap-3 text-sm">
                    {i.image && <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                    <span className="flex-1 truncate text-foreground">{i.quantity} × {i.name}</span>
                    <span className="text-muted-foreground">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Products</span><span>{formatPrice(o.subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Delivery · {o.shippingAddress.city}</span><span>{formatPrice(o.deliveryFee)}</span></div>
                <div className="flex flex-wrap justify-between gap-2 pt-1">
                  <span className="text-muted-foreground">{o.shippingAddress.fullName} · {o.shippingAddress.phone} · {o.shippingAddress.address} · {o.paymentMethod}</span>
                  <span className="font-semibold text-foreground">{formatPrice(o.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
