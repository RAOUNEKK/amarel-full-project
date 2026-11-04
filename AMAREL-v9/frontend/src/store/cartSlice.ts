import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "@/data/products";

export interface CartLine {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

export interface CartState {
  items: CartLine[];
}

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Product>) {
      const p = action.payload;
      const line = state.items.find((i) => i.id === p.id);
      if (line) line.quantity += 1;
      else
        state.items.push({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, quantity: 1 });
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    increaseQuantity(state, action: PayloadAction<string>) {
      const line = state.items.find((i) => i.id === action.payload);
      if (line) line.quantity += 1;
    },
    // Quantity 1 → decrease removes the line; quantity never goes negative.
    decreaseQuantity(state, action: PayloadAction<string>) {
      const line = state.items.find((i) => i.id === action.payload);
      if (!line) return;
      if (line.quantity <= 1) state.items = state.items.filter((i) => i.id !== action.payload);
      else line.quantity -= 1;
    },
    clearCart(state) {
      state.items = [];
    },
    hydrateCart(state, action: PayloadAction<CartLine[]>) {
      state.items = action.payload;
    },
  },
});

export const { addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, hydrateCart } =
  cartSlice.actions;
export default cartSlice.reducer;

// Cart count = total units across all lines.
export const selectCartCount = (s: { cart: CartState }) => s.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartSubtotal = (s: { cart: CartState }) =>
  s.cart.items.reduce((n, i) => n + i.quantity * i.price, 0);
