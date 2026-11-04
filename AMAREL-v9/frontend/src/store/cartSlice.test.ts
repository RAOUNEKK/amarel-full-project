import { describe, expect, it } from "vitest";
import reducer, { addToCart, decreaseQuantity, increaseQuantity, removeFromCart, clearCart, selectCartCount, selectCartSubtotal } from "./cartSlice";
import { initialProducts } from "@/data/products";

const a = initialProducts[0]!;
const b = initialProducts[1]!;

describe("cart reducer", () => {
  it("adding the same product twice increments quantity", () => {
    let s = reducer(undefined, addToCart(a));
    s = reducer(s, addToCart(a));
    expect(s.items).toHaveLength(1);
    expect(s.items[0]!.quantity).toBe(2);
  });
  it("decrease at quantity 1 removes the line, never negative", () => {
    let s = reducer(undefined, addToCart(a));
    s = reducer(s, decreaseQuantity(a.id));
    expect(s.items).toHaveLength(0);
  });
  it("count is total units and subtotal sums lines", () => {
    let s = reducer(undefined, addToCart(a));
    s = reducer(s, increaseQuantity(a.id));
    s = reducer(s, addToCart(b));
    expect(selectCartCount({ cart: s })).toBe(3);
    expect(selectCartSubtotal({ cart: s })).toBe(a.price * 2 + b.price);
  });
  it("remove and clear", () => {
    let s = reducer(undefined, addToCart(a));
    s = reducer(s, addToCart(b));
    s = reducer(s, removeFromCart(a.id));
    expect(s.items.map((i) => i.id)).toEqual([b.id]);
    expect(reducer(s, clearCart()).items).toHaveLength(0);
  });
});
