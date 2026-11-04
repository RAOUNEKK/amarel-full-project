import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, categoryImages } from "@/data/products";
import { useAppSelector } from "@/store/store";

const blurbs: Record<string, string> = {
  Furniture: "Sofas, lounge chairs and tables shaped for slow evenings.",
  Lighting: "Pendants and lamps that turn a room golden.",
  "Décor": "Vases, mirrors, plants and objects with quiet character.",
};

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — AMARÉL" },
      { name: "description", content: "Explore furniture, lighting and décor at AMARÉL." },
      { property: "og:title", content: "Categories — AMARÉL" },
      { property: "og:description", content: "Explore furniture, lighting and décor at AMARÉL." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const products = useAppSelector((s) => s.catalog.products);
  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-14 md:px-10">
      <p className="eyebrow">Categories</p>
      <h1 className="mt-3 text-5xl text-foreground md:text-6xl">Find your <span className="font-medium">corner</span></h1>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {CATEGORIES.map((c, i) => (
          <Link key={c} to="/shop" search={{ category: c }} className="card-glow group reveal grid overflow-hidden rounded-3xl sm:grid-cols-2" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="aspect-[4/3] overflow-hidden sm:aspect-auto">
              <img src={categoryImages[c]} alt={c} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="flex flex-col justify-center p-8">
              <p className="text-xs tracking-widest text-muted-foreground uppercase">{products.filter((p) => p.category === c).length} pieces</p>
              <h2 className="mt-2 text-4xl text-foreground group-hover:text-primary">{c}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{blurbs[c]}</p>
              <span className="mt-6 flex items-center gap-2 text-sm text-primary">Shop {c} <ArrowRight size={16} /></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
