import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, MapPin, BadgeCheck, Phone, Heart, Share2, ShoppingCart, Plus, Minus, Truck, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileStickyBar from "@/components/MobileStickyBar";
import StoreReviews from "@/components/StoreReviews";
import ProductReviewSection from "@/components/ProductReviewSection";
import FavoriteButton from "@/components/customer/FavoriteButton";
import MobileBackButton from "@/components/MobileBackButton";
import CategoryHierarchy from "@/components/CategoryHierarchy";

const categoryColors = {
  restaurant: "bg-saffron", grocery: "bg-terai", pharmacy: "bg-blue-500",
  bakery: "bg-amber-500", flower_shop: "bg-pink-500", stationery: "bg-purple-500", pet_shop: "bg-teal-500",
};

function ProductCard({ product, onAdd }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const discountedPrice = product.discount_percent
    ? Math.round(product.price * (1 - product.discount_percent / 100))
    : product.price;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_bestseller && <span className="bg-saffron text-white text-[9px] font-bold px-2 py-0.5 rounded-full">BESTSELLER</span>}
          {product.is_new_arrival && <span className="bg-terai text-white text-[9px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
          {product.discount_percent > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{product.discount_percent}% OFF</span>}
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-foreground/40 font-medium truncate">{product.store_name}</p>
        <CategoryHierarchy
          parentCategoryId={product.parent_category_id}
          childCategoryId={product.child_category_id}
          showIcons
          className="mb-0.5"
        />
        <h4 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{product.name}</h4>
        <p className="text-xs text-foreground/50 line-clamp-2 mb-2 leading-snug">{product.description}</p>
        <div className="flex items-center gap-1 mb-2">
          {product.stock > 0 ? (
            <span className="text-[10px] text-terai font-semibold">In Stock ({product.stock})</span>
          ) : (
            <span className="text-[10px] text-red-500 font-semibold">Out of Stock</span>
          )}
          {product.rating && (
            <span className="flex items-center gap-0.5 text-[10px] text-foreground/40 ml-auto">
              <Star className="w-2.5 h-2.5 text-saffron fill-saffron" /> {product.rating?.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-sm text-foreground">Rs {discountedPrice}</span>
            {product.discount_percent > 0 && (
              <span className="text-[10px] text-foreground/30 line-through">{product.price}</span>
            )}
          </div>
          {added ? (
            <span className="text-[10px] font-bold text-terai">✓ Added!</span>
          ) : (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-white rounded">
                  <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
                </button>
                <span className="text-xs font-bold w-4 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-11 h-11 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-white rounded">
                  <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={product.stock === 0}
                className="w-11 h-11 sm:w-7 sm:h-7 rounded-lg bg-saffron text-white flex items-center justify-center hover:bg-saffron/90 disabled:opacity-40"
              >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StoreDetail() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isFavorite] = useState(false);
  const { addToCart, itemCount } = useCart();

  useEffect(() => {
    base44.entities.Store.get(id)
      .then(async (s) => {
        setStore(s);
        const storeProducts = await base44.entities.Product.filter({ store_name: s.name }, "-is_popular", 200).catch(() => []);
        setProducts(storeProducts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-saffron/20 border-t-saffron rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground/50">Store not found.</p>
        <Link to="/" className="text-saffron font-bold">← Back to Home</Link>
      </div>
    );
  }

  const catColor = categoryColors[store.category] || "bg-carbon";
  const categories = ["all", ...new Set((products || []).map((p) => p.category).filter(Boolean))];
  const filteredProducts = activeCategory === "all" ? products : (products || []).filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <div className="lg:hidden absolute top-3 left-3 z-20">
            <MobileBackButton floating />
          </div>
          <img
            src={store.cover_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 via-carbon/20 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 -mt-16 relative z-10">
          <div className="bg-card rounded-3xl shadow-lg shadow-carbon/5 border border-border p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={store.logo_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200"}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">{store.name}</h1>
                      {store.is_verified && <BadgeCheck className="w-6 h-6 text-saffron" />}
                    </div>
                    <span className={`${catColor} text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mt-2 inline-block`}>
                      {store.category?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <FavoriteButton itemType="store" itemId={store.id} itemName={store.name} itemImage={store.image_url || store.logo_url} size="lg" />
                    <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-saffron fill-saffron" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{store.rating?.toFixed(1)}</p>
                      <p className="text-[10px] text-foreground/40">{store.reviews_count || 0} reviews</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-saffron" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{store.delivery_minutes} min</p>
                      <p className="text-[10px] text-foreground/40">delivery time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-saffron" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{store.free_delivery ? "Free" : `Rs ${store.delivery_fee}`}</p>
                      <p className="text-[10px] text-foreground/40">delivery fee</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-saffron" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Rs {store.min_order}</p>
                      <p className="text-[10px] text-foreground/40">min order</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-foreground/40 font-semibold uppercase">Address</p>
                  <p className="text-sm text-foreground">{store.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-foreground/40 font-semibold uppercase">Hours</p>
                  <p className="text-sm text-foreground">{store.opening_hours || "7:00 AM - 11:00 PM"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-foreground/40 font-semibold uppercase">Phone</p>
                  <p className="text-sm text-foreground">{store.phone}</p>
                </div>
              </div>
            </div>

            {store.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] text-foreground/40 font-semibold uppercase mb-1">About</p>
                <p className="text-sm text-foreground/70 leading-relaxed">{store.description}</p>
              </div>
            )}
          </div>

          {store.latitude && store.longitude && (
            <div className="mt-6 bg-card rounded-3xl border border-border p-4 overflow-hidden">
              <p className="text-sm font-bold text-foreground mb-3">Store Location</p>
              <div className="h-48 rounded-2xl bg-muted flex items-center justify-center">
                <a
                  href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-saffron text-sm font-bold flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> View on Google Maps
                </a>
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-extrabold text-xl text-foreground">Menu</h2>
              {itemCount > 0 && (
                <Link to="/cart" className="flex items-center gap-2 bg-saffron text-white text-sm font-bold px-4 py-2 rounded-full">
                  <ShoppingCart className="w-4 h-4" /> {itemCount} items
                </Link>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                    activeCategory === cat ? "bg-saffron text-white" : "bg-muted text-foreground/50 hover:bg-saffron/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
              {(filteredProducts || []).map((p) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>

            {(!filteredProducts || filteredProducts.length === 0) && (
              <div className="text-center py-16">
                <p className="text-foreground/40 text-sm">No products available in this category.</p>
              </div>
            )}
          </div>

          {/* Product Reviews */}
          {products && products.length > 0 && (
            <ProductReviewSection products={products} storeId={store.id} />
          )}

          <StoreReviews storeId={store.id} storeName={store.name} />
        </div>
      </main>
      <Footer />
      <MobileStickyBar />
    </div>
  );
}