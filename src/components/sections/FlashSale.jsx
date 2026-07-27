import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Star, Clock, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";

function useCountdown(hoursAhead = 8) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date();
    target.setHours(target.getHours() + hoursAhead);
    target.setMinutes(0, 0, 0);
    const timer = setInterval(() => {
      const diff = target - new Date();
      if (diff <= 0) return;
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hoursAhead]);
  return timeLeft;
}

function FlashProduct({ product, index }) {
  const discountedPrice = product.discount_percent
    ? Math.round(product.price * (1 - product.discount_percent / 100))
    : product.price;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="flex-shrink-0 w-40 sm:w-48 bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow group"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 bg-saffron text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Flame className="w-3 h-3" /> {product.discount_percent}% OFF
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-carbon/40 font-medium truncate">{product.store_name}</p>
        <p className="text-sm font-semibold text-carbon line-clamp-1 mb-1">{product.name}</p>
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3 h-3 text-saffron fill-saffron" />
          <span className="text-xs text-carbon/50">{product.rating?.toFixed(1)}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-saffron text-base">Rs {discountedPrice}</span>
          <span className="text-xs text-carbon/30 line-through">Rs {product.price}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function FlashSale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const time = useCountdown(8);

  useEffect(() => {
    base44.entities.Product.filter({ is_flash_sale: true }, "-discount_percent", 12)
      .then((data) => {
        setProducts(data.length > 0 ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 px-4 sm:px-6 bg-carbon relative overflow-hidden">
      <div className="bg-grid-pattern absolute inset-0 opacity-30" />
      <div className="mx-auto max-w-7xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-saffron flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Flash Sale</h2>
              <p className="text-sm text-white/40">Limited-time deals — hurry up!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "HRS", value: time.hours },
              { label: "MIN", value: time.minutes },
              { label: "SEC", value: time.seconds },
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                  <span className="font-display font-extrabold text-xl text-white tabular-nums">
                    {String(unit.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] text-white/40 font-bold mt-1">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 sm:w-48 h-60 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {products.map((p, i) => (
              <FlashProduct key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-center py-8">Flash sale products loading soon!</p>
        )}
      </div>
    </section>
  );
}