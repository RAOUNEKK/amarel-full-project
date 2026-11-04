import { Link } from "@tanstack/react-router";
import { Heart, LogOut, Menu, Package, Search, ShoppingBag, Store, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useUI } from "./AppProviders";
import { useAppSelector } from "@/store/store";
import { selectCartCount } from "@/store/cartSlice";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { setCartOpen, setSearchOpen, user, logout } = useUI();
  const count = useAppSelector(selectCartCount);
  const favs = useAppSelector((s) => s.catalog.favorites.length);
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 md:px-3 md:pt-3">
      <div className="relative">
        <div className="mx-auto flex h-14 items-center justify-between gap-4 rounded-full border border-border bg-background/90 px-4 backdrop-blur-md md:px-6">
          <Logo />
          <nav className="hidden items-center gap-9 text-[0.6875rem] tracking-[0.06em] text-foreground uppercase lg:flex" aria-label="Main">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="nav-link text-foreground/70 hover:text-foreground" activeOptions={{ exact: l.to === "/" }}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 text-foreground">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="hidden h-9 w-56 items-center justify-between rounded-full border border-border bg-card px-4 text-[0.6875rem] text-muted-foreground transition hover:border-foreground/40 md:flex"
            >
              Search in store <Search size={14} className="text-foreground" />
            </button>
            <IconBtn label="Search" onClick={() => setSearchOpen(true)} className="md:hidden"><Search size={18} /></IconBtn>
            <Link to="/favorites" aria-label="Favourites" className="relative rounded-full p-2 transition hover:bg-muted">
              <Heart size={18} strokeWidth={1.5} />
              {favs > 0 && <Badge n={favs} />}
            </Link>
            <Link to="/orders" aria-label="My orders" title="My orders" className="rounded-full p-2 transition hover:bg-muted">
              <Package size={18} strokeWidth={1.5} />
            </Link>
            <IconBtn label={`Cart, ${count} items`} onClick={() => setCartOpen(true)}>
              <ShoppingBag size={18} strokeWidth={1.5} />
              {count > 0 && <Badge n={count} />}
            </IconBtn>
            {/* only the store owner ever logs in, from /admin; customers have no account */}
            {user?.role === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger aria-label="Account" className="ml-1 flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-[0.6875rem] transition hover:border-foreground/40">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-olive text-[0.65rem] font-medium text-white uppercase">{user.name.charAt(0)}</span>
                  <span className="hidden max-w-24 truncate xl:inline">{user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === "admin" && <DropdownMenuItem asChild><Link to="/admin"><Store size={14} /> Owner dashboard</Link></DropdownMenuItem>}
                  <DropdownMenuItem onSelect={logout}><LogOut size={14} /> Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <IconBtn label="Menu" onClick={() => setMenu(!menu)} className="lg:hidden">
              {menu ? <X size={20} /> : <Menu size={20} />}
            </IconBtn>
          </div>
        </div>
        {menu && (
          <nav className="absolute inset-x-0 top-[62px] rounded-3xl border border-border bg-background p-3 shadow-[var(--shadow-soft)] lg:hidden" aria-label="Mobile">
            <div className="flex flex-col text-sm">
              {[...links, { to: "/orders", label: "My orders" } as const, ...(user?.role === "admin" ? [{ to: "/admin", label: "Owner dashboard" } as const] : [])].map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMenu(false)} className="rounded-full px-4 py-3 text-foreground/80 hover:bg-muted" activeProps={{ className: "bg-muted text-foreground" }} activeOptions={{ exact: l.to === "/" }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

function IconBtn({ children, label, onClick, className = "" }: { children: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button aria-label={label} onClick={onClick} className={`relative rounded-full p-2 transition hover:bg-muted ${className}`}>
      {children}
    </button>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span key={n} className="absolute top-0 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[9px] font-medium text-background animate-in zoom-in-50 duration-300">
      {n}
    </span>
  );
}
