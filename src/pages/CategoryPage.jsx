import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Store, Package } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import { useCategories } from "@/hooks/useCategories";
import { CATEGORY_HIERARCHY, PARENT_CATEGORIES } from "@/lib/categories";

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { activeParents, childrenByParent, loading: catLoading } = useCategories();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Find the parent category info from DB or static fallback
  const parentInfo = useMemo(() => {
    const dbParent = activeParents.find((p) => p.slug === slug);
    if (dbParent) return dbParent;
    const staticParent = PARENT_CATEGORIES.find((p) => p.slug === slug);
    if (staticParent) return {
      id: staticParent.slug, name: staticParent.name, icon: staticParent.emoji,
      color_gradient: staticParent.color, industry_group: staticParent.group, slug: staticParent.slug,
    };
    return null;
  }, [activeParents, slug]);

  // Get child categories from DB or static fallback
  const children = useMemo(() => {
    if (parentInfo && childrenByParent[parentInfo.id]) return childrenByParent[parentInfo.id];
    const staticParent = CATEGORY_HIERARCHY.find((p) => p.slug === slug);
    if (staticParent) return staticParent.children.map((c) => ({
      id: c.slug, name: c.name, icon: c.emoji, color_gradient: c.color, slug: c.slug,
    }));
    return [];
  }, [parentInfo, childrenByParent, slug]);

  // Auto-select child from URL ?child= param
  useEffect(() => {
    const childId = searchParams.get("child");
    if (childId && children) {
      const found = children.find((c) => c.id === childId);
      if (found) setSelectedChild(found);
    }
  }, [searchParams, children]);

  useEffect(() => {
    setLoading(true);
    setSelectedChild(null);

    const industryGroup = parentInfo?.industry_group || parentInfo?.group || slug;

    Promise.all([
      base44.entities.Product.filter({ category: industryGroup }, "-rating", 200).catch(() => []),
      base44.entities.Product.filter({ parent_category_id: parentInfo?.id || "" }, "-rating", 200).catch(() => []),
      base44.entities.Store.filter({ category: industryGroup }, "-rating", 50).catch(() => []),
    ]).then(([byCat, byParentId, matchedStores]) => {
      const seen = new Set();
      const merged = [...byCat, ...byParentId].filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      setProducts(merged);
      setStores(matchedStores);
      setLoading(false);
    });
  }, [slug, parentInfo]);

  const handleFilterChange = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  const displayProducts = filteredProducts.length > 0 || selectedChild ? filteredProducts : products;

  const childFiltered = useMemo(() => {
    if (!selectedChild) return displayProducts;
    return displayProducts.filter((p) => p.child_category_id === selectedChild.id);
  }, [displayProducts, selectedChild]);

  if (!catLoading && !parentInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-32 text-center">
          <Package className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Category Not Found</h1>
          <p className="text-foreground/50 mb-6">The category you're looking for doesn't exist.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 transition-colors">
            Back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Category hero banner */}
      <section className={"relative pt-24 sm:pt-28 pb-8 px-4 sm:px-6 bg-gradient-to-br " + (parentInfo?.color_gradient || "from-saffron to-orange-500")}>
        <div className="mx-auto max-w-7xl">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-4xl sm:text-5xl">{parentInfo?.icon || parentInfo?.emoji || "📦"}</span>
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">{parentInfo?.name}</h1>
              <p className="text-sm text-white/70 mt-1">{stores.length} stores · {products.length} products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-xs text-foreground/50">
          <Link to="/" className="hover:text-saffron">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-bold text-foreground">{parentInfo?.name}</span>
          {selectedChild && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="font-bold text-saffron">{selectedChild.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Subcategory pills */}
      {children.length > 0 && (
        <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-md border-b border-border py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedChild(null)}
                className={"px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all " + (!selectedChild ? "bg-saffron text-white shadow-md shadow-saffron/25" : "bg-muted text-foreground/60 hover:bg-saffron/10 hover:text-saffron")}
              >
                All
              </button>
              {children.map((child) => (
                <button
                  key={child.id || child.slug}
                  onClick={() => setSelectedChild(child)}
                  className={"flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all " + (selectedChild?.id === child.id ? "bg-saffron text-white shadow-md shadow-saffron/25" : "bg-muted text-foreground/60 hover:bg-saffron/10 hover:text-saffron")}
                >
                  {child.icon ? child.icon + " " : ""}{child.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subcategory visual grid (when no child selected) */}
      {!selectedChild && children.length > 0 && (
        <section className="py-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">Browse Subcategories</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {children.map((child, i) => (
                <motion.button
                  key={child.id || child.slug}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                  onClick={() => setSelectedChild(child)}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className={"w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br " + (child.color_gradient || child.color || "from-slate-400 to-slate-600") + " flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all"}>
                    <span className="text-2xl lg:text-3xl">{child.icon || child.emoji || "📦"}</span>
                  </div>
                  <p className="font-heading font-bold text-[11px] lg:text-xs text-foreground group-hover:text-saffron transition-colors text-center leading-tight">{child.name}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stores in this category */}
      {stores.length > 0 && !selectedChild && (
        <section className="py-8 px-4 sm:px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-saffron" /> Stores in {parentInfo?.name}
            </h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {stores.slice(0, 10).map((store) => (
                <Link key={store.id} to={"/store/" + store.id} className="flex-shrink-0 w-48 group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow">
                  <div className="relative h-24 overflow-hidden">
                    <img src={store.cover_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300"} alt={store.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-foreground truncate group-hover:text-saffron transition-colors">{store.name}</h3>
                    <p className="text-[10px] text-foreground/40">{store.delivery_minutes || 25} min delivery</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products with filters */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">
              {selectedChild ? selectedChild.name : "All Products"}
            </h2>
            <span className="text-sm text-foreground/40">{childFiltered.length} products</span>
          </div>

          <ProductFilters products={products} onFilterChange={handleFilterChange} />

          <div className="mt-6">
            <ProductGrid
              products={childFiltered}
              loading={loading}
              emptyMessage={selectedChild ? "No products in this subcategory yet." : "No products in this category yet."}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}