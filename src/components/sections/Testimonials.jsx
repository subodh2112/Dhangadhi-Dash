import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, MapPin, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";

function StarRating({ rating, interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hover || rating) ? "text-saffron fill-saffron" : "text-foreground/15"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function TestimonialCard({ t, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative bg-card rounded-3xl p-6 shadow-sm shadow-carbon/5 border border-border flex flex-col"
    >
      <Quote className="w-8 h-8 text-saffron/20 mb-4" />
      <p className="text-sm sm:text-base text-foreground/70 leading-relaxed flex-1 mb-5">
        "{t.message}"
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center font-bold text-saffron text-sm">
            {t.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{t.name}</p>
            <p className="flex items-center gap-1 text-xs text-foreground/40">
              <MapPin className="w-3 h-3" /> {t.location || "Dhangadhi"}
            </p>
          </div>
        </div>
        <StarRating rating={t.rating || 5} />
      </div>
    </motion.div>
  );
}

function TestimonialForm({ onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name, location, rating, message });
      onClose();
    } catch {
      setError("Could not submit your review. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-6 shadow-lg shadow-carbon/5 border border-border">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg text-foreground">Share Your Experience</h3>
          <button type="button" onClick={onClose} className="text-foreground/30 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Your Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Aarav Sharma"
              className="w-full h-11 px-4 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Location in Dhangadhi</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Campus Road"
              className="w-full h-11 px-4 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Your Rating</label>
          <StarRating rating={rating} interactive onChange={setRating} />
        </div>
        <div className="mb-4">
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Your Review *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={3}
            placeholder="Tell us about your experience with Dhangadhi Dash..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron resize-none"
          />
        </div>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit Review"}
        </button>
      </form>
    </motion.div>
  );
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadTestimonials = () => {
    base44.entities.Testimonial.list("-created_date", 20)
      .then(setTestimonials)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTestimonials(); }, []);

  const handleSubmit = async (data) => {
    await base44.entities.Testimonial.create(data);
    loadTestimonials();
  };

  return (
    <section id="testimonials" className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-to-b from-saffron/[0.03] to-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <SectionHeading
            eyebrow="Customer Love"
            title="What Dhangadhi Says"
            subtitle="Real stories from real customers across the city who trust Dhangadhi Dash for their daily deliveries."
            align="left"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 h-12 rounded-2xl bg-carbon text-white font-bold text-sm hover:bg-carbon/90 transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Share Your Experience"}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <div className="mb-10 max-w-2xl">
              <TestimonialForm onSubmit={handleSubmit} onClose={() => setShowForm(false)} />
            </div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-3xl p-6 border border-border">
                <div className="w-8 h-8 bg-muted rounded-lg mb-4 animate-pulse" />
                <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 mb-4 animate-pulse" />
                <div className="h-10 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.id} t={t} index={i} />
            ))}
          </div>
        )}

        {!loading && testimonials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground/40 text-sm">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </section>
  );
}