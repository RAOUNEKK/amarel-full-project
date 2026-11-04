import type { Order } from "@/lib/api";

// Customers have no account, so the orders they place are remembered in this browser.
// We keep the whole order (to show it instantly, even offline) and refresh its status
// from the server using the order id + the phone number typed at checkout.
const KEY = "amarel-my-orders";
const MAX = 20;
export const MY_ORDERS_EVENT = "amarel-my-orders-changed";

export const readMyOrders = (): Order[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

export const writeMyOrders = (orders: Order[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(orders.slice(0, MAX)));
    window.dispatchEvent(new Event(MY_ORDERS_EVENT));
  } catch {
    /* storage blocked: the order is still placed, it just won't be remembered */
  }
};

export const rememberOrder = (order: Order) => writeMyOrders([order, ...readMyOrders().filter((o) => o.id !== order.id)]);
