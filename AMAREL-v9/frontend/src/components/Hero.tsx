import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Facebook, Instagram, Bell, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import room from "@/assets/room-salon.jpg";
import { CATEGORIES, formatPrice } from "@/data/products";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { addToCart } from "@/store/cartSlice";

const productSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Home hero: one large rounded scene (room → lamp that descends → warm light → copy)
 * flanked by two tall rounded panels, exactly like the reference layout.
 */
export function Hero() {
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.catalog.products);
  const featured = [
    ...products.filter((p) => p.category === "Lighting"),
    ...products.filter((p) => p.category !== "Lighting" && p.bestseller),
  ].slice(0, 5);
  const [i, setI] = useState(0);
  // the lamp starts off, then switches on a moment after the page loads
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setLit(true), reduce ? 0 : 700);
    return () => window.clearTimeout(t);
  }, []);
  const pick = featured.length ? featured[i % featured.length] : undefined;
  const thumbs = products.slice(0, 3);

  return (
    <section className="hero-scene mx-auto grid max-w-[1600px] gap-2 px-2 pt-2 md:px-3 lg:grid-cols-[1fr_190px_190px] xl:grid-cols-[1fr_210px_210px]" aria-label="Featured collection">
      {/* ---------- Main scene ---------- */}
      <div className="relative min-h-[640px] overflow-hidden rounded-[1.75rem] bg-olive text-white lg:min-h-[660px]">
        {/* photo + lamp light share one cover-fitted stage so the glow stays locked on the lamp shade */}
        <div className={`hero-stage ${lit ? "is-on" : ""}`}>
          <div className="hero-stage-inner">
            <img src={room} alt="Olive velvet sofa under an arched floor lamp in a warm salon with burgundy panelling" className="absolute inset-0 h-full w-full object-cover" width={736} height={919} fetchPriority="high" />
            {/* the room goes dark when the lamp is off */}
            <div className="hero-night pointer-events-none absolute inset-0" />
            {/* warm amber light, from the bulb outwards */}
            <div className="lamp-fx lamp-pool pointer-events-none" />
            <div className="lamp-fx lamp-cone pointer-events-none" />
            <div className="lamp-fx lamp-halo pointer-events-none" />
            <div className="lamp-fx lamp-core pointer-events-none" />
          </div>
        </div>

        {/* olive-grey tint, like the reference photograph */}
        <div className="pointer-events-none absolute inset-0 bg-[#2e2d21]/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1f1e15]/70 via-[#1f1e15]/15 to-transparent" />

        <div className="relative z-10 flex h-full min-h-[640px] flex-col p-6 md:p-9 lg:min-h-[660px]">
          <h1 className="hero-rise max-w-[41rem] text-[clamp(1.75rem,3.1vw,2.9rem)] leading-[1.12] font-light tracking-[-0.01em] uppercase" style={{ animationDelay: ".5s" }}>
            Disc
            <span className="mx-[0.12em] inline-flex h-[0.62em] w-[1.9em] translate-y-[-0.02em] items-center justify-end rounded-full border border-white/70 p-[0.07em] align-middle" aria-hidden>
              <span className="grid h-full aspect-square place-items-center rounded-full bg-white text-[#2a2b20]"><Bell className="h-[55%] w-[55%]" strokeWidth={1.6} /></span>
            </span>
            ver unique furniture &amp; lamps that illuminate your home
          </h1>
          <p className="hero-rise mt-5 max-w-[22rem] text-[0.6875rem] leading-relaxed text-white/80" style={{ animationDelay: ".7s" }}>
            Welcome to AMARÉL, your one-stop destination for curated furniture, lighting and décor. Elevate your living spaces with warm light, natural materials and quietly timeless design.
          </p>
          <div className="hero-rise mt-5 flex flex-wrap items-center gap-3 text-[0.6875rem]" style={{ animationDelay: ".85s" }}>
            <Link to="/about" className="inline-flex items-center gap-3 rounded-full border border-white/50 py-2 pr-3 pl-5 transition hover:bg-white hover:text-[#2a2b20]">
              About us <ArrowRight size={14} />
            </Link>
            <Link to="/shop" search={{ sort: "newest" }} className="inline-flex items-center gap-1.5 px-2 text-white/85 underline-offset-4 hover:underline">
              View the new collection <ArrowUpRight size={12} />
            </Link>
          </div>

          <span aria-hidden className="hero-rise pointer-events-none absolute top-[36.5%] right-8 hidden text-[clamp(2rem,3.7vw,3.4rem)] leading-none font-extralight tracking-[0.01em] text-white/60 uppercase xl:block" style={{ animationDelay: "1.2s" }}>
            New collection
          </span>

          {/* floating product card */}
          {pick && (
            <div key={pick.id} className="hero-rise mt-8 w-full max-w-[300px] rounded-2xl bg-white p-2.5 text-foreground shadow-[0_24px_50px_-24px_rgb(0_0_0/0.5)] md:absolute md:top-[49%] md:right-6 md:mt-0" style={{ animationDelay: "1.5s" }}>
              <div className="flex gap-3">
                <Link to="/products/$slug" params={{ slug: productSlug(pick.name) }} className="block h-[104px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-secondary" aria-label={`View ${pick.name}`}>
                  <img src={pick.image} alt={pick.name} className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 py-0.5">
                  <p className="line-clamp-2 text-[0.6875rem] leading-snug font-semibold" title={pick.name}>{pick.name}</p>
                  <p className="mt-1 line-clamp-3 text-[0.5625rem] leading-snug text-muted-foreground">{pick.description}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between px-1 pb-0.5">
                <Link to="/products/$slug" params={{ slug: productSlug(pick.name) }} className="text-[0.625rem] text-muted-foreground hover:text-foreground">{formatPrice(pick.price)} · Details</Link>
                <button
                  disabled={pick.stock <= 0}
                  onClick={() => { dispatch(addToCart(pick)); toast.success(`${pick.name} added to cart`); }}
                  className="inline-flex items-center gap-2 rounded-full border border-border py-0.5 pr-0.5 pl-3.5 text-[0.625rem] transition hover:bg-foreground hover:text-background disabled:opacity-40"
                  aria-label={`Buy ${pick.name}`}
                >
                  Buy <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-background"><ArrowUpRight size={10} /></span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-auto pt-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="hero-rise flex items-center gap-3" style={{ animationDelay: "1.6s" }}>
                <div className="flex gap-1.5">
                  {thumbs.map((p) => (
                    <Link key={p.id} to="/products/$slug" params={{ slug: productSlug(p.name) }} aria-label={p.name} className="block h-11 w-11 overflow-hidden rounded-lg border border-white/40">
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    </Link>
                  ))}
                </div>
                <p className="max-w-[170px] rounded-xl bg-white/15 p-2.5 text-[0.5625rem] leading-snug text-white/90 backdrop-blur-md">
                  Join a community of like-minded design lovers who are reshaping the way we live.
                </p>
              </div>
              <div className="hero-rise flex items-center gap-3 md:pr-2" style={{ animationDelay: "1.7s" }}>
                {featured.length > 1 && (
                  <>
                    <button onClick={() => setI((n) => (n - 1 + featured.length) % featured.length)} aria-label="Previous piece" className="grid h-8 w-8 place-items-center rounded-full border border-white/50 transition hover:bg-white hover:text-[#2a2b20]"><ChevronLeft size={14} /></button>
                    <button onClick={() => setI((n) => (n + 1) % featured.length)} aria-label="Next piece" className="grid h-8 w-8 place-items-center rounded-full border border-white/50 transition hover:bg-white hover:text-[#2a2b20]"><ChevronRight size={14} /></button>
                  </>
                )}
                <Link to="/shop" className="inline-flex items-center gap-3 text-[0.625rem] text-white/70 hover:text-white">See all <span className="h-px w-10 bg-white/50" /></Link>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/25 pt-3 text-[0.625rem] text-white/80">
              <a href="tel:+15550102026" className="hover:text-white">+1 (555) 010-2026</a>
              <a href="mailto:hello@amarel.example" className="hover:text-white">hello@amarel.example</a>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Side panel: quick links ---------- */}
      <aside className="relative hidden min-h-[660px] overflow-hidden rounded-[1.75rem] bg-olive text-white lg:block" aria-label="Quick links">
        <img src={room} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-150 object-cover object-[50%_65%] blur-md" />
        <div className="absolute inset-0 bg-[#3a3c2c]/70" />
        <div className="relative flex h-full flex-col p-5">
          <span className="h-3 w-3 rounded-full bg-white" aria-hidden />
          <ul className="mt-6 text-[0.6875rem]">
            {CATEGORIES.map((c) => (
              <li key={c} className="border-b border-white/25">
                <Link to="/shop" search={{ category: c }} className="flex items-center justify-between py-3 transition hover:pl-1">
                  {c} <ArrowUpRight size={12} />
                </Link>
              </li>
            ))}
            <li>
              <Link to="/shop" className="flex items-center justify-between py-3 text-white/45 hover:text-white">See all</Link>
            </li>
          </ul>
          <div className="mt-auto">
            <p className="text-[0.625rem] leading-snug text-white/80">Get a discount for a subscription</p>
            <div className="mt-4 flex gap-2">
              {[Instagram, Facebook, Twitter].map((I, k) => (
                <span key={k} className="dot-btn !h-7 !w-7 !bg-black"><I size={12} /></span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ---------- Side panel: feature + CTA ---------- */}
      <aside className="relative hidden min-h-[660px] overflow-hidden rounded-[1.75rem] bg-olive text-white lg:block" aria-label="Featured lamp">
        <img src={room} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-[2] object-cover object-[60%_30%] blur-xl" />
        <div className="absolute inset-0 bg-[#2e2d21]/80" />
        <div className="relative flex h-full flex-col items-stretch p-5">
          <span className="h-3 w-3 rounded-full bg-white" aria-hidden />
          <h2 className="mt-8 text-[1.55rem] leading-[1.1] font-light tracking-normal uppercase">Big studio lamp</h2>
          <p className="mt-2 max-w-[9.5rem] text-[0.5625rem] leading-snug text-white/70">Choose the piece that suits you and place an order online.</p>
          <Link to="/shop" search={{ category: "Lighting" }} className="group mx-auto mt-12 grid h-[7.25rem] w-[7.25rem] place-items-center rounded-full border border-white/45 text-center text-[0.5625rem] leading-tight transition hover:bg-white hover:text-[#2e2d21]">
            <span className="flex flex-col items-center gap-2">
              <ArrowUpRight size={16} />
              Go to the<br />online store
            </span>
          </Link>
          <div className="mt-auto text-center">
            <p className="text-[0.5625rem] leading-snug text-white/70">Join the letter to get a personal discount</p>
            <a href="/#newsletter" className="mt-3 inline-flex w-full justify-center rounded-full bg-black py-2.5 text-[0.6875rem] text-white transition hover:bg-white hover:text-black">Subscribe</a>
          </div>
        </div>
      </aside>
    </section>
  );
}
