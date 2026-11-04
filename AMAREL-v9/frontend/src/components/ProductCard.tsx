import { Heart, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { formatPrice, type Product } from "@/data/products";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { addToCart } from "@/store/cartSlice";
import { toggleFavorite } from "@/store/catalogSlice";

const productSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Soft staggered image heights, like the reference's masonry-style product row. */
const ASPECTS = ["aspect-[1/1.05]", "aspect-[1/1.2]", "aspect-[1/1.45]", "aspect-[1/1]"];

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const dispatch = useAppDispatch();
  const fav = useAppSelector((s) => s.catalog.favorites.includes(product.id));
  const soldOut = product.stock <= 0;
  const slug = productSlug(product.name);

  // no account needed to shop: the cart and favourites work for every visitor.
  // The only check is that the product comes from the database (real ids), because
  // the order endpoint only accepts those.
  const canUse = () => {
    if (!/^[a-f\d]{24}$/i.test(product.id)) {
      toast.error("The shop is showing demo products because the server is not reachable. Start the backend, then refresh the page.");
      return false;
    }
    return true;
  };

  const add = () => {
    if (!canUse()) return;
    dispatch(addToCart(product));
    toast.success(`${product.name} added to your cart`);
  };

  return (
    <article className="group reveal" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <div className={`img-zoom relative overflow-hidden rounded-3xl bg-[#f1f1ef] ${ASPECTS[index % ASPECTS.length]}`}>
        <Link to="/products/$slug" params={{ slug }} className="block h-full w-full" aria-label={`View ${product.name}`}>
          <img src={product.image} alt={product.name} loading="lazy" width={800} height={1000} className="h-full w-full object-cover mix-blend-multiply" />
        </Link>
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.6rem] tracking-[0.08em] uppercase backdrop-blur">{product.badge}</span>
        )}
        <button
          onClick={() => {
            if (!canUse()) return;
            dispatch(toggleFavorite(product.id));
          }}
          aria-pressed={fav}
          aria-label={fav ? "Remove from favourites" : "Add to favourites"}
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur transition hover:scale-105"
        >
          <Heart size={14} fill={fav ? "currentColor" : "none"} />
        </button>
        <button
          onClick={add}
          disabled={soldOut}
          aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
          className={`absolute right-3 bottom-3 inline-flex h-9 items-center justify-center gap-1 rounded-full bg-foreground text-background transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-background/90 disabled:text-foreground ${soldOut ? "px-3 text-[0.65rem]" : "w-9"}`}
        >
          {soldOut ? "Sold out" : <Plus size={16} />}
        </button>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3 px-1">
        <h3 className="min-w-0 truncate font-sans text-[0.8125rem] font-semibold tracking-normal" title={product.name}>
          <Link to="/products/$slug" params={{ slug }} className="transition-opacity hover:opacity-60">{product.name}</Link>
        </h3>
        <span className="shrink-0 text-[0.8125rem]">{formatPrice(product.price)}</span>
      </div>
      <p className="mt-1 line-clamp-2 px-1 text-[0.6875rem] leading-snug text-muted-foreground">{product.description}</p>
    </article>
  );
}
