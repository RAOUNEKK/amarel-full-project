import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Play, Heart, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, type Category } from "@/data/products";
import { useAppSelector } from "@/store/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AMARÉL — Design a home that feels like you" },
      { name: "description", content: "Curated furniture, lighting and décor pieces for a more beautiful everyday." },
      { property: "og:title", content: "AMARÉL — Design a home that feels like you" },
      { property: "og:description", content: "Curated furniture, lighting and décor pieces for a more beautiful everyday." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

export function SectionHead({ eyebrow, title, link }: { eyebrow: string; title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-3xl md:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link to={link.to} className="flex items-center gap-2 text-sm text-foreground/80 transition hover:text-foreground">
          {link.label} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

const CHIPS: { label: string; to: "/shop" | "/about"; search?: Record<string, string> }[] = [
  { label: "Furniture", to: "/shop", search: { category: "Furniture" } },
  { label: "Lighting", to: "/shop", search: { category: "Lighting" } },
  { label: "Décor", to: "/shop", search: { category: "Décor" } },
  { label: "Best-loved", to: "/shop" },
  { label: "New arrivals", to: "/shop", search: { sort: "newest" } },
  { label: "Mood lighting", to: "/shop", search: { category: "Lighting" } },
  { label: "Home décor", to: "/shop", search: { category: "Décor" } },
  { label: "Interior design", to: "/about" },
  { label: "Artisan", to: "/about" },
];

const TABS: ("All" | Category)[] = ["All", ...CATEGORIES];

const FAQ = [
  { q: "How are your pieces made?", a: "Every piece is chosen by our studio for its materials and craft — natural woods, wool, linen, glass and stoneware — and for how it feels when the lamps come on." },
  { q: "Can I customize the design?", a: "Tell us about your room and your idea through the contact page and our studio will reply within a day. This is a demonstration store, so no custom orders are processed." },
  { q: "What is your return policy?", a: "AMARÉL is a demonstration store: return conditions will be confirmed by the store owner before the shop is used commercially." },
];

function Home() {
  const products = useAppSelector((s) => s.catalog.products);
  const [tab, setTab] = useState<"All" | Category>("All");

  const pool = tab === "All" ? products : products.filter((p) => p.category === tab);
  const shown = [...pool]
    .sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller) || b.createdAt - a.createdAt)
    .slice(0, 4);

  return (
    <>
      <Hero />

      {/*  Tag chips  */}
      <section className="mx-auto mt-4 max-w-[1600px] px-2 md:px-3" aria-label="Browse by tag">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:justify-between">
          {CHIPS.map((c) => (
            <Link key={c.label} to={c.to} search={c.search as never} className="chip flex-1 lg:min-w-0">{c.label}</Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        {/*  Catalog  */}
        <section className="mt-28" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="text-center text-[clamp(1.75rem,3vw,2.5rem)] leading-tight">Illuminate Your Space with Captivating Designs</h2>
          <p className="mt-7 max-w-[56rem] pl-0 text-[0.8125rem] leading-relaxed font-light text-muted-foreground md:mx-auto md:pl-[16rem]">
            Our extensive catalogue features a diverse range of furniture, lighting and décor that effortlessly blend aesthetics with functionality. Each piece is a testament to the skill and creativity of the makers we collaborate with, who meticulously select every detail to transform your spaces into captivating realms of light and comfort.
          </p>

          <div role="tablist" aria-label="Filter pieces" className="no-scrollbar mx-auto mt-14 flex max-w-[56rem] gap-8 overflow-x-auto text-[0.8125rem] md:grid md:grid-cols-5 md:gap-0">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`shrink-0 text-left transition-colors ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div key={tab} className="mt-10 grid grid-cols-2 items-start gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {shown.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
          <div className="mt-12 flex justify-center">
            <Link to="/shop" search={tab === "All" ? {} : { category: tab }} className="btn-ghost-glow">View all pieces <ArrowRight size={14} /></Link>
          </div>
        </section>

        {/*  Mission + FAQ  */}
        <section className="mt-32 grid gap-14 lg:grid-cols-2 lg:gap-24" aria-labelledby="mission-title">
          <div className="flex flex-col">
            <p className="flex items-center gap-3 text-[0.6875rem] tracking-[0.04em] uppercase">
              <span className="inline-block h-4 w-12 rounded-full border border-input" aria-hidden />
              At AMARÉL
            </p>
            <h2 id="mission-title" className="mt-5 text-[clamp(1.6rem,2.6vw,2.15rem)] leading-[1.25] font-light">
              Our mission is to bring exquisite and unique <strong className="font-semibold">curated furniture &amp; lamps</strong> to homes around the world
            </h2>

            <figure className="mt-16 max-w-[20rem] lg:mt-24">
              <Link to="/about" aria-label="Watch our story" className="img-zoom relative block overflow-hidden rounded-3xl">
                <img src="/products/product-20.jpg" alt="Table lamp with a glowing fabric shade" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-black px-3 py-2 text-white"><RotateCcw size={11} /><Heart size={11} fill="currentColor" /></span>
                <span className="absolute right-3 bottom-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground backdrop-blur"><Play size={12} fill="currentColor" /></span>
              </Link>
              <figcaption className="mt-3 text-[0.6875rem] leading-snug font-medium">Watch our video and learn<br />more about our services</figcaption>
            </figure>
          </div>

          <div className="flex flex-col">
            <div className="grid grid-cols-[1fr_auto] items-start gap-6 border-b border-border pb-8">
              <div>
                <p className="text-[0.6875rem] text-muted-foreground"><span className="mr-2 text-[0.5625rem]">01</span></p>
                <p className="-mt-0.5 text-[0.8125rem] leading-snug font-medium">Personal<br />design for you</p>
                <Link to="/shop" className="mt-4 inline-flex items-center gap-4 rounded-full border border-input py-1 pr-1 pl-4 text-[0.6875rem]">
                  Order <span className="grid h-5 w-9 place-items-center rounded-full bg-foreground text-background"><ArrowRight size={10} /></span>
                </Link>
              </div>
              <Link to="/shop" search={{ category: "Lighting" }} aria-label="Shop lighting" className="img-zoom block w-40 overflow-hidden rounded-2xl sm:w-52">
                <img src="/products/product-03.jpg" alt="Petal pendant lamp" loading="lazy" className="aspect-[4/2.6] w-full object-cover" />
              </Link>
            </div>

            <div className="mt-0">
              {FAQ.map((f, i) => (
                <details key={f.q} className="group border-b border-border">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-[0.8125rem] marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="flex items-baseline gap-2"><span className="w-5 text-[0.5625rem] text-muted-foreground">0{i + 2}</span>{f.q}</span>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary transition-transform duration-300 group-open:rotate-90"><ArrowRight size={10} /></span>
                  </summary>
                  <p className="pb-6 pl-7 text-[0.75rem] leading-relaxed font-light text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <Link to="/about" className="inline-flex items-center gap-4 rounded-full bg-foreground py-1 pr-1 pl-4 text-[0.625rem] text-background transition hover:opacity-85">
                Learn more <span className="grid h-5 w-5 place-items-center rounded-full bg-background text-foreground"><ArrowUpRight size={10} /></span>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- About us ---------- */}
        <section className="mt-32 grid gap-14 lg:grid-cols-2 lg:gap-24" aria-labelledby="about-title">
          <div className="flex flex-col">
            <h2 id="about-title" className="flex items-center gap-4 text-[clamp(1.8rem,3vw,2.4rem)]">
              About Us <span className="inline-flex h-4 w-12 items-center justify-end rounded-full border border-input pr-1" aria-hidden><span className="h-px w-5 bg-input" /></span>
            </h2>
            <p className="mt-10 max-w-sm text-[0.75rem] leading-relaxed font-light">
              At AMARÉL, we believe that lighting is an art form. Our mission is to bring exquisite and unique pieces to homes around the world, illuminating spaces with creativity and beauty.
            </p>
            <div className="mt-24 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-border" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2.5c3.4 0 6 2.4 6 5.6 0 2-1 3.4-2.2 4.6-.7.7-1.1 1.5-1.1 2.3H9.3c0-.8-.4-1.6-1.1-2.3C7 11.5 6 10.1 6 8.1c0-3.2 2.6-5.6 6-5.6Z" stroke="currentColor" strokeWidth="1.3" /><path d="M9.6 18.2h4.8M10.4 21h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </span>
              <div>
                <p className="text-[0.75rem] font-medium">AMARÉL Studio</p>
                <p className="flex items-center gap-2 text-[0.5625rem] text-muted-foreground">the creators of the store <span className="h-px w-8 bg-input" /></p>
              </div>
            </div>
            <div className="mt-14 flex gap-2.5">
              {["/products/product-20.jpg", "/products/product-03.jpg", "/products/product-02.jpg"].map((src) => (
                <img key={src} src={src} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <FeatureCard to="/shop" title="Curated furniture & lighting" sub="every piece has its own character" />
            <FeatureCard to="/contact" dark title="Trade partnerships" sub="personalized lighting consultations" img="/products/product-20.jpg" />
            <FeatureCard to="/contact" title="Interior design collaborations" sub="working with designers and studios" />
          </div>
        </section>

      </div>
    </>
  );
}

function FeatureCard({ to, title, sub, dark = false, img }: { to: "/shop" | "/contact"; title: string; sub: string; dark?: boolean; img?: string }) {
  return (
    <Link
      to={to}
      className={`group relative flex min-h-[8.75rem] items-stretch justify-between overflow-hidden rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-0.5 ${dark ? "bg-olive text-white" : "bg-card text-foreground"}`}
    >
      <div className="flex flex-col justify-between">
        <div>
          <p className="text-[0.8125rem] font-medium">{title}</p>
          <p className={`mt-1 text-[0.5625rem] ${dark ? "text-white/55" : "text-muted-foreground"}`}>{sub}</p>
        </div>
        <span className={`mt-6 grid h-6 w-6 place-items-center rounded-full ${dark ? "bg-white text-black" : "border border-input bg-background"}`}><ArrowRight size={11} /></span>
      </div>
      {img && <img src={img} alt="" loading="lazy" className="absolute top-3 right-3 bottom-3 w-[42%] rounded-2xl object-cover" />}
    </Link>
  );
}
