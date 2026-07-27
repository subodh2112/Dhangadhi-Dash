import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bike, MapPin, Clock, Check, X, AlertCircle, Loader2, Radio } from "lucide-react";

const statusColors = {
  pending: "bg-saffron/10 text-saffron",
  accepted: "bg-terai/10 text-terai",
  rejected: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  expired: "bg-muted text-foreground/40",
  cancelled: "bg-muted text-foreground/40",
  offline: "bg-muted text-foreground/40",
};

export default function DeliveryRequestMonitor() {
  const [requests, setRequests] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [reqs, rds] = await Promise.all([
        base44.entities.DeliveryRequest.list("-created_date", 100).catch(() => []),
        base44.entities.Rider.list("-created_date", 50).catch(() => []),
      ]);
      setRequests(reqs);
      setRiders(rds);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const onlineRiders = riders.filter((r) => r.status === "available" && !r.is_suspended);
  const onDeliveryRiders = riders.filter((r) => r.status === "on_delivery");
  const offlineRiders = riders.filter((r) => r.status === "offline" || r.is_suspended);
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const acceptedRequests = requests.filter((r) => r.status === "accepted");
  const failedRequests = requests.filter((r) => r.status === "rejected" || r.status === "expired");

  const stats = [
    { label: "Online Riders", value: onlineRiders.length, color: "bg-terai/10 text-terai" },
    { label: "On Delivery", value: onDeliveryRiders.length, color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Offline", value: offlineRiders.length, color: "bg-muted text-foreground/40" },
    { label: "Pending Requests", value: pendingRequests.length, color: "bg-saffron/10 text-saffron" },
    { label: "Active Deliveries", value: acceptedRequests.length, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
    { label: "Failed Requests", value: failedRequests.length, color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + stat.color}>
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-display font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground/40 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-saffron" /> Rider Locations
        </h2>
        {riders.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No riders registered.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {riders.map((r) => {
              const cardClass = r.is_suspended
                ? "p-3 rounded-xl border border-red-200 bg-red-50/30 dark:border-red-500/20 dark:bg-red-500/5"
                : "p-3 rounded-xl border border-border bg-muted/50";
              const badgeClass = r.is_suspended
                ? "px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                : "px-1.5 py-0.5 rounded-full text-[9px] font-bold " + (statusColors[r.status] || statusColors.offline);
              return (
                <div key={r.id} className={cardClass}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center"><Bike className="w-4 h-4 text-saffron" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                      {r.rider_code && <p className="text-[10px] font-mono text-saffron">{r.rider_code}</p>}
                    </div>
                    <span className={badgeClass}>
                      {r.is_suspended ? "Suspended" : (r.status || "offline").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/40 space-y-0.5">
                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.latitude && r.longitude ? r.latitude.toFixed(4) + ", " + r.longitude.toFixed(4) : "No location"}</p>
                    <p>{r.total_deliveries || 0} deliveries · Rs {r.total_earnings || 0}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-saffron" /> Delivery Requests ({requests.length})
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No delivery requests yet.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {requests.slice(0, 50).map((req) => {
              const iconClass = "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 " + (statusColors[req.status] || statusColors.offline);
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={iconClass}>
                    {req.status === "accepted" ? <Check className="w-4 h-4" /> : req.status === "pending" ? <Clock className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{req.order_number} → {req.rider_name}</p>
                    <p className="text-xs text-foreground/40 truncate">{req.store_name} → {req.customer_location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold " + (statusColors[req.status] || statusColors.offline)}>{req.status}</span>
                    <p className="text-xs text-foreground/40 mt-0.5">Rs {req.delivery_fee}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}