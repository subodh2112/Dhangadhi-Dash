import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, X, Star, Clock, Truck, BadgeCheck, Flame, Leaf, Zap, Tag, TrendingUp, ShoppingBag, MapPin, SlidersHorizontal, Utensils, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";
import BottomSheetSelect from "@/components/BottomSheetSelect";
import StoreOpenBadge from "@/components/StoreOpenBadge";
import { isStoreOpen } from "@/lib/storeStatus";
import { useCategories } from "@/hooks/useCategories";

const priceRanges = [
  { id: "under100", label: "Under Rs 100", min: 0, max: 100 },
  { id: "100-300", label: "Rs 100–300", min: 100, max: 300 },
  { id: "300-500", label: "Rs 300–500", min: 300, max: 500 },
  { id: "500-1000", label: "Rs 500–1000", min: 500, max: 1000 },
  { id: "above1000", label: "Above Rs 1000", min: 1000, max: Infinity },
];

const additionalFilters = [
  { id: "highest_rated", label: "Highest Rated", icon: Star },
  { id: "best_selling", label: "Best Selling", icon: TrendingUp },
  { id: "fast_delivery", label: "Fast Delivery", icon: Zap },
  { id: "free_delivery", label: "Free Delivery", icon: Truck },
  { id: "open_now", label: "Open Now", icon: Clock },
  { id: "featured", label: "Featured", icon: Flame },
  { id: "verified", label: "Verified", icon: BadgeCheck },
  { id: "discount", label: "Discount", icon: Tag },
  { id: "veg", label: "Veg", icon: Leaf },
  { id: "non_veg", label: "Non-Veg", icon: Utensils },
  { id: "spicy", label: "Spicy", icon: Flame },
  { id: "popular", label: "Popular Today", icon: ShoppingBag },
];

const sortOptions = [
  { id: "relevance", label: "Relevance" },
  { id: "lowest_price", label: "Lowest Price" },
  { id: "highest_price", label: "Highest Price" },
  { id: "highest_rated", label: "Highest Rated" },
  { id: "fastest_delivery", label: "Fastest Delivery" },
];

const catColors = {
  restaurant: "bg-saffron", grocery: "bg-terai", bakery: "bg-amber-500",
  cakes: "bg-pink-500", fast_food: "bg-orange-500", flower_shop: "bg-pink-500",
  stationery: "bg-purple-500", pet_shop: "bg-teal-500", household: "bg-slate-600", local_shop: "bg-carbon",
};

