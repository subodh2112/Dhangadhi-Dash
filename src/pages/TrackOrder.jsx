import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Clock, Store, MapPin, User, AlertCircle, Navigation } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBackButton from "@/components/MobileBackButton";
import LiveDeliveryMap from "@/components/tracking/LiveDeliveryMap";
import OrderTimeline from "@/components/tracking/OrderTimeline";
import RiderContactBar from "@/components/tracking/RiderContactBar";
import { calculateETA } from "@/lib/riderTracking";

const DEFAULT_CUSTOMER_POS = [28.7080, 80.6180];

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
  const [order, setOrder] = useState(null);
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [eta, setEta] = useState({ distanceKm: 0, etaMinutes: 0 });

  useEffect(() => {
    if (searchParams.get("order")) handleSearch(null, searchParams.get("order"));
  }, []);

  useEffect(() => {
    if (!order?.id || !order.rider_name) return;
    const pollOrder = async () => {
      try {
        const results = await base44.entities.Order.filter({ order_number: order.order_number });
        if (results.length > 0) {
          setOrder(results[0]);
          if (results[0].rider_name && !rider) {
            const riders = await base44.entities.Rider.filter({ name: results[0].rider_name });
            if (riders.length > 0) setRider(riders[0]);
          }
        }
      } catch {}
    };
    const interval = setInterval(pollOrder, 5000);
    return () => clearInterval(interval);
  }, [order?.id, order?.rider_name, rider]);

  useEffect(() => {
    if (!order?.rider_lat || !order?.rider_lng) { setEta({ distanceKm: 0, etaMinutes: 0 }); return; }
    const result = calculateETA(order.rider_lat, order.rider_lng, DEFAULT_CUSTOMER_POS[0], DEFAULT_CUSTOMER_POS[1]);
    setEta(result);
  }, [order?.rider_lat, order?.rider_lng, order?.status]);

  const handleSearch = async (e, orderNum) => {
    if (e) e.preventDefault();
    const num = orderNum || orderNumber;
    if (!num.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const results = await base44.entities.Order.filter({ order_number: num.trim() });
      if (results.length > 0) {
        setOrder(results[0]);
        setRider(null);
        if (results[0].rider_name) {
          const riders = await base44.entities.Rider.filter({ name: results[0].rider_name });
          if (riders.length > 0) setRider(riders[0]);
        }
      } else {
        setOrder(null);
      }
    } catch { setOrder(null); }
    setLoading(false);
  };

  const riderPosition = (order?.rider_lat && order?.rider_lng) ? [order.rider_lat, order.rider_lng] : null;
  const isLiveStatus = ["rider_assigned", "picked_up", "on_the_way"].includes(order?.status);

  const timestamps = {};
  if (order?.created_date) timestamps.pending = new Date(order.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (order?.pickup_time) timestamps.picked_up = new Date(order.pickup_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (order?.delivery_started_time) timestamps.on_the_way = new Date(order.delivery_started_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (order?.delivered_time) timestamps.delivered = new Date(order.delivered_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <MobileBackButton />
          <div className="mb-8">
            <p className="text-xs text-saffron font-bold uppercase tracking-widest mb-2">Live Tracking</p>
            <h1 className="font-display font-extrabold text-3xl text-foreground">Track Your Order</h1>
            <p className="text-foreground/50 text-sm mt-1">Enter your order number to see real-time delivery status and live rider location.</p>
          </div>

          <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
              <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. DD001"
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/30 font-medium focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron" />
            </div>
            <button type="submit" disabled={loading || !orderNumber.trim()} className="h-14 px-8 rounded-2xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search className="w-5 h-5" /> Track</>}
            </button>
          </form>

          {searched && !loading && !order && (
            <div className="mt-6 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-5">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-300 text-sm">Order not found</p>
                <p className="text-red-600/70 dark:text-red-400/70 text-sm">Check your order number and try again.</p>
              </div>
            </div>
          )}

          {order && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
              <div className="bg-card rounded-3xl shadow-lg shadow-carbon/5 border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-foreground/40 uppercase font-bold">Order Number</p>
                    <p className="font-display font-extrabold text-2xl text-foreground">{order.order_number}</p>
                  </div>
                  {isLiveStatus && eta.etaMinutes > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-foreground/40 uppercase font-bold">Arriving in</p>
                      <p className="font-display font-extrabold text-2xl text-saffron">{eta.etaMinutes} min</p>
                      <p className="text-xs text-foreground/40">{eta.distanceKm} km away</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-3xl border border-border p-6">
                <h3 className="font-bold text-sm text-foreground mb-4">Delivery Progress</h3>
                <OrderTimeline status={order.status} timestamps={timestamps} />
              </div>

              {order.status !== "cancelled" && order.status !== "rejected" && (
                <div className="bg-card rounded-3xl shadow-lg shadow-carbon/5 border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-saffron/10 flex items-center justify-center"><Navigation className="w-4 h-4 text-saffron" /></div>
                      <h3 className="font-bold text-sm text-foreground">Live Delivery Map</h3>
                    </div>
                    {isLiveStatus && riderPosition && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-terai">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terai opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-terai"></span>
                        </span>
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-border h-[320px] sm:h-[400px]">
                    <LiveDeliveryMap riderPosition={riderPosition} status={order.status} eta={eta.etaMinutes} distance={eta.distanceKm} />
                  </div>
                  {isLiveStatus && eta.etaMinutes > 0 && (
                    <p className="text-xs text-foreground/50 mt-3 text-center">
                      {order.status === "on_the_way" ? "Rider is heading to your location. Arriving in " + eta.etaMinutes + " minutes." : "Rider is heading to the store for pickup."}
                    </p>
                  )}
                </div>
              )}

              {order.delivery_otp && ["rider_assigned", "picked_up", "on_the_way"].includes(order.status) && (
                <div className="bg-saffron/5 border border-saffron/20 rounded-3xl p-6 text-center">
                  <p className="text-xs text-foreground/40 uppercase font-bold mb-2">Delivery OTP</p>
                  <p className="font-mono font-extrabold text-4xl tracking-[0.3em] text-saffron">{order.delivery_otp}</p>
                  <p className="text-xs text-foreground/50 mt-2">Share this code with your rider when your order arrives</p>
                </div>
              )}

              {isLiveStatus && <RiderContactBar order={order} rider={rider} />}

              <div className="bg-card rounded-3xl border border-border p-6">
                <h3 className="font-bold text-sm text-foreground mb-4">Order Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{ icon: Store, label: "Store", value: order.store_name }, { icon: Clock, label: "Est. Delivery", value: (order.estimated_minutes || "—") + " min" }, { icon: User, label: "Rider", value: order.rider_name || "Assigning..." }, { icon: MapPin, label: "Delivery To", value: order.delivery_address }].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
                        <Icon className="w-4 h-4 text-saffron mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-foreground/40 font-semibold uppercase">{item.label}</p>
                          <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {order.items && (<div className="mt-3 p-3 rounded-xl bg-muted/50"><p className="text-[10px] text-foreground/40 font-semibold uppercase mb-1">Items</p><p className="text-sm text-foreground">{order.items}</p></div>)}
                <div className="mt-3 p-3 rounded-xl bg-saffron/5 border border-saffron/10 flex items-center justify-between">
                  <span className="text-sm text-foreground/60">Total Amount</span>
                  <span className="font-display font-extrabold text-lg text-saffron">Rs {order.total_amount}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}