import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { useAppSelector } from "@/store/store";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favourites — AMARÉL" },
      { name: "description", content: "Your saved AMARÉL pieces." },
      { property: "og:title", content: "Favourites — AMARÉL" },
      { property: "og:description", content: "Your saved AMARÉL pieces." },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const products = useAppSelector((s) => s.catalog.products);
  const ids = useAppSelector((s) => s.catalog.favorites);
  const favs = products.filter((p) => ids.includes(p.id));
  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-14 md:px-10">
      <p className="eyebrow">Saved</p>
      <h1 className="mt-3 text-5xl text-foreground md:text-6xl">Your <span className="font-medium">favourites</span></h1>
      {favs.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-3xl text-foreground">No favourites yet.</p>
          <p className="mt-2 text-muted-foreground">Tap the heart on any piece to save it here.</p>
          <Link to="/shop" className="btn-glow mt-8">Browse the shop</Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 items-start gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
          {favs.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
