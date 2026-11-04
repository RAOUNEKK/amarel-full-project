import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { initialProducts, type Product } from "@/data/products";

export interface CatalogState {
  products: Product[];
  favorites: string[];
}

const initialState: CatalogState = { products: initialProducts, favorites: [] };

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    toggleFavorite(state, a: PayloadAction<string>) {
      state.favorites = state.favorites.includes(a.payload)
        ? state.favorites.filter((f) => f !== a.payload)
        : [...state.favorites, a.payload];
    },
    addProduct(state, a: PayloadAction<Product>) {
      state.products.unshift(a.payload);
    },
    updateProduct(state, a: PayloadAction<Product>) {
      const i = state.products.findIndex((p) => p.id === a.payload.id);
      if (i >= 0) state.products[i] = a.payload;
    },
    deleteProduct(state, a: PayloadAction<string>) {
      state.products = state.products.filter((p) => p.id !== a.payload);
      state.favorites = state.favorites.filter((f) => f !== a.payload);
    },
    setStock(state, a: PayloadAction<{ id: string; stock: number }>) {
      const p = state.products.find((x) => x.id === a.payload.id);
      if (p) p.stock = Math.max(0, Math.floor(a.payload.stock));
    },
    // products coming from the API replace the local ones
    setProducts(state, a: PayloadAction<Product[]>) {
      state.products = a.payload;
      const ids = new Set(a.payload.map((p) => p.id));
      state.favorites = state.favorites.filter((f) => ids.has(f));
    },
    resetCatalog() {
      return initialState;
    },
    setFavorites(state, a: PayloadAction<string[]>) {
      state.favorites = a.payload;
    },
    // old saved states also had demo orders, we only keep what still exists
    hydrateCatalog(_s, a: PayloadAction<Partial<CatalogState>>) {
      return { products: a.payload.products ?? initialProducts, favorites: a.payload.favorites ?? [] };
    },
  },
});

export const {
  toggleFavorite, addProduct, updateProduct, deleteProduct, setStock,
  setProducts, setFavorites, resetCatalog, hydrateCatalog,
} = catalogSlice.actions;
export default catalogSlice.reducer;
