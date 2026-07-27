import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Star, Store, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Personalized recommendations based on:
 * 1. Products the user has ordered before (reorder matches)
 * 2. Products sharing the same parent/child category as past orders
 * 3. Products from stores the user has ordered from (store preferences)
 * Falls back to popular products for new users or insufficient data.
 */
export default function RecommendedForYou() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const load = async () => {
      try {
        const [orders, allProducts] = await Promise.all([
          base44.entities.Order.filter({ created_by_id: user.id }, "-created_date", 50).catch(() => []),
          base44.entities.Product.list("-created_date", 300).catch(() => []),
        ]);

        if (orders.length === 0) { setLoading(false); return; }

        // Extract ordered product names, store IDs, and category IDs
        const orderedNames = new Set();
        const orderedStoreIds = new Set();
        const orderedStoreNames = new Set();
        const orderedParentCats = new Set();
        const orderedChildCats = new Set();

        orders.forEach((order) => {
          if (order.store_id) orderedStoreIds.add(order.store_id);
          if (order.store_name) orderedStoreNames.add(order.store_name.toLowerCase());
          if (order.items) {
            order.items.split(", ").forEach((item) => {
              const match = item.match(/^\d+x\s+(.+)$/);
              const name = match ? match[1].trim() : item.trim();
              if (name) orderedNames.add(name.toLowerCase());
            });
          }
        });

        // Find the actual product records for ordered items to get their categories
        allProducts.forEach((p) => {
          if (orderedNames.has(p.name?.toLowerCase())) {
            if (p.parent_category_id) orderedParentCats.add(p.parent_category_id);
            if (p.child_category_id) orderedChildCats.add(p.child_category_id);
          }
        });

        const seenIds = new Set();
        const reorderMatches = [];
        const storeMatches = [];
        const categoryMatches = [];

        // Priority 1: Products the user has ordered before
        allProducts.forEach((p) => {
          if (seenIds.has(p.id) || p.is_available === false) return;
          if (orderedNames.has(p.name?.toLowerCase())) {
            reorderMatches.push(p);
            seenIds.add(p.id);
          }
        });

        // Priority 2: Products from stores the user has ordered from
        allProducts.forEach((p) => {
          if (seenIds.has(p.id) || p.is_available === false) return;
          if ((p.store_id && orderedStoreIds.has(p.store_id)) ||
              (p.store_name && orderedStoreNames.has(p.store_name.toLowerCase()))) {
            storeMatches.push(p);
            seenIds.add(p.id);
          }
        });

        // Priority 3: Products in the same parent/child category
        allProducts.forEach((p) => {
          if (seenIds.has(p.id) || p.is_available === false) return;
          if ((p.parent_category_id && orderedParentCats.has(p.parent_category_id)) ||
              (p.child_category_id && orderedChildCats.has(p.child_category_id))) {
            categoryMatches.push(p);
            seenIds.add(p.id);
          }
        });

        let combined = [...reorderMatches, ...storeMatches, ...categoryMatches];

        // Fallback: popular products if not enough personalized results
        if (combined.length < 6) {
          const popular = await base44.entities.Product.filter({ is_popular: true }, "-rating", 12).catch(() => []);
          popular.forEach((p) => {
            if (!seenIds.has(p.id) && p.is_available !== false) {
              combined.push(p);
              seenIds.add(p.id);
            }
          });
        }

        combined = combined.slice(0, 12);
        setProducts(combined);

        if (reorderMatches.length > 0) setReason("Based on your reorder history");
        else if (storeMatches.length > 0) setReason("From stores you love");
        else if (categoryMatches.length > 0) setReason("Based on your favorite categories");
        else setReason("Popular picks for you");
      } catch {}
      setLoading(false);
    };
    load();
  }, [user?.id]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 px-4 sm:px-6 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-terai/10 text-terai mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Personalized
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
              Recommended for You
            </h2>
            <p className="text-sm text-foreground/50 mt-2">{reason || "Based on your previous orders"}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl animate-pulse">
                <div className="aspect-square bg-muted rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link to={p.store_id ? `/store/${p.store_id}` : "/"} className="block bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow group">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={p.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300"}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-foreground/40 font-medium truncate flex items-center gap-1">
                      <Store className="w-2.5 h-2.5" /> {p.store_name}
                    </p>
                    <p className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Rs {p.price}</span>
                      {p.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-saffron fill-saffron" />
                          <span className="text-xs text-foreground/50">{p.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}