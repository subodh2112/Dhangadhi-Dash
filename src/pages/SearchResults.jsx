import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, X, Store, Package, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import { useCategories } from "@/hooks/useCategories";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCat = searchParams.get("cat") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeSearch, setActiveSearch] = useState(initialQuery);
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [selectedChildCat, setSelectedChildCat] = useState("");
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const debounceRef = useRef(null);
  const { activeParents, childrenByParent, resolvePath } = useCategories();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Product.list("-created_date", 500).catch(() => []),
      base44.entities.Store.list("-rating", 200).catch(() => []),
    ]).then(([prods, strs]) => {
      setProducts(prods);
      setStores(strs);
      setLoading(false);
    });
  }, []);

  // Debounced search update
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActiveSearch(query);
      const params = {};
      if (query) params.q = query;
      if (selectedCat) params.cat = selectedCat;
      setSearchParams(params, { replace: true });
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedCat, setSearchParams]);

  const searchResults = useMemo(() => {
    if (!activeSearch && !selectedCat && !selectedChildCat) return products;
    const q = activeSearch.toLowerCase();
    return products.filter((p) => {
      if (selectedCat) {
        if (p.parent_category_id !== selectedCat) return false;
      }
      if (selectedChildCat) {
        if (p.child_category_id !== selectedChildCat) return false;
      }
      if (!q) return true;
      const { parentName, childName } = resolvePath(p.parent_category_id, p.child_category_id);
      return (
        p.name?.toLowerCase().includes(q) ||
        p.store_name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        parentName?.toLowerCase().includes(q) ||
        childName?.toLowerCase().includes(q)
      );
    });
  }, [products, activeSearch, selectedCat, selectedChildCat, resolvePath]);

  const matchedStores = useMemo(() => {
    if (!activeSearch) return [];
    const q = activeSearch.toLowerCase();
    return stores.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.tags?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [stores, activeSearch]);

  const handleFilterChange = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : searchResults;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Search header */}
      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Search products, stores, brands, categories..."
              className="w-full h-14 pl-12 pr-12 rounded-2xl border border-border bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-saffron/30"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Parent category pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => { setSelectedCat(""); setSelectedChildCat(""); }}
              className={"px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all " + (!selectedCat ? "bg-saffron text-white" : "bg-muted text-foreground/60 hover:bg-saffron/10")}
            >
              All Categories
            </button>
            {activeParents.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCat(selectedCat === cat.id ? "" : cat.id); setSelectedChildCat(""); }}
                className={"px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all " + (selectedCat === cat.id ? "bg-saffron text-white" : "bg-muted text-foreground/60 hover:bg-saffron/10")}
              >
                {cat.icon ? cat.icon + " " : ""}{cat.name}
              </button>
            ))}
          </div>

          {/* Child category sub-pills (shown when a parent is selected) */}
          {selectedCat && childrenByParent[selectedCat] && childrenByParent[selectedCat].length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedChildCat("")}
                className={"px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all " + (!selectedChildCat ? "bg-terai text-white" : "bg-muted/50 text-foreground/50 hover:bg-terai/10")}
              >
                All Subcategories
              </button>
              {childrenByParent[selectedCat].map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildCat(selectedChildCat === child.id ? "" : child.id)}
                  className={"px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all " + (selectedChildCat === child.id ? "bg-terai text-white" : "bg-muted/50 text-foreground/50 hover:bg-terai/10")}
                >
                  {child.icon ? child.icon + " " : ""}{child.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Results summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-foreground/50">
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-saffron" /> Searching...</span>
            ) : (
              <span>{displayProducts.length} products{matchedStores.length > 0 && " · " + matchedStores.length + " stores"}{activeSearch && " for '" + activeSearch + "'"}</span>
            )}
          </p>
        </div>

        {/* Matched stores */}
        {matchedStores.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-saffron" /> Matching Stores
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {matchedStores.map((store) => (
                <Link key={store.id} to={"/store/" + store.id} className="flex-shrink-0 w-44 group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow">
                  <div className="relative h-20 overflow-hidden">
                    <img src={store.cover_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300"} alt={store.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-2">
                    <h3 className="font-bold text-xs text-foreground truncate group-hover:text-saffron transition-colors">{store.name}</h3>
                    <p className="text-[10px] text-foreground/40 capitalize">{store.category?.replace("_", " ")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product results */}
        {!loading && displayProducts.length === 0 && !matchedStores.length ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">No Results Found</h2>
            <p className="text-foreground/50 mb-6">
              {activeSearch ? "We couldn't find anything for '" + activeSearch + "'. Try a different search." : "Start typing to search across all products and stores."}
            </p>
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 transition-colors">
              Browse All Categories
            </Link>
          </div>
        ) : (
          <>
            <ProductFilters products={searchResults} onFilterChange={handleFilterChange} />
            <div className="mt-6">
              <ProductGrid products={displayProducts} loading={loading} />
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}