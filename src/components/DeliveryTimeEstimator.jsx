import React, { useState, useEffect } from "react";
import { Clock, Bike, MapPin, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

/**
 * Delivery time estimator for checkout.
 * Calculates an expected arrival window based on:
 * - Store preparation time (by category)
 * - Distance to customer (from store delivery_radius / distance_km)
 * - Current rider availability
 */
const PREP_TIMES = {
  restaurant: 20, food: 18, grocery: 10, pharmacy: 8, bakery: 15,
  fashion: 5, electronics: 5, beauty: 5, default: 15,
};

function getPrepMinutes(category) {
  if (!category) return PREP_TIMES.default;
  return PREP_TIMES[(category).toLowerCase()] || PREP_TIMES.default;
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function DeliveryTimeEstimator({ storeBreakdowns }) {
  const [availableRiders, setAvailableRiders] = useState(null);
  const [storeDetails, setStoreDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const riders = await base44.entities.Rider.filter({ status: "available", is_suspended: false }, "-rating", 50).catch(() => []);
        setAvailableRiders(riders.length);

        // Fetch store details for each store in the cart
        const storeIds = storeBreakdowns.map((sb) => sb.storeId).filter(Boolean);
        if (storeIds.length > 0) {
          const details = {};
          await Promise.all(storeIds.map(async (id) => {
            try {
              const store = await base44.entities.Store.get(id);
              details[id] = store;
            } catch {}
          }));
          setStoreDetails(details);
        }
      } catch {
        setAvailableRiders(0);
      }
      setLoading(false);
    };
    load();
  }, [storeBreakdowns]);

  if (!storeBreakdowns || storeBreakdowns.length === 0) return null;

  // Calculate per-store estimates
  const storeEstimates = storeBreakdowns.map((sb) => {
    const store = storeDetails[sb.storeId] || {};
    const prep = getPrepMinutes(store.category);
    const distance = store.distance_km || store.delivery_radius || 3;
    // Travel: ~4 min base, +1.5 min per km over 3km
    const travel = Math.round(4 + Math.max(0, distance - 3) * 1.5);
    // If few riders, add queue wait
    const queueWait = availableRiders === 0 ? 15 : availableRiders < 3 ? 8 : 0;
    const totalMin = prep + travel + queueWait;
    return {
      storeName: sb.storeName,
      storeCategory: store.category || "store",
      prep,
      travel,
      queueWait,
      totalMin,
      distance,
    };
  });

  // Overall estimate is the max (slowest store) since orders are parallel
  const maxMinutes = Math.max(...storeEstimates.map((e) => e.totalMin));
  const now = new Date();
  const earliest = new Date(now.getTime() + (maxMinutes - 5) * 60000);
  const latest = new Date(now.getTime() + (maxMinutes + 10) * 60000);

  const riderStatus = availableRiders === 0
    ? { label: "Busy", color: "text-red-500", bg: "bg-red-500/10", desc: "High demand — expect slight delays" }
    : availableRiders < 3
    ? { label: "Limited", color: "text-amber-500", bg: "bg-amber-500/10", desc: "Few riders available nearby" }
    : { label: "Available", color: "text-terai", bg: "bg-terai/10", desc: "Riders ready to pick up" };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-saffron" /> Estimated Arrival
        </h3>
        {loading ? (
          <span className="text-xs text-foreground/40">Calculating...</span>
        ) : (
          <span className="text-sm font-bold text-saffron">
            {formatTime(earliest)} – {formatTime(latest)}
          </span>
        )}
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="pt-4 mt-4 border-t border-border space-y-3">
          {/* Arrival window */}
          {!loading && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-saffron/5">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-saffron" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {formatTime(earliest)} – {formatTime(latest)}
                </p>
                <p className="text-xs text-foreground/50">
                  ~{maxMinutes} min total{storeEstimates.length > 1 ? ` (${storeEstimates.length} stores)` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Rider availability */}
          <div className={"flex items-center gap-3 p-3 rounded-xl " + riderStatus.bg}>
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0">
              <Bike className={"w-5 h-5 " + riderStatus.color} />
            </div>
            <div>
              <p className={"text-sm font-bold " + riderStatus.color}>
                {loading ? "Checking riders..." : `${availableRiders} rider${availableRiders !== 1 ? "s" : ""} ${riderStatus.label}`}
              </p>
              <p className="text-xs text-foreground/50">{riderStatus.desc}</p>
            </div>
          </div>

          {/* Per-store breakdown */}
          {!loading && storeEstimates.map((est) => (
            <div key={est.storeName} className="p-3 rounded-xl border border-border">
              <p className="text-xs font-bold text-foreground mb-2 truncate capitalize">
                {est.storeName} · {est.storeCategory}
              </p>
              <div className="flex items-center gap-2 text-xs text-foreground/50 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {est.prep} min prep
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {est.travel} min ({est.distance} km)
                </span>
                {est.queueWait > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-500">+{est.queueWait} min queue</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}