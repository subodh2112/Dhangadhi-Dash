import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ticket, Copy, Check, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";

function CouponCard({ coupon, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const discountLabel =
    coupon.discount_type === "percentage"
      ? `${coupon.discount_value}% OFF`
      : coupon.discount_type === "free_delivery"
      ? "FREE DELIVERY"
      : `Rs ${coupon.discount_value} OFF`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="relative flex items-stretch rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow bg-card"
    >
      <div className="flex-shrink-0 w-24 sm:w-28 bg-carbon text-white flex flex-col items-center justify-center p-3 relative">
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
        <Tag className="w-5 h-5 text-saffron mb-1" />
        <p className="font-display font-extrabold text-base sm:text-lg text-center leading-tight">{discountLabel}</p>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-4 h-4 text-saffron" />
            <p className="font-display font-bold text-sm text-carbon">{coupon.code}</p>
          </div>
          <p className="text-xs text-carbon/50 leading-snug">{coupon.description}</p>
        </div>
        <div className="flex items-center justify-between mt-2">
          {coupon.min_order_amount ? (
            <span className="text-[10px] text-carbon/40">Min order: Rs {coupon.min_order_amount}</span>
          ) : (
            <span className="text-[10px] text-carbon/40">No minimum</span>
          )}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              copied ? "bg-terai text-white" : "bg-saffron/10 text-saffron hover:bg-saffron/20"
            }`}
          >
            {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CouponShowcase() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Coupon.filter({ is_active: true })
      .then(setCoupons)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-b from-saffron/[0.03] to-white">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Save More"
          title="Available Coupons"
          subtitle="Copy a code and apply at checkout for instant savings on your next order."
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-12">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
            ))
          ) : (
            coupons.map((c, i) => <CouponCard key={c.id} coupon={c} index={i} />)
          )}
        </div>
      </div>
    </section>
  );
}