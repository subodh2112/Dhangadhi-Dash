import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";

export default function BestSellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Product.filter({ is_bestseller: true }, "-rating", 10)
      .then((data) => {
        if (data.length === 0) return base44.entities.Product.list("-reviews_count", 10);
        return data;
      })
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Top Selling" title="Best Sellers" subtitle="The most-ordered products across Dhangadhi." />
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <div className="p-3 space-y-2"><div className="h-3 bg-muted rounded w-2/3 animate-pulse" /><div className="h-3 bg-muted rounded w-1/2 animate-pulse" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {products.map((p, i) => {
                const price = p.discount_percent ? Math.round(p.price * (1 - p.discount_percent / 100)) : p.price;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                  >
                    <Link to={p.store_id ? "/store/" + p.store_id : "/"} className="block bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow group h-full">
                      <div className="relative aspect-square overflow-hidden">
                        <img src={p.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300"} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <span className="absolute top-2 left-2 bg-saffron text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5" /> #{i + 1}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-foreground/40 font-medium truncate">{p.store_name}</p>
                        <p className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{p.name}</p>
                        <span className="font-bold text-foreground">Rs {price}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}