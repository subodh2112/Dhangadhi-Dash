import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Loader2, SlidersHorizontal, Package, Grid3x3, List } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

const categoryConfig = [
  { key: "all", label: "All", icon: "🛍️" },
  { key: "food", label: "Food", icon: "🍽️" },
  { key: "grocery", label: "Groceries", icon: "🛒" },
  { key: "pharmacy", label: "Pharmacy", icon: "💊" },
  { key: "restaurant", label: "Restaurants", icon: "🍴" },
  { key: "bakery", label: "Bakery", icon: "🍰" },
  { key: "fashion", label: "Fashion", icon: "👕" },
  { key: "electronics", label: "Electronics", icon: "💻" },
  { key: "beauty", label: "Beauty", icon: "💄" },
];

const sortOptions = [
  { key: "popular", label: "Most Popular" },
  { key: "price_low", label: "Price: Low to High" },
  { key: "price_high", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
  { key: "newest", label: "Newest" },
];

export default function StoreCatalog() {
  const { categoryMap } = useCategories();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list("-is_popular", 500).catch(() => []),
      base44.entities.Store.list("-rating", 200).catch(() => []),
    ]).then(([p, s]) => {
      setProducts(p);
      setStores(s);
      setLoading(false);
    });
  }, []);

  const storeMap = useMemo(() => {
    const map = {};
    stores.forEach((s) => { map[s.id] = s; map[s.name] = s; });
    return map;
  }, [stores]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (category !== "all") {
      result = result.filter((p) => {
        const pCat = (p.category || "").toLowerCase();
        const parentSlug = p.parent_category_id ? (categoryMap[p.parent_category_id]?.slug || "") : "";
        const storeCat = storeMap[p.store_id]?.category || storeMap[p.store_name]?.category || "";
        return pCat === category || parentSlug === category || storeCat === category;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.store_name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (onlyAvailable) result = result.filter((p) => p.is_available !== false && p.stock !== 0);
    if (onlyDiscounted) result = result.filter((p) => p.discount_percent > 0);

    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_high":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
        break;
      default:
        result.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0));
    }

    return result;
  }, [products, category, search, sortBy, onlyAvailable, onlyDiscounted, storeMap]);

  const categoryCounts = useMemo(() => {
    const counts = { all: products.length };
    categoryConfig.slice(1).forEach((c) => {
      counts[c.key] = products.filter((p) => {
        const pCat = (p.category || "").toLowerCase();
        const parentSlug = p.parent_category_id ? (categoryMap[p.parent_category_id]?.slug || "") : "";
        const storeCat = storeMap[p.store_id]?.category || storeMap[p.store_name]?.category || "";
        return pCat === c.key || parentSlug === c.key || storeCat === c.key;
      }).length;
    });
    return counts;
  }, [products, storeMap]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-saffron via-saffron/90 to-amber-600 px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-2">Store Catalog</h1>
            <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto">
              Browse products from restaurants, grocery shops, pharmacies, and more across Dhangadhi.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, stores, brands..."
              className="pl-12 h-14 rounded-2xl shadow-lg text-base"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 sticky top-16 z-20 bg-background/90 backdrop-blur-md py-2 -mx-1 px-1 rounded-xl">
            {categoryConfig.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  category === c.key
                    ? "bg-saffron text-white shadow-md"
                    : "bg-card border border-border text-foreground/60 hover:border-saffron/30"
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
                {categoryCounts[c.key] > 0 && (
                  <span className={`ml-1 text-[10px] ${category === c.key ? "text-white/70" : "text-foreground/30"}`}>
                    {categoryCounts[c.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filter & sort bar */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnlyAvailable(!onlyAvailable)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  onlyAvailable ? "bg-terai text-white" : "bg-muted text-foreground/50"
                }`}
              >
                In Stock
              </button>
              <button
                onClick={() => setOnlyDiscounted(!onlyDiscounted)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  onlyDiscounted ? "bg-red-500 text-white" : "bg-muted text-foreground/50"
                }`}
              >
                On Sale
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold text-foreground/60"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {sortOptions.find((s) => s.key === sortBy)?.label}
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[180px]">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                          className={`block w-full text-left px-4 py-2 text-xs hover:bg-muted transition-colors ${
                            sortBy === opt.key ? "text-saffron font-bold" : "text-foreground/60"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-card border border-border rounded-full p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-full ${viewMode === "grid" ? "bg-saffron text-white" : "text-foreground/40"}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-full ${viewMode === "list" ? "bg-saffron text-white" : "text-foreground/40"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-saffron animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-14 h-14 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/40 text-sm">No products found. Try a different search or category.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-foreground/40 mb-4">
                Showing <span className="font-bold text-foreground">{filtered.length}</span> product{filtered.length !== 1 ? "s" : ""}
                {category !== "all" && <> in <span className="font-bold text-saffron capitalize">{categoryConfig.find(c => c.key === category)?.label}</span></>}
              </p>
              <div className={viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                : "flex flex-col gap-3"
              }>
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}