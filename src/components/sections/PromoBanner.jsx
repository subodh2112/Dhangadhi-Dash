import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PromoBanner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    base44.entities.Banner.filter({ is_active: true }, "display_order", 10)
      .then(setBanners)
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0 || dismissed) return null;

  const banner = banners[current];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id || current}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: banner.bg_color || "#FF3D00" }}
        >
          {banner.image_url && (
            <img src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="relative flex items-center justify-between gap-4 px-5 sm:px-8 py-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">{banner.title}</h3>
              {banner.subtitle && <p className="text-xs sm:text-sm text-white/80 truncate">{banner.subtitle}</p>}
            </div>
            {banner.cta_text && (
              <Link to={banner.cta_link || "/"} className="flex-shrink-0 flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                {banner.cta_text} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          {banners.length > 1 && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? "bg-white w-4" : "bg-white/40 w-1.5"}`} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}