import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";

export default function RecentlyAddedStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Store.filter({ is_suspended: false }, "-created_date", 10)
      .then((data) => { setStores(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && stores.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Just Joined" title="Recently Added Stores" subtitle="Discover the newest shops and restaurants on Dhangadhi Dash." />
        <div className="mt-8">
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 h-44 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {stores.slice(0, 8).map((store, i) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                  className="flex-shrink-0 w-56"
                >
                  <Link to={"/store/" + store.id} className="group block bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow">
                    <div className="relative h-28 overflow-hidden">
                      <img src={store.cover_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"} alt={store.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-carbon/60 to-transparent" />
                      <span className="absolute top-2 left-2 bg-terai text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> NEW STORE
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-foreground truncate group-hover:text-saffron transition-colors">{store.name}</h3>
                      <p className="text-[10px] text-foreground/40 capitalize mb-1">{store.category?.replace("_", " ")}</p>
                      <div className="flex items-center gap-2 text-xs text-foreground/50">
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-saffron fill-saffron" /> {store.rating?.toFixed(1) || "New"}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {store.delivery_minutes || 25}m</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}