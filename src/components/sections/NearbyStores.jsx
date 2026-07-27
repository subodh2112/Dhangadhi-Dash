import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, MapPin, Navigation } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";

export default function NearbyStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
    base44.entities.Store.filter({ is_suspended: false }, "-rating", 100)
      .then((data) => { setStores(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const withDistance = stores
    .filter((s) => s.latitude && s.longitude)
    .map((s) => {
      let dist = s.distance_km;
      if (userLoc) {
        const R = 6371;
        const dLat = (s.latitude - userLoc.lat) * Math.PI / 180;
        const dLng = (s.longitude - userLoc.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(s.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      return { ...s, _dist: dist };
    })
    .sort((a, b) => (a._dist || 999) - (b._dist || 999))
    .slice(0, 8);

  if (!loading && withDistance.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Close to You" title="Nearby Stores" subtitle="Stores delivering in your area right now." />
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="h-28 bg-muted animate-pulse" />
                  <div className="p-3 space-y-2"><div className="h-3 bg-muted rounded w-2/3 animate-pulse" /><div className="h-3 bg-muted rounded w-1/2 animate-pulse" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {withDistance.map((store, i) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.4) }}
                >
                  <Link to={"/store/" + store.id} className="group block bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow">
                    <div className="relative h-28 overflow-hidden">
                      <img src={store.cover_url || store.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"} alt={store.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-carbon/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px] font-bold">
                        <Navigation className="w-3 h-3" /> {store._dist ? store._dist.toFixed(1) + " km" : "Nearby"}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-foreground truncate group-hover:text-saffron transition-colors">{store.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-foreground/50 mt-0.5">
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