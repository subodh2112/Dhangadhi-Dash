import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { TrendingUp, Loader2 } from "lucide-react";

const CATEGORY_ICONS = {
  restaurant: "🍽️",
  grocery: "🛒",
  pharmacy: "💊",
  fashion: "👕",
  electronics: "📱",
  beauty: "💄",
  health: "🩺",
  home: "🏠",
  pets: "🐾",
  gifts: "🎁",
  books: "📚",
  auto: "🚗",
  sports: "⚽",
  toys: "🧸",
};

export default function FrequentCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const orders = await base44.entities.Order.filter(
          { customer_name: user?.full_name || "" }, "-created_date", 200
        ).catch(() => []);
        const myOrders = orders.filter((o) => o.created_by_id === user?.id || o.customer_email === user?.email);

        const storeIds = [...new Set(myOrders.map((o) => o.store_id).filter(Boolean))];
        if (storeIds.length === 0) { setLoading(false); return; }

        const categoryCount = {};
        for (const sid of storeIds) {
          try {
            const store = await base44.entities.Store.get(sid);
            if (store) {
              const cat = store.category || "restaurant";
              const orderCount = myOrders.filter((o) => o.store_id === sid).length;
              categoryCount[cat] = (categoryCount[cat] || 0) + orderCount;
            }
          } catch {}
        }

        const sorted = Object.entries(categoryCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([category, count]) => ({ category, count }));

        setCategories(sorted);
      } catch {}
      setLoading(false);
    };
    if (user?.id) load();
    else setLoading(false);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="bg-card rounded-3xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-saffron" />
          <h3 className="font-display font-bold text-lg text-foreground">Your Top Categories</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-foreground/30 animate-spin" />
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="bg-card rounded-3xl border border-border p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-saffron" />
        <h3 className="font-display font-bold text-lg text-foreground">Your Top Categories</h3>
        <span className="text-xs text-foreground/40 ml-auto">Tap to reorder</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories.map(({ category, count }) => (
          <Link
            key={category}
            to={"/category/" + category}
            className="group flex items-center gap-3 p-3 rounded-2xl bg-muted/50 hover:bg-saffron/5 border border-transparent hover:border-saffron/20 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center text-lg flex-shrink-0">
              {CATEGORY_ICONS[category] || "📦"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground capitalize truncate">{category}</p>
              <p className="text-xs text-foreground/40">{count} order{count !== 1 ? "s" : ""}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}