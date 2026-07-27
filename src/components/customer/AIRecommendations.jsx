import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { getPersonalizedRecommendations } from "@/lib/aiEngine";
import { Link } from "react-router-dom";

export default function AIRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orders, favs, stores, prods] = await Promise.all([
        base44.entities.Order.filter({ status: "delivered" }, "-created_date", 10).catch(() => []),
        base44.entities.Favorite.filter({}, "-created_date", 10).catch(() => []),
        base44.entities.Store.filter({ is_open: true }, "-rating", 20).catch(() => []),
        base44.entities.Product.filter({ is_available: true }, "-created_date", 40).catch(() => []),
      ]);
      setProducts(prods);
      const result = await getPersonalizedRecommendations(user, orders, favs, stores, prods);
      setRecommendations(result?.recommendations || []);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-saffron" /><h2 className="font-display font-bold text-lg text-foreground">Recommended For You</h2></div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex-shrink-0 w-40 h-32 rounded-2xl bg-muted animate-pulse" />)}</div>
    </div>
  );

  if (recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-saffron" /><h2 className="font-display font-bold text-lg text-foreground">Recommended For You</h2></div>
        <button onClick={load} className="p-1.5 rounded-lg bg-muted text-foreground/50 hover:text-saffron"><RefreshCw className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {recommendations.map((rec, i) => {
          const product = products.find(p => p.name?.toLowerCase() === rec.name?.toLowerCase());
          const img = product?.image_url || `https://images.unsplash.com/photo-${rec.type === "store" ? "1517248135467-4c7d9b8e1950" : "1565299624946-b28f40a0ae38"}?w=300&q=80`;
          return (
            <div key={i} className="flex-shrink-0 w-40 rounded-2xl bg-card border border-border overflow-hidden group cursor-pointer">
              <div className="relative h-24 overflow-hidden">
                <img src={img} alt={rec.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute top-1.5 left-1.5 bg-saffron text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" /> AI</div>
              </div>
              <div className="p-2.5">
                <p className="font-bold text-xs text-foreground line-clamp-1">{rec.name}</p>
                <p className="text-[10px] text-foreground/50 line-clamp-2 mt-0.5">{rec.reason}</p>
                {rec.price > 0 && <p className="text-xs font-bold text-saffron mt-1">Rs {rec.price}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}