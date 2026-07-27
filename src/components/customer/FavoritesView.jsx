import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Heart, Store, Package, Trash2, Loader2 } from "lucide-react";

export default function FavoritesView() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState("store");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Favorite.filter({ user_id: user.id }, "-created_date", 100);
        setFavorites(data);
      } catch {}
      setLoading(false);
    };
    if (user?.id) load();
  }, [user?.id]);

  const handleRemove = async (id) => {
    try {
      await base44.entities.Favorite.delete(id);
      setFavorites(favorites.filter((f) => f.id !== id));
    } catch {}
  };

  const filtered = favorites.filter((f) => f.item_type === activeTab);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  return (
    <div>
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
        {[{ key: "store", label: "Stores", icon: Store }, { key: "product", label: "Products", icon: Package }].map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all " + (activeTab === tab.key ? "bg-background text-saffron shadow-sm" : "text-foreground/50")}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8"><Heart className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No favorite {activeTab}s yet.</p><p className="text-xs text-foreground/30 mt-1">Tap the heart icon on any {activeTab} to save it here.</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((fav) => (
            <div key={fav.id} className="bg-card rounded-2xl border border-border overflow-hidden group relative">
              <Link to={fav.item_type === "store" ? "/store/" + fav.item_id : "/store/" + fav.item_id} className="block">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={fav.item_image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300"} alt={fav.item_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-bold text-foreground line-clamp-1">{fav.item_name || "Unnamed"}</p>
                  <p className="text-[10px] text-foreground/40 capitalize">{fav.item_type}</p>
                </div>
              </Link>
              <button onClick={() => handleRemove(fav.id)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}