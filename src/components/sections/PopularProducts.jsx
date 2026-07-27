import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";

export default function PopularProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Product.filter({ is_popular: true }, "-rating", 10)
      .then((data) => {
        if (data.length === 0) {
          return base44.entities.Product.list("-rating", 10);
        }
        return data;
      })
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Most Loved" title="Popular Products" subtitle="Top picks loved by Dhangadhi customers right now." />
        <div className="mt-8">
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40 sm:w-48 h-56 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {products.map((p, i) => {
                const price = p.discount_percent ? Math.round(p.price * (1 - p.discount_percent / 100)) : p.price;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                    className="flex-shrink-0 w-40 sm:w-48"
                  >
                    <Link to={p.store_id ? "/store/" + p.store_id : "/"} className="block bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow group">
                      <div className="relative aspect-square overflow-hidden">
                        <img src={p.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300"} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        {p.discount_percent > 0 && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{p.discount_percent}% OFF</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-foreground/40 font-medium truncate">{p.store_name}</p>
                        <p className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{p.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">Rs {price}</span>
                          {p.rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-saffron fill-saffron" />
                              <span className="text-[10px] text-foreground/50">{p.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        <div className="text-center mt-6">
          <Link to="/search?filter=popular" className="inline-flex items-center gap-2 text-sm font-bold text-saffron hover:gap-3 transition-all">
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}