import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Star, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";

function ProductCard({ product, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow group"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_bestseller && (
            <span className="bg-saffron text-white text-[9px] font-bold px-2 py-0.5 rounded-full">BESTSELLER</span>
          )}
          {product.is_new_arrival && (
            <span className="bg-terai text-white text-[9px] font-bold px-2 py-0.5 rounded-full">NEW</span>
          )}
        </div>
        <button className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-saffron hover:text-white">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-foreground/40 font-medium truncate">{product.store_name}</p>
        <p className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{product.name}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">Rs {product.price}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-saffron fill-saffron" />
            <span className="text-xs text-foreground/50">{product.rating?.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TrendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Product.filter({ is_popular: true }, "-rating", 12)
      .then((data) => {
        setProducts(data.length > 0 ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 px-4 sm:px-6 bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-saffron/10 text-saffron mb-3">
              <TrendingUp className="w-3.5 h-3.5" /> Hot Right Now
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
              Trending Products
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-2xl animate-pulse">
                <div className="aspect-square bg-muted" />
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
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}