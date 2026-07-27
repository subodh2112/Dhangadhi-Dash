import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Star, ThumbsUp } from "lucide-react";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";

export default function StoreReviews({ storeId, storeName }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState({});

  const loadReviews = useCallback(async () => {
    try {
      const r = await base44.entities.Review.filter(
        { target_type: "store", store_id: storeId },
        "-created_date",
        20
      ).catch(() => []);
      setReviews(r);
    } catch {} finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleHelpful = async (reviewId) => {
    if (voted[reviewId]) return;
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;
    setVoted((v) => ({ ...v, [reviewId]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpful_votes: (r.helpful_votes || 0) + 1 } : r))
    );
    try {
      await base44.entities.Review.update(reviewId, {
        helpful_votes: (review.helpful_votes || 0) + 1,
      });
    } catch {}
  };

  if (loading) return null;

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;

  return (
    <div className="mt-8 mb-12">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display font-extrabold text-xl text-foreground">Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avgRating)} readOnly size="sm" />
            <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-foreground/40">({reviews.length})</span>
          </div>
        )}
      </div>

      {user && (
        <div className="mb-5">
          <ReviewForm
            targetType="store"
            targetId={storeId}
            targetName={storeName}
            storeId={storeId}
            onSubmitted={loadReviews}
          />
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-2xl">
          <Star className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-foreground/40">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-saffron/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-saffron">{(review.customer_name || "U")[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{review.customer_name}</p>
                    {review.is_verified_purchase && <span className="text-[10px] text-terai font-semibold">✓ Verified Purchase</span>}
                  </div>
                </div>
                <StarRating value={review.rating || 0} readOnly size="sm" />
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed">{review.message}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                <button
                  onClick={() => handleHelpful(review.id)}
                  disabled={voted[review.id]}
                  className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                    voted[review.id] ? "text-saffron" : "text-foreground/40 hover:text-saffron"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({review.helpful_votes || 0})
                </button>
              </div>
              {review.merchant_reply && (
                <div className="mt-3 p-3 rounded-xl bg-muted/50">
                  <p className="text-[10px] font-bold text-foreground/40 uppercase mb-1">Store Reply</p>
                  <p className="text-xs text-foreground/60">{review.merchant_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}