import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, Clock, MapPin, BadgeCheck, Flame, Truck, ArrowRight, ShoppingBag, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";
import StoreOpenBadge from "@/components/StoreOpenBadge";
import FavoriteButton from "@/components/customer/FavoriteButton";

const categoryColors = {
  restaurant: "bg-saffron", grocery: "bg-terai", bakery: "bg-amber-500",
  cakes: "bg-pink-500", fast_food: "bg-orange-500", flower_shop: "bg-pink-500",
  stationery: "bg-purple-500", pet_shop: "bg-teal-500", local_shop: "bg-carbon", household: "bg-slate-600",
};

function StoreCard({ store, index }) {
  const catColor = categoryColors[store.category] || "bg-carbon";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="group bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:shadow-carbon/10 hover:-translate-y-1 transition-all"
    >
      <Link to={`/store/${store.id}`} className="block">
        <div className="relative h-36 overflow-hidden">
          <img
            src={store.cover_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"}
            alt={store.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon/70 via-carbon/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className={`${catColor} text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full`}>
              {store.category?.replace("_", " ")}
            </span>
            {store.is_featured && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5" /> Sponsored
              </span>
            )}
            {store.free_delivery && (
              <span className="bg-terai text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                <Truck className="w-2.5 h-2.5" /> Free
              </span>
            )}
          </div>

          {/* Favorite button */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <FavoriteButton itemType="store" itemId={store.id} itemName={store.name} itemImage={store.logo_url || store.image_url} />
          </div>

          {/* Open/Closed overlay */}
          <div className="absolute bottom-3 left-3">
            <StoreOpenBadge store={store} />
          </div>
          {!store.is_open && (
            <div className="absolute inset-0 bg-carbon/40 pointer-events-none" />
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Link to={`/store/${store.id}`} className="flex-shrink-0 w-12 h-12 rounded-2xl overflow-hidden border-2 border-card shadow-md -mt-8 relative z-10 block">
            <img
              src={store.logo_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100"}
              alt={store.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </Link>
          <div className="flex-1 min-w-0 pt-1">
            <Link to={`/store/${store.id}`}>
              <div className="flex items-center gap-1">
                <h3 className="font-display font-bold text-sm text-foreground truncate group-hover:text-saffron transition-colors">{store.name}</h3>
                {store.is_verified && <BadgeCheck className="w-4 h-4 text-saffron flex-shrink-0" />}
              </div>
            </Link>
            <div className="flex items-center gap-2 text-xs text-foreground/50 mt-0.5">
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-saffron fill-saffron" /> {store.rating?.toFixed(1) || "New"}
              </span>
              <span>({store.reviews_count || 0})</span>
              {store.distance_km != null && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {store.distance_km}km
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs mb-3 pb-3 border-b border-border">
          <span className="flex items-center gap-1 text-foreground/60">
            <Clock className="w-3.5 h-3.5 text-saffron" /> {store.delivery_minutes || 25} min
          </span>
          <span className="text-foreground/60">
            {store.free_delivery ? <span className="text-terai font-bold">Free Delivery</span> : `Rs ${store.delivery_fee || 40}`}
          </span>
          <span className="text-foreground/60">Min Rs {store.min_order || 0}</span>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/store/${store.id}`}
            className="flex-1 h-9 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-muted transition-colors flex items-center justify-center"
          >
            View Menu
          </Link>
          <Link
            to={`/store/${store.id}`}
            className="flex-1 h-9 rounded-xl bg-saffron text-white text-xs font-bold hover:bg-saffron/90 transition-colors flex items-center justify-center gap-1"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Order
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-3xl overflow-hidden border border-border">
      <div className="h-36 bg-muted animate-pulse" />
      <div className="p-4">
        <div className="flex gap-3 mb-3">
          <div className="w-12 h-12 bg-muted rounded-2xl animate-pulse -mt-8" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
            <div className="h-2 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="h-9 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default function TopLocalPartners() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "restaurant", label: "Restaurants" },
    { id: "grocery", label: "Grocery" },
    { id: "bakery", label: "Bakery" },
    { id: "cakes", label: "Cakes" },
    { id: "fast_food", label: "Fast Food" },
    { id: "flower_shop", label: "Flowers" },
    { id: "household", label: "Household" },
  ];

  useEffect(() => {
    base44.entities.Store.list("-rating", 50)
      .then((data) => {
        setStores(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeFilter === "all" ? stores : stores.filter((s) => s.category === activeFilter);
  const display = filtered.slice(0, 12);

  return (
    <section id="top-partners" className="py-16 lg:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Top Rated"
          title="Featured Stores"
          subtitle="The highest-rated stores and shops in Dhangadhi — verified, trusted, and ready to deliver."
        />

        <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-10">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={"px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all " + (activeFilter === f.id ? "bg-saffron text-white shadow-md shadow-saffron/25" : "bg-muted text-foreground/50 hover:bg-saffron/10 hover:text-saffron")}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : display.map((store, i) => <StoreCard key={store.id} store={store} index={i} />)}
        </div>

        {!loading && stores.length > 12 && (
          <div className="text-center mt-10">
            <Link
              to="/#search"
              className="inline-flex items-center gap-2 text-sm font-bold text-saffron hover:gap-3 transition-all"
            >
              View All Stores <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}