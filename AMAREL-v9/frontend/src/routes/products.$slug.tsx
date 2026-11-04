import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Heart, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice, imageLibrary } from "@/data/products";
import { addToCart } from "@/store/cartSlice";
import { toggleFavorite } from "@/store/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";

const slugify = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug.replace(/-/g, " ")} — AMARÉL` }, { name: "description", content: "Discover considered furniture, lighting and home décor at AMARÉL." }] }),
  component: ProductDetails,
});

function ProductDetails() {
  const { slug } = Route.useParams();
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.catalog.products);
  const favorites = useAppSelector((s) => s.catalog.favorites);
  const product = products.find((item) => slugify(item.name) === slug);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => { setQuantity(1); setSelectedImage(0); }, [slug]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const categoryImage = product.category === "Furniture" ? imageLibrary.furniture : product.category === "Lighting" ? imageLibrary.lighting : imageLibrary.decor;
    const candidates = [product.image, categoryImage, imageLibrary.room, imageLibrary.corner];
    return candidates.filter((image, index) => candidates.indexOf(image) === index).slice(0, 4);
  }, [product]);

  if (!product) {
    return <div className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-5 text-center"><p className="eyebrow">Piece not found</p><h1 className="mt-4 text-5xl text-foreground">This piece has moved.</h1><p className="mt-4 text-muted-foreground">Explore the collection to find something you love.</p><Link to="/shop" className="btn-glow mt-8">Browse the collection <ArrowRight size={16} /></Link></div>;
  }

  const isFavorite = favorites.includes(product.id);
  const related = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4);
  const soldOut = product.stock <= 0;
  const add = () => {
    if (soldOut) return;
    for (let i = 0; i < quantity; i++) dispatch(addToCart(product));
    toast.success(`${quantity} × ${product.name} added to your bag`);
  };

  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-10 md:px-10">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"><ArrowLeft size={16} /> Back to collection</Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
        <div className="product-gallery-enter">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            <img key={gallery[selectedImage]} src={gallery[selectedImage]} alt={`${product.name} view ${selectedImage + 1}`} className="aspect-[4/5] w-full object-cover transition-opacity duration-500" />
            {product.badge && <span className="eyebrow absolute left-5 top-5 rounded-full glass px-4 py-2 text-[10px]">{product.badge}</span>}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {gallery.map((image, index) => <button key={`${image}-${index}`} onClick={() => setSelectedImage(index)} aria-label={`View product image ${index + 1}`} aria-pressed={selectedImage === index} className={`overflow-hidden rounded-xl border transition ${selectedImage === index ? "border-primary ring-2 ring-primary/20" : "border-border opacity-75 hover:opacity-100"}`}><img src={image} alt="" className="aspect-square w-full object-cover" /></button>)}
          </div>
        </div>

        <div className="product-info-enter lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{product.category}{product.bestseller ? " · Most loved" : ""}</p>
          <h1 className="mt-4 text-4xl leading-tight text-foreground md:text-5xl">{product.name}</h1>
          <p className="mt-5 text-2xl text-primary">{formatPrice(product.price)}</p>
          <p className="mt-6 max-w-xl leading-7 text-muted-foreground">{product.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className={`inline-block h-2.5 w-2.5 rounded-full ${soldOut ? "bg-destructive" : "bg-olive"}`} />{soldOut ? "Currently unavailable" : `${product.stock} available`}</div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-border bg-card p-1.5" aria-label="Quantity selector">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-muted"><Minus size={16} /></button>
              <span className="min-w-10 text-center font-semibold" aria-live="polite">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(Math.max(product.stock, 1), q + 1))} disabled={soldOut || quantity >= product.stock} aria-label="Increase quantity" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-muted disabled:opacity-40"><Plus size={16} /></button>
            </div>
            <button onClick={add} disabled={soldOut} className="btn-glow min-h-12 flex-1 justify-center disabled:cursor-not-allowed"><ShoppingBag size={17} /> {soldOut ? "Sold out" : "Add to bag"}</button>
            <button onClick={() => dispatch(toggleFavorite(product.id))} aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"} aria-pressed={isFavorite} className={`grid h-12 w-12 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary ${isFavorite ? "text-primary" : "text-foreground"}`}><Heart size={19} fill={isFavorite ? "currentColor" : "none"} /></button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Payment is in cash on delivery.</p>
          <div className="mt-8 rounded-2xl border border-border bg-card/70 p-5"><div className="flex items-start gap-3"><Truck size={19} className="mt-0.5 text-primary" /><div><p className="font-semibold text-foreground">Delivery, with care</p><p className="mt-1 text-sm leading-6 text-muted-foreground">You give your delivery address at checkout and pay in cash when your order arrives.</p></div></div></div>
          <div className="mt-8 divide-y divide-border border-y border-border">
            <details className="group py-5"><summary className="cursor-pointer list-none font-display text-xl text-foreground">Description <span className="float-right text-primary">+</span></summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{product.description} Designed to sit comfortably within a considered, lived-in space.</p></details>
            <details className="group py-5"><summary className="cursor-pointer list-none font-display text-xl text-foreground">Materials & dimensions <span className="float-right text-primary">+</span></summary><p className="mt-3 text-sm leading-6 text-muted-foreground"></p></details>
            <details className="group py-5"><summary className="cursor-pointer list-none font-display text-xl text-foreground">Care & returns <span className="float-right text-primary">+</span></summary><p className="mt-3 text-sm leading-6 text-muted-foreground"></p></details>
          </div>
        </div>
      </div>

      {related.length > 0 && <section className="mt-24"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="eyebrow">Complete the room</p><h2 className="mt-3 text-4xl text-foreground md:text-5xl">You may also love</h2></div><Link to="/shop" search={{ category: product.category }} className="inline-flex items-center gap-2 text-sm text-foreground transition hover:text-primary">Explore more <ArrowRight size={16} /></Link></div><div className="grid grid-cols-2 items-start gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}</div></section>}
    </div>
  );
}
