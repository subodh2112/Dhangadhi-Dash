import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, Clock, Store, MapPin, User, CheckCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/SectionHeading";

const statusConfig = {
  placed: { label: "Order Placed", color: "bg-saffron", step: 1 },
  confirmed: { label: "Confirmed", color: "bg-blue-500", step: 2 },
  preparing: { label: "Preparing", color: "bg-amber-500", step: 3 },
  on_the_way: { label: "On the Way", color: "bg-terai", step: 4 },
  delivered: { label: "Delivered", color: "bg-green-600", step: 5 },
};

const allSteps = ["placed", "confirmed", "preparing", "on_the_way", "delivered"];

export default function OrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const results = await base44.entities.Order.filter({ order_number: orderNumber.trim() });
      setOrder(results.length > 0 ? results[0] : null);
    } catch {
      setOrder(null);
    }
    setLoading(false);
  };

  const status = order ? statusConfig[order.status] : null;

  return (
    <section id="track-order" className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-to-b from-white to-saffron/[0.03]">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Order Tracking"
          title="Track Your Order"
          subtitle="Enter your order number to check the current status and estimated delivery time."
        />

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSearch}
          className="mt-10 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. DD001"
              className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border bg-white text-foreground placeholder:text-foreground/30 font-medium focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !orderNumber.trim()}
            className="h-14 px-8 rounded-2xl bg-saffron text-white font-bold hover:bg-saffron/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Search className="w-5 h-5" /> Track</>
            )}
          </button>
        </motion.form>

        {searched && !loading && !order && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-5"
          >
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900 text-sm">Order not found</p>
              <p className="text-red-600/70 text-sm">Please check your order number and try again. Try DD001, DD002, or DD003 for demo orders.</p>
            </div>
          </motion.div>
        )}

        {order && status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-3xl shadow-lg shadow-carbon/5 border border-border p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-foreground/40 uppercase tracking-wider font-bold mb-1">Order Number</p>
                <p className="font-display font-extrabold text-2xl text-foreground">{order.order_number}</p>
              </div>
              <span className={`${status.color} text-white text-sm font-bold px-4 py-2 rounded-full`}>
                {status.label}
              </span>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between gap-1">
                {allSteps.map((step, i) => {
                  const stepConfig = statusConfig[step];
                  const isActive = i <= status.step;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isActive ? stepConfig.color : "bg-muted"}`}>
                        {isActive && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-semibold text-center ${isActive ? "text-foreground" : "text-foreground/30"}`}>
                        {stepConfig.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(status.step / 4) * 100}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-saffron rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Store, label: "Store", value: order.store_name },
                { icon: Clock, label: "Est. Delivery", value: order.estimated_minutes ? `${order.estimated_minutes} min` : "—" },
                { icon: User, label: "Rider", value: order.rider_name || "Assigning..." },
                { icon: MapPin, label: "Delivery To", value: order.delivery_address || "—" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-saffron" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground/40 font-semibold uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {order.items && (
              <div className="mt-4 p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-foreground/40 font-semibold uppercase tracking-wide mb-1">Items</p>
                <p className="text-sm text-foreground">{order.items}</p>
              </div>
            )}

            {order.status !== "delivered" && order.estimated_minutes && (
              <div className="mt-6 flex items-center gap-3 bg-terai/5 border border-terai/10 rounded-2xl p-4">
                <Clock className="w-5 h-5 text-terai flex-shrink-0" />
                <p className="text-sm text-foreground">
                  Estimated arrival in <span className="font-bold text-terai">{order.estimated_minutes} minutes</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}