function ResultCard({ store, index }) {
  const catColor = catColors[store.category] || "bg-carbon";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all"
    >
      <div className="relative h-28 overflow-hidden">
        <img src={store.cover_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon/60 to-transparent" />
        <span className={`absolute top-2 left-2 ${catColor} text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full`}>{store.category?.replace("_", " ")}</span>
        <div className="absolute top-2 right-2"><StoreOpenBadge store={store} size="xs" /></div>
        {!isStoreOpen(store) && <div className="absolute inset-0 bg-carbon/50 pointer-events-none" />}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <h3 className="font-bold text-sm text-foreground truncate flex-1">{store.name}</h3>
          {store.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-saffron flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground/50 mb-2">
          <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-saffron fill-saffron" /> {store.rating?.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {store.delivery_minutes}m</span>
          <span>{store.free_delivery ? "Free" : `Rs ${store.delivery_fee || 40}`}</span>
        </div>
        <Link to={`/store/${store.id}`} className="block h-8 rounded-lg bg-saffron text-white text-xs font-bold hover:bg-saffron/90 transition-colors flex items-center justify-center gap-1">
          <ShoppingBag className="w-3 h-3" /> View Store
        </Link>
      </div>
    </motion.div>
  );
}

export default function AdvancedSearch() {
  const { activeParents, childrenByParent, loading: catLoading } = useCategories();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState([]);
  const [activePrice, setActivePrice] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sort, setSort] = useState("relevance");
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [expandedCatParent, setExpandedCatParent] = useState(null);

  useEffect(() => {
    base44.entities.Store.list("-rating", 100)
      .then(setStores)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (id) => setActiveCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  const toggleFilter = (id) => setActiveFilters((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);

  const filtered = useMemo(() => {
    let result = stores.filter((s) => {
      const storeCat = (s.category || "").toLowerCase();
      if (search) {
        const q = search.toLowerCase();
        if (!s.name?.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q) && !storeCat.includes(q)) return false;
      }
      if (activeCategories.length > 0 && !activeCategories.includes(storeCat)) return false;
      if (activePrice) {
        const range = priceRanges.find((p) => p.id === activePrice);
        if (range && (s.min_order || 0) < range.min) return false;
      }
      if (activeFilters.includes("free_delivery") && !s.free_delivery) return false;
      if (activeFilters.includes("open_now") && !isStoreOpen(s)) return false;
      if (activeFilters.includes("featured") && !s.is_featured) return false;
      if (activeFilters.includes("verified") && !s.is_verified) return false;
      if (activeFilters.includes("discount") && !s.has_discount) return false;
      if (activeFilters.includes("fast_delivery") && s.delivery_minutes > 30) return false;
      if (activeFilters.includes("highest_rated") && (s.rating || 0) < 4.5) return false;
      return true;
    });

    if (sort === "highest_rated") result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === "lowest_price") result.sort((a, b) => (a.min_order || 0) - (b.min_order || 0));
    if (sort === "highest_price") result.sort((a, b) => (b.min_order || 0) - (a.min_order || 0));
    if (sort === "fastest_delivery") result.sort((a, b) => (a.delivery_minutes || 0) - (b.delivery_minutes || 0));
    return result;
  }, [stores, search, activeCategories, activePrice, activeFilters, sort]);

  const hasActiveFilters = activeCategories.length > 0 || activePrice || activeFilters.length > 0 || search;

  const clearAll = () => { setSearch(""); setActiveCategories([]); setActivePrice(null); setActiveFilters([]); setSort("relevance"); };

  return (
    <section id="search" className="py-16 lg:py-20 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Search" title="Find What You Need" subtitle="Search and filter across all stores, categories, and price ranges." />

        <div className="mt-10 max-w-3xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores, restaurants, products..."
              className="w-full h-14 pl-12 pr-12 rounded-2xl border border-border bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-saffron/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Hierarchical category filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {catLoading ? (
            <span className="text-xs text-foreground/40">Loading categories...</span>
          ) : activeParents.length === 0 ? (
            <span className="text-xs text-foreground/40">No categories configured</span>
          ) : (
            activeParents.map((parent) => {
              const isExpanded = expandedCatParent === parent.id;
              const children = childrenByParent[parent.id] || [];
              const isActive = activeCategories.includes(parent.slug);
              return (
                <div key={parent.id} className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => {
                      toggleCategory(parent.slug);
                      setExpandedCatParent(isExpanded ? null : parent.id);
                    }}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${isActive ? "bg-saffron text-white shadow-md shadow-saffron/25" : "bg-muted text-foreground/50 hover:bg-saffron/10 hover:text-saffron"}`}
                  >
                    {parent.icon ? parent.icon + " " : ""}{parent.name}
                    {children.length > 0 && <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />}
                  </button>
                  {isExpanded && children.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-1">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => toggleCategory(child.slug)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${activeCategories.includes(child.slug) ? "bg-terai text-white" : "bg-muted/50 text-foreground/50 hover:bg-terai/10 hover:text-terai"}`}
                        >
                          {child.icon ? child.icon + " " : ""}{child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {priceRanges.map((p) => (
            <button key={p.id} onClick={() => setActivePrice(activePrice === p.id ? null : p.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activePrice === p.id ? "bg-terai text-white" : "bg-muted/50 text-foreground/50 hover:bg-terai/10 hover:text-terai"}`}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <button onClick={() => setShowAllFilters(!showAllFilters)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-carbon text-white">
            <SlidersHorizontal className="w-3.5 h-3.5" /> More Filters
          </button>
          <BottomSheetSelect
            value={sort}
            onChange={(val) => setSort(val)}
            options={sortOptions.map((opt) => ({ value: opt.id, label: opt.label }))}
            placeholder="Sort"
            label="Sort By"
          />
          {hasActiveFilters && (
            <button onClick={clearAll} className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-red-500 hover:bg-red-50">
              <X className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {showAllFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center justify-center gap-2 mb-6 overflow-hidden">
            {additionalFilters.map((f) => {
              const Icon = f.icon;
              return (
                <button key={f.id} onClick={() => toggleFilter(f.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilters.includes(f.id) ? "bg-saffron text-white" : "bg-muted/50 text-foreground/50 hover:bg-saffron/10 hover:text-saffron"}`}>
                  <Icon className="w-3 h-3" /> {f.label}
                </button>
              );
            })}
          </motion.div>
        )}

        <div className="text-center text-sm text-foreground/40 mb-4">{loading ? "Loading..." : `${filtered.length} stores found`}</div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden"><div className="h-28 bg-muted animate-pulse" /><div className="p-3 space-y-2"><div className="h-3 bg-muted rounded w-2/3 animate-pulse" /><div className="h-3 bg-muted rounded w-1/2 animate-pulse" /></div></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/40 font-medium">No stores match your filters.</p>
            {hasActiveFilters && <button onClick={clearAll} className="mt-3 text-sm font-bold text-saffron hover:underline">Clear filters</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.slice(0, 16).map((store, i) => <ResultCard key={store.id} store={store} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}