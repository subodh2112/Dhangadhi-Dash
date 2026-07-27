import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Heart, Loader2 } from "lucide-react";

export default function FavoriteButton({ itemType, itemId, itemName, itemImage, size }) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.id || !itemId) { setChecking(false); return; }
    const check = async () => {
      try {
        const favs = await base44.entities.Favorite.filter({ user_id: user.id, item_id: itemId });
        setIsFavorite(favs.length > 0);
      } catch {}
      setChecking(false);
    };
    check();
  }, [user?.id, itemId]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id || loading) return;
    setLoading(true);
    if (isFavorite) {
      try {
        const favs = await base44.entities.Favorite.filter({ user_id: user.id, item_id: itemId });
        for (const f of favs) await base44.entities.Favorite.delete(f.id);
        setIsFavorite(false);
      } catch {}
    } else {
      try {
        await base44.entities.Favorite.create({ user_id: user.id, item_type: itemType || "store", item_id: itemId, item_name: itemName || "", item_image_url: itemImage || "" });
        setIsFavorite(true);
      } catch {}
    }
    setLoading(false);
  };

  const btnClass = "flex items-center justify-center transition-colors " + (size === "lg" ? "w-10 h-10 rounded-xl border " : "w-9 h-9 rounded-lg ");
  const activeClass = isFavorite ? "bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/20" : "border-border hover:bg-muted";

  return (
    <button onClick={toggle} disabled={checking || loading} className={btnClass + activeClass} aria-label="Toggle favorite">
      {checking || loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={"w-4 h-4 " + (isFavorite ? "fill-red-500 text-red-500" : "")} />}
    </button>
  );
}