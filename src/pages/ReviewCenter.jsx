import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Star, Loader2, Quote, BadgeCheck, ThumbsUp } from "lucide-react";

export default function ReviewCenter() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const data = await base44.entities.Review.filter({ is_verified_purchase: true }, "-created_date", 50);
      setReviews(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : "—";
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating || 0) === star).length,
  }));
  const maxCount = Math.max(...ratingCounts.map((r) => r.count), 1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Review Center" subtitle="See what customers across Dhangadhi are saying about their delivery experience." icon={Quote} gradient="from-amber-500 to-orange-600" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-5xl font-extrabold text-saffron">{avgRating}</p>
                <div className="flex justify-center gap-0.5 my-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-5 h-5 ${s <= Math.round(parseFloat(avgRating)) ? "text-amber-500 fill-amber-500" : "text-muted"}`} />
                  ))}
                </div>
                <p className="text-xs text-foreground/50">{reviews.length} verified reviews</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                {ratingCounts.map((r) => (
                  <div key={r.star} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-foreground/50 w-6 flex items-center gap-0.5">{r.star}<Star className="w-3 h-3 text-amber-500 fill-amber-500" /></span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: (r.count / maxCount * 100) + "%" }} />
                    </div>
                    <span className="text-xs text-foreground/40 w-6 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Grid */}
            {reviews.length === 0 ? (
              <div className="text-center py-16 text-foreground/40">
                <Quote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-saffron/10 flex items-center justify-center text-xs font-bold text-saffron">
                          {(review.customer_name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground flex items-center gap-1">
                            {review.customer_name || "Anonymous"}
                            {review.is_verified_purchase && <BadgeCheck className="w-3.5 h-3.5 text-terai" />}
                          </p>
                          {review.target_name && <p className="text-xs text-foreground/40">{review.target_name}</p>}
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(review.rating || 0) ? "text-amber-500 fill-amber-500" : "text-muted"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed mb-3">{review.message}</p>
                    <div className="flex items-center justify-between text-xs text-foreground/40">
                      <span>{new Date(review.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      {review.helpful_votes > 0 && (
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {review.helpful_votes} found this helpful</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}