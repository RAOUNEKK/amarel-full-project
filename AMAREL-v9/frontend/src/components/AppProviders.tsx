import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, STORAGE_KEY, type AppStore } from "@/store/store";
import { hydrateCart, type CartLine } from "@/store/cartSlice";
import { hydrateCatalog, setFavorites, setProducts } from "@/store/catalogSlice";
import {
  AUTH_EXPIRED_EVENT, clearSession, fetchProducts, getCartApi, getFavoritesApi, getToken, getUser, saveCartApi, saveFavoritesApi,
  type AuthUser,
} from "@/lib/api";
import type { Product } from "@/data/products";

interface UIState {
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  activeProduct: Product | null;
  openProduct: (p: Product | null) => void;
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;
  user: AuthUser | null;
  authReady: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}
const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

// Visitors without an account keep their cart and favourites in this browser only.
// Once someone logs in, the account (MongoDB) takes over and this copy is deleted.
const GUEST_KEY = "amarel-guest-data";
const readGuestData = (): { cart: CartLine[]; favorites: string[] } | null => {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_KEY) || "null");
    if (!raw || !Array.isArray(raw.cart) || !Array.isArray(raw.favorites)) return null;
    return raw;
  } catch { return null; }
};
const UICtx = createContext<UIState | null>(null);
export const useUI = () => {
  const c = useContext(UICtx);
  if (!c) throw new Error("useUI outside provider");
  return c;
};

export function AppProviders({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();
  const store = storeRef.current;

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeProduct, openProduct] = useState<Product | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // restore the session after mount, and log out if the server rejects the token
  useEffect(() => {
    setUser(getUser());
    setAuthReady(true);
    const expired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, expired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expired);
  }, []);

  const logout = () => {
    clearSession();
    setUser(null);
    // the next person on this browser should not see this cart
    try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
    store.dispatch(hydrateCart([]));
    store.dispatch(setFavorites([]));
  };
  // Keep the storefront in its intended warm, light theme regardless of system settings.
  useEffect(() => {
    document.documentElement.dataset["theme"] = "light";
    document.documentElement.style.colorScheme = "light";
    localStorage.setItem("amarel-theme", "light");
  }, []);

  // Local persistence (browser only, after hydration).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Only cache the public catalogue. Cart and favourites belong to the
        // authenticated account and are loaded from MongoDB through the API.
        if (saved.catalog?.products) store.dispatch(hydrateCatalog({ products: saved.catalog.products, favorites: [] }));
      }
      // a visitor who is not logged in gets their cart and favourites back after a refresh
      if (!getToken()) {
        const guest = readGuestData();
        if (guest) {
          store.dispatch(hydrateCart(guest.cart));
          store.dispatch(setFavorites(guest.favorites));
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    return store.subscribe(() => {
      const state = store.getState();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          catalog: { products: state.catalog.products },
        }));
        if (getToken()) localStorage.removeItem(GUEST_KEY);
        else localStorage.setItem(GUEST_KEY, JSON.stringify({ cart: state.cart.items, favorites: state.catalog.favorites }));
      } catch { /* storage full or blocked, the shop still works */ }
    });
  }, [store]);

  // get the real catalogue from the backend, keep the local data if it is down
  useEffect(() => {
    fetchProducts()
      .then((list) => { if (list.length) store.dispatch(setProducts(list)); })
      .catch((err) => console.warn("Backend not reachable, using local products:", err.message));
  }, [store]);

  // cart and favourites follow the account: load them at login, then save every change
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let ready = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSaved = "";

    const snapshot = () => {
      const s = store.getState();
      return JSON.stringify([s.cart.items.map((i) => [i.id, i.quantity]), [...s.catalog.favorites].sort()]);
    };

    const push = async () => {
      const s = store.getState();
      const snap = snapshot();
      try {
        await Promise.all([saveCartApi(s.cart.items), saveFavoritesApi(s.catalog.favorites)]);
        lastSaved = snap;
      } catch (err) {
        console.warn("Could not save cart/favourites:", err);
      }
    };

    (async () => {
      try {
        const [serverCart, serverFavs] = await Promise.all([getCartApi(), getFavoritesApi()]);
        if (cancelled) return;
        // The account is authoritative; merge any in-memory items created before login.
        const local = store.getState();
        const lines = new Map<string, CartLine>(serverCart.map((l) => [l.id, { ...l }]));
        for (const l of local.cart.items) {
          if (!isObjectId(l.id)) continue;
          const have = lines.get(l.id);
          if (!have) lines.set(l.id, l);
          else have.quantity = Math.max(have.quantity, l.quantity);
        }
        const favs = new Set([...serverFavs, ...local.catalog.favorites.filter(isObjectId)]);
        lastSaved = JSON.stringify([serverCart.map((i) => [i.id, i.quantity]), [...serverFavs].sort()]);
        store.dispatch(hydrateCart([...lines.values()]));
        store.dispatch(setFavorites([...favs]));
      } catch (err) {
        console.warn("Could not load cart/favourites:", err);
        return;
      }
      ready = true;
      if (snapshot() !== lastSaved) void push();
    })();

    const unsubscribe = store.subscribe(() => {
      if (!ready || snapshot() === lastSaved) return;
      clearTimeout(timer);
      timer = setTimeout(push, 500);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      clearTimeout(timer);
    };
  }, [user, store]);

  return (
    <Provider store={store}>
      <UICtx.Provider value={{ cartOpen, setCartOpen, searchOpen, setSearchOpen, activeProduct, openProduct, authOpen, setAuthOpen, checkoutOpen, setCheckoutOpen, user, authReady, setUser, logout }}>
        {children}
      </UICtx.Provider>
    </Provider>
  );
}
