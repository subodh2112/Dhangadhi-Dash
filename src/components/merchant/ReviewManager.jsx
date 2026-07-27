import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Star, MessageSquare, Reply, Flag, Send } from "lucide-react";

export default function ReviewManager({ storeId, storeName }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try {
      const data = await base44.entities.Review.filter({ store_id: storeId }, "-created_date", 100);
      setReviews(data);
    } catch {}
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await base44.entities.Review.update(reviewId, { merchant_reply: replyText.trim() });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, merchant_reply: replyText.trim() } : r));
      setReplying(null);
      setReplyText("");
      toast({ title: "Reply posted!" });
    } catch { toast({ title: "Failed to reply", variant: "destructive" }); }
    setSending(false);
  };

  const handleReport = async (review) => {
    try {
      await base44.entities.Notification.create({
        recipient_type: "admin",
        title: "Fake Review Report",
        message: "Store " + storeName + " reported a review by " + review.customer_name + " (Rating: " + review.rating + ") as potentially fake.",
        type: "general",
      });
      toast({ title: "Review reported to admin" });
    } catch { toast({ title: "Failed to report", variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center"><Star className="w-6 h-6 text-saffron" /></div>
        <div>
          <p className="text-2xl font-display font-extrabold text-foreground">{avgRating}</p>
          <p className="text-xs text-foreground/40">{reviews.length} reviews</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12"><MessageSquare className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No reviews yet.</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-saffron/10 flex items-center justify-center"><span className="text-xs font-bold text-saffron">{(review.customer_name || "U")[0]}</span></div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{review.customer_name || "Anonymous"}</p>
                    <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={"w-3 h-3 " + (s <= (review.rating || 0) ? "text-saffron fill-saffron" : "text-foreground/20")} />)}</div>
                  </div>
                </div>
                {review.is_verified_purchase && <span className="text-[9px] bg-terai/10 text-terai font-bold px-2 py-0.5 rounded-full">Verified</span>}
              </div>
              <p className="text-sm text-foreground/70 mb-2">{review.message}</p>
              {review.image_url && <img src={review.image_url} alt="Review" className="w-20 h-20 rounded-lg object-cover mb-2" />}

              {review.merchant_reply ? (
                <div className="ml-4 p-3 rounded-xl bg-saffron/5 border border-saffron/10">
                  <p className="text-xs font-bold text-saffron mb-1 flex items-center gap-1"><Reply className="w-3 h-3" /> Your Reply</p>
                  <p className="text-sm text-foreground/70">{review.merchant_reply}</p>
                </div>
              ) : replying === review.id ? (
                <div className="mt-2 space-y-2">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} placeholder="Write a reply..." className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => { setReplying(null); setReplyText(""); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-foreground/50 hover:bg-muted">Cancel</button>
                    <button onClick={() => handleReply(review.id)} disabled={sending || !replyText.trim()} className="px-3 py-1.5 rounded-lg bg-saffron text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1"><Send className="w-3 h-3" /> Post Reply</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setReplying(review.id); setReplyText(""); }} className="text-xs font-bold text-saffron flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-saffron/5"><Reply className="w-3 h-3" /> Reply</button>
                  <button onClick={() => handleReport(review)} className="text-xs font-bold text-red-500 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Flag className="w-3 h-3" /> Report</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}