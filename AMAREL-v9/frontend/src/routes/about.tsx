import { createFileRoute, Link } from "@tanstack/react-router";
import { imageLibrary } from "@/data/products";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AMARÉL" },
      { name: "description", content: "AMARÉL is a studio of warm, considered furniture and lighting." },
      { property: "og:title", content: "About — AMARÉL" },
      { property: "og:description", content: "AMARÉL is a studio of warm, considered furniture and lighting." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-14 md:px-10">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="reveal">
          <p className="eyebrow">Our story</p>
          <h1 className="mt-3 text-5xl leading-tight text-foreground md:text-6xl">Quiet luxury, <br /><span className="font-medium">warm light.</span></h1>
          <p className="mt-6 max-w-lg leading-relaxed text-muted-foreground">
            AMARÉL began with a simple belief: a home should feel like the people in it. We curate furniture, lighting and décor in natural materials — oak, walnut, wool, linen, stoneware — and choose each piece for how it feels at dusk, when the lamps come on.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[["12", "Studio pieces"], ["4", "Categories"], ["100%", "Natural fibres"]].map(([n, l]) => (
              <div key={l}><p className="font-display text-4xl font-light">{n}</p><p className="text-xs text-muted-foreground">{l}</p></div>
            ))}
          </div>
          <Link to="/shop" className="btn-glow mt-10">Explore the collection</Link>
        </div>
        <div className="overflow-hidden rounded-3xl">
        <img src="/products/about-image.jpg" alt="Warm reading corner" className="aspect-[4/5] w-full object-cover" />
        </div>
      </div>
    </div>
  );
}
