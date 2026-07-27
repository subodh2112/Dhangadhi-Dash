import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Loader2, Bike, Package, MapPin, Radio } from "lucide-react";

const DHANGADHI_CENTER = [28.6969, 80.5952];

const riderStatusColors = {
  available: { color: "#008A45", fillColor: "#008A45", label: "Available" },
  on_delivery: { color: "#FF3D00", fillColor: "#FF3D00", label: "On Delivery" },
  busy: { color: "#F59E0B", fillColor: "#F59E0B", label: "Busy" },
  on_break: { color: "#3B82F6", fillColor: "#3B82F6", label: "On Break" },
  offline: { color: "#9CA3AF", fillColor: "#9CA3AF", label: "Offline" },
};

export default function LiveOperationsMap() {
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);

  const loadData = async () => {
    try {
      const [rds, ords] = await Promise.all([
        base44.entities.Rider.list("-created_date", 100).catch(() => []),
        base44.entities.Order.filter({ status: "on_the_way" }, "-created_date", 50).catch(() => []),
      ]);
      setRiders(rds);
      const active = await base44.entities.Order.filter({ status: "rider_assigned" }, "-created_date", 50).catch(() => []);
      const picked = await base44.entities.Order.filter({ status: "picked_up" }, "-created_date", 50).catch(() => []);
      setOrders([...ords, ...active, ...picked]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const ridersWithLocation = riders.filter((r) => r.latitude && r.longitude);
  const onlineCount = riders.filter((r) => r.status === "available").length;
  const onDeliveryCount = riders.filter((r) => r.status === "on_delivery").length;
  const activeDeliveries = orders.length;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const stats = [
    { label: "Online Riders", value: onlineCount, color: "bg-terai/10 text-terai" },
    { label: "On Delivery", value: onDeliveryCount, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Active Deliveries", value: activeDeliveries, color: "bg-saffron/10 text-saffron" },
    { label: "Tracked", value: ridersWithLocation.length, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + stat.color}><Bike className="w-4 h-4" /></div>
            <p className="text-2xl font-display font-extrabold text-foreground">{stat.value}</p>
            <p className="text-xs text-foreground/40">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-3xl border border-border p-2 overflow-hidden">
          <div className="h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <MapContainer center={DHANGADHI_CENTER} zoom={13} className="w-full h-full" style={{ height: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              {ridersWithLocation.map((r) => {
                const cfg = riderStatusColors[r.status] || riderStatusColors.offline;
                const isSelected = selectedRider?.id === r.id;
                return (
                  <CircleMarker
                    key={r.id}
                    center={[r.latitude, r.longitude]}
                    radius={isSelected ? 14 : 9}
                    pathOptions={{ color: cfg.color, fillColor: cfg.fillColor, fillOpacity: 1 }}
                    eventHandlers={{ click: () => setSelectedRider(r) }}
                  >
                    <Tooltip direction="top">{r.name} - {cfg.label}</Tooltip>
                  </CircleMarker>
                );
              })}
              {orders.filter((o) => o.rider_lat && o.rider_lng).map((o) => (
                <Polyline key={o.id} positions={[[o.rider_lat, o.rider_lng], [28.7080, 80.6180]]} pathOptions={{ color: "#FF3D00", weight: 2, dashArray: "4 6", opacity: 0.4 }} />
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border p-4 space-y-2 max-h-[500px] overflow-y-auto">
          <h3 className="font-display font-bold text-sm text-foreground mb-2 flex items-center gap-2"><Radio className="w-4 h-4 text-saffron" /> Active Riders ({ridersWithLocation.length})</h3>
          {ridersWithLocation.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-8">No riders with location data.</p>
          ) : (
            ridersWithLocation.map((r) => {
              const cfg = riderStatusColors[r.status] || riderStatusColors.offline;
              return (
                <button key={r.id} onClick={() => setSelectedRider(r)} className={"w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left " + (selectedRider?.id === r.id ? "bg-saffron/5 ring-1 ring-saffron/20" : "bg-muted/50 hover:bg-muted")}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cfg.fillColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-foreground/40">{cfg.label} · {r.rider_code || "No code"}</p>
                  </div>
                  {r.status === "on_delivery" && <Package className="w-3.5 h-3.5 text-saffron flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-saffron" /> Active Deliveries ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No active deliveries right now.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders.map((o) => (
              <div key={o.id} className="border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm text-foreground">{o.order_number}</p>
                    <p className="text-xs text-foreground/40">{o.store_name}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saffron/10 text-saffron capitalize">{(o.status || "").replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-foreground/50 flex items-center gap-1 mb-1"><Bike className="w-3 h-3" /> {o.rider_name || "Unassigned"}</p>
                <p className="text-xs text-foreground/40 flex items-center gap-1"><MapPin className="w-3 h-3" /> {o.delivery_address}</p>
                {o.rider_lat && o.rider_lng && <p className="text-xs text-terai mt-2 font-mono">{o.rider_lat.toFixed(4)}, {o.rider_lng.toFixed(4)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}