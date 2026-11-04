import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact" },
  { to: "/orders", label: "My orders" },
] as const;

export function Footer() {
  return (
    <footer className="mx-auto mt-28 max-w-[1500px] px-5 pb-10 md:px-10">
      <div className="border-t border-border pt-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-9 gap-y-3 text-[0.6875rem] tracking-[0.06em] text-foreground uppercase">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="transition hover:opacity-60">{l.label}</Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 grid gap-6 text-[0.6875rem] leading-relaxed text-muted-foreground md:grid-cols-[1fr_auto_auto] md:items-end md:gap-16">
          <p className="max-w-xs">
            With our team of skilled curators and designers, we bring you furniture, lighting and décor that inspire and uplift. Discover the perfect piece for your space and illuminate your home.
          </p>
          <p>
            Copyright © 2026 AMARÉL.<br />
            Demonstration store. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-foreground">
            <span className="text-muted-foreground">Follow us</span>
            {[Instagram, Facebook, Twitter].map((I, i) => (
              <span key={i} className="dot-btn !h-6 !w-6"><I size={11} /></span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
