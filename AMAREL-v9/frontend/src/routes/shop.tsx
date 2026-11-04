import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, type Category } from "@/data/products";
import { useAppSelector } from "@/store/store";

type Sort = "featured" | "price-asc" | "price-desc" | "newest";
interface ShopSearch { q?: string | undefined; category?: Category | undefined; sort?: Sort | undefined }

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    category: CATEGORIES.includes(s["category"] as Category) ? (s["category"] as Category) : undefined,
    sort: ["featured", "price-asc", "price-desc", "newest"].includes(s["sort"] as string) ? (s["sort"] as Sort) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop — AMARÉL" },
      { name: "description", content: "Browse sofas, chairs, lamps and vases from the AMARÉL collection." },
      { property: "og:title", content: "Shop — AMARÉL" },
      { property: "og:description", content: "Browse sofas, chairs, lamps and vases from the AMARÉL collection." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { q = "", category, sort = "featured" } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const products = useAppSelector((s) => s.catalog.products);
  const set = (patch: ShopSearch) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  let list = products.filter(
    (p) => (!category || p.category === category) && p.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "newest") list = [...list].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-14 md:px-10">
      <p className="eyebrow">The collection</p>
      <h1 className="mt-3 text-5xl text-foreground md:text-6xl">Shop <span className="font-medium">everything</span></h1>

      <div className="glass sticky top-[76px] z-30 mt-10 flex flex-col gap-4 rounded-3xl p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Search by product name" aria-label="Search products" className="input-glow !pl-11" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[undefined, ...CATEGORIES].map((c) => (
            <button key={c ?? "all"} onClick={() => set({ category: c })} aria-pressed={category === c}
              className={`rounded-full border px-4 py-2 text-xs transition ${category === c ? "border-foreground bg-foreground text-background" : "border-input text-foreground/80 hover:border-foreground"}`}>
              {c ?? "All"}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => set({ sort: e.target.value as Sort })} aria-label="Sort" className="input-glow md:!w-48">
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">{list.length} {list.length === 1 ? "piece" : "pieces"}</p>
      {list.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-3xl text-foreground">Nothing matches “{q}”.</p>
          <p className="mt-2 text-muted-foreground">Try another word or clear the filters.</p>
          <button onClick={() => navigate({ search: {} })} className="btn-ghost-glow mt-6">Clear filters</button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 items-start gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
