import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Star, Eye, EyeOff, Trash2, Flag, MessageSquare } from "lucide-react";
import { logAdminAction } from "@/lib/adminLog";

export default function ReviewModeration() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.Review.list("-created_date", 200);
      setReviews(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleHide = async (id) => {
    await base44.entities.Review.update(id, { is_verified_purchase: false });
    await logAdminAction("Hid review", "Review", id, "Review hidden by admin");
    toast({ title: "Review hidden" });
    load();
  };

  const handleShow = async (id) => {
    await base44.entities.Review.update(id, { is_verified_purchase: true });
    toast({ title: "Review restored" });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Review.delete(id);
    await logAdminAction("Deleted review", "Review", id, "Fake/spam review removed");
    toast({ title: "Review deleted" });
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const flagged = reviews.filter(r => r.message && (r.message.length > 500 || (r.helpful_votes || 0) < -2));
  const stats = [
    { label: "Total Reviews", value: reviews.length, color: "bg-saffron/10 text-saffron" },
    { label: "Verified", value: reviews.filter(r => r.is_verified_purchase).length, color: "bg-terai/10 text-terai" },
    { label: "Unverified", value: reviews.filter(r => !r.is_verified_purchase).length, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Potentially Spam", value: flagged.length, color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  ];

  let filtered = reviews;
  if (filter === "unverified") filtered = reviews.filter(r => !r.is_verified_purchase);
  else if (filter === "flagged") filtered = flagged;
  if (search) filtered = filtered.filter(r => r.customer_name?.toLowerCase().includes(search.toLowerCase()) || r.message?.toLowerCase().includes(search.toLowerCase()) || r.target_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><Star className="w-4 h-4" /></div>
            <p className="text-lg font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..." className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
        <div className="flex gap-2">
          {["", "unverified", "flagged"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={"px-3 py-1.5 rounded-lg text-xs font-bold capitalize " + (filter === f ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>{f || "All"}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><MessageSquare className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No reviews found.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map(r => (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={"w-3 h-3 " + (i <= (r.rating || 0) ? "text-saffron fill-saffron" : "text-muted")} />)}</div>
                  <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 " + (r.is_verified_purchase ? "bg-terai/10 text-terai" : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400")}>{r.is_verified_purchase ? "Verified" : "Hidden"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm text-foreground">{r.customer_name || "Anonymous"}</p>
                    <span className="text-xs text-foreground/40">→ {r.target_name || "Unknown"}</span>
                    {flagged.includes(r) && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 flex items-center gap-0.5"><Flag className="w-2 h-2" /> SPAM?</span>}
                  </div>
                  <p className="text-sm text-foreground/60 line-clamp-2">{r.message}</p>
                  <p className="text-[10px] text-foreground/30 mt-1">{new Date(r.created_date).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {r.is_verified_purchase ? (
                    <button onClick={() => handleHide(r.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-500/10" title="Hide review"><EyeOff className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={() => handleShow(r.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-terai/10 hover:text-terai" title="Restore review"><Eye className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => handleDelete(r.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" title="Delete review"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {r.merchant_reply && <div className="mt-2 p-2 rounded-lg bg-muted/50 ml-8"><p className="text-xs text-foreground/50"><span className="font-bold">Merchant reply:</span> {r.merchant_reply}</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}