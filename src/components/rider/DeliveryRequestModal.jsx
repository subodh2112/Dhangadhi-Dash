import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, MapPin, Wallet, Check, X, Clock, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeliveryRequestModal({ request, onAccept, onReject }) {
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const expires = new Date(request.expires_at).getTime();
    const remaining = Math.max(0, Math.ceil((expires - Date.now()) / 1000));
    setCountdown(remaining);

    const interval = setInterval(() => {
      const newRemaining = Math.max(0, Math.ceil((expires - Date.now()) / 1000));
      setCountdown(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(interval);
        onReject("expired");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [request.id]);

  const handleAccept = async () => {
    setLoading(true);
    await onAccept();
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject("rejected");
    setLoading(false);
  };

  const progress = (countdown / 60) * 100;
  const isUrgent = countdown <= 10;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-carbon/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-card rounded-t-3xl sm:rounded-3xl border border-border p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center">
              <Bike className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">New Delivery Request</h3>
              <p className="text-xs text-foreground/40">{request.order_number}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${isUrgent ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 animate-pulse" : "bg-saffron/10 text-saffron"}`}>
            <Clock className="w-4 h-4" />
            {countdown}s
          </div>
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? "bg-red-500" : "bg-saffron"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-2.5">
            <Store className="w-4 h-4 text-saffron mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-foreground/40">Pickup</p>
              <p className="text-sm font-semibold text-foreground">{request.store_name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-terai mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-foreground/40">Drop-off</p>
              <p className="text-sm font-semibold text-foreground">{request.customer_location}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-terai" />
              <span className="text-sm font-bold text-terai">Rs {request.delivery_fee}</span>
              <span className="text-xs text-foreground/40">earning</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-foreground/40">Order value</span>
              <p className="text-sm font-bold text-foreground">Rs {request.order_amount}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReject} disabled={loading} className="flex-1 h-12">
            <X className="w-4 h-4" /> Reject
          </Button>
          <Button onClick={handleAccept} disabled={loading} className="flex-1 h-12 bg-terai hover:bg-terai/90">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Accept Delivery
          </Button>
        </div>
      </motion.div>
    </div>
  );
}