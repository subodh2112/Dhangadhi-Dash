import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquarePlus } from "lucide-react";

export default function ReviewForm({ targetType, targetId, targetName, storeId, orderId, onSubmitted }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Please select a star rating", variant: "destructive" });
      return;
    }
    if (!message.trim()) {
      toast({ title: "Please write a comment", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Review.create({
        target_type: targetType,
        target_name: targetName,
        store_id: storeId || undefined,
        target_id: targetId,
        customer_name: user?.full_name || user?.email || "Anonymous",
        user_id: user?.id,
        rating,
        message: message.trim(),
        is_verified_purchase: !!orderId,
        order_id: orderId || undefined,
        helpful_votes: 0,
      });
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setRating(0);
      setMessage("");
      setOpen(false);
      onSubmitted?.();
    } catch (err) {
      toast({ title: "Failed to submit review", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
        <MessageSquarePlus className="w-4 h-4" /> Write a Review
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-foreground">
          Reviewing: <span className="text-saffron">{targetName}</span>
        </h4>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-foreground/40 hover:text-foreground">
          Cancel
        </button>
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground/60 mb-2 block">Your Rating</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground/60 mb-2 block">Your Comment</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your experience with this product or store..."
          rows={3}
          maxLength={500}
          className="resize-none"
        />
        <p className="text-[10px] text-foreground/30 mt-1 text-right">{message.length}/500</p>
      </div>

      <Button type="submit" disabled={submitting} className="w-full gap-2">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}