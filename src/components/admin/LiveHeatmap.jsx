import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Package, Bike, Activity, MapPin } from "lucide-react";

const DHANGADHI_CENTER = [28.6969, 80.5966];

const statusColors = {
  pending: "#FF3D00", accepted: "#3B82F6", preparing: "#F59E0B",
  ready_for_pickup: "#8B5CF6", rider_assigned: "#6366F1",
  picked_up: "#06B6D4", on_the_way: "#10B981", delivered: "#16A34A",
  rejected: "#EF4444", cancelled: "#EF4444",
};

const statusLabels = {
  pending: "Pending", accepted: "Accepted", preparing: "Preparing",
  ready_for_pickup: "Ready", rider_assigned: "Assigned",
  picked_up: "Picked Up", on_the_way: "On the Way", delivered: "Delivered",
};

const activeStatuses = ["pending", "accepted", "preparing", "ready_for_pickup", "rider_assigned", "picked_up", "on_the_way"];

const zones = [
  { name: "Core Market (Chowk)", lat: 28.6969, lng: 80.5966 },
  { name: "Campus Road", lat: 28.7100, lng: 80.5900 },
  { name: "Hasanpur", lat: 28.6800, lng: 80.6100 },
  { name: "Shree Nagar", lat: 28.7150, lng: 80.6100 },
  { name: "Phulbari", lat: 28.6850, lng: 80.5800 },
  { name: "Basantpur", lat: 28.6900, lng: 80.6200 },
];

const orderIcon = (color) => L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});

const riderIcon = (available) => L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background:${available ? "#10B981" : "#94A3B8"};width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:8px;">🛵</div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

export default function LiveHeatmap() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadData = async () => {
    try {
      const [o, r, s] = await Promise.all([
        base44.entities.Order.list("-created_date", 100).catch(() => []),
        base44.entities.Rider.list("-created_date", 100).catch(() => []),
        base44.entities.Store.list("-created_date", 100).catch(() => []),
      ]);
      setOrders(o); setRiders(r); setStores(s);
      setLastUpdate(new Date());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));
  const availableRiders = riders.filter((r) => r.status === "available");
  const onDeliveryRiders = riders.filter((r) => r.status === "on_delivery");

  const orderLocations = activeOrders.map((order) => {
    const store = stores.find((s) => s.id === order.store_id || s.name === order.store_name);
    const lat = store?.latitude || DHANGADHI_CENTER[0] + (Math.random() - 0.5) * 0.03;
    const lng = store?.longitude || DHANGADHI_CENTER[1] + (Math.random() - 0.5) * 0.03;
    return { order, lat, lng };
  });

  const zoneDensity = zones.map((zone) => ({
    ...zone,
    count: orderLocations.filter((ol) => Math.sqrt(Math.pow(ol.lat - zone.lat, 2) + Math.pow(ol.lng - zone.lng, 2)) < 0.015).length,
  }));

  const stats = [
    { label: "Active Orders", value: activeOrders.length, icon: Package, color: "bg-saffron/10 text-saffron" },
    { label: "Available Riders", value: availableRiders.length, icon: Bike, color: "bg-terai/10 text-terai" },
    { label: "On Delivery", value: onDeliveryRiders.length, icon: Activity, color: "bg-blue-50 text-blue-500" },
    { label: "Total Stores", value: stores.length, icon: MapPin, color: "bg-amber-50 text-amber-500" },
  ];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">Live Operations Heatmap</h2>
          <p className="text-sm text-foreground/50">Real-time view of active orders and riders across Dhangadhi · Updates every 15s</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 text-xs font-bold text-saffron bg-saffron/10 px-3 py-2 rounded-lg hover:bg-saffron/20">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div>
              <p className="text-xl font-display font-extrabold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-foreground/40 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border p-2 overflow-hidden">
        <MapContainer center={DHANGADHI_CENTER} zoom={13} className="w-full h-[500px] rounded-xl" scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          {zoneDensity.map((zone) => (
            <CircleMarker key={zone.name} center={[zone.lat, zone.lng]} radius={zone.count > 0 ? 25 + zone.count * 5 : 15}
              pathOptions={{ color: zone.count > 3 ? "#EF4444" : zone.count > 1 ? "#F59E0B" : "#3B82F6", fillColor: zone.count > 3 ? "#EF4444" : zone.count > 1 ? "#F59E0B" : "#3B82F6", fillOpacity: 0.15, weight: 2 }}>
              <Popup><strong>{zone.name}</strong><br />{zone.count} active order{zone.count !== 1 ? "s" : ""}</Popup>
            </CircleMarker>
          ))}
          {orderLocations.map(({ order, lat, lng }) => (
            <Marker key={order.id} position={[lat, lng]} icon={orderIcon(statusColors[order.status] || "#FF3D00")}>
              <Popup><strong>{order.order_number}</strong><br />Status: {statusLabels[order.status] || order.status}<br />Store: {order.store_name}<br />Total: Rs {order.total_amount}<br />Customer: {order.customer_name}</Popup>
            </Marker>
          ))}
          {riders.filter((r) => r.latitude && r.longitude).map((rider) => (
            <Marker key={rider.id} position={[rider.latitude, rider.longitude]} icon={riderIcon(rider.status === "available")}>
              <Popup><strong>{rider.name}</strong><br />Status: {rider.status}<br />{rider.vehicle_type && `Vehicle: ${rider.vehicle_type}`}<br />{rider.total_deliveries ? `Deliveries: ${rider.total_deliveries}` : ""}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-bold text-sm text-foreground mb-3">Zone Activity</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {zoneDensity.map((zone) => (
            <div key={zone.name} className={`p-3 rounded-xl border ${zone.count > 0 ? "border-saffron/30 bg-saffron/5" : "border-border"}`}>
              <p className="text-xs font-bold text-foreground">{zone.name}</p>
              <p className={`text-lg font-display font-extrabold ${zone.count > 3 ? "text-red-500" : zone.count > 0 ? "text-saffron" : "text-foreground/30"}`}>{zone.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-bold text-sm text-foreground mb-3">Active Orders ({activeOrders.length})</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
          {activeOrders.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-4">No active orders right now.</p>
          ) : (
            activeOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs font-bold text-foreground">{order.order_number} · {order.store_name}</p>
                  <p className="text-[10px] text-foreground/40">{order.customer_name} · Rs {order.total_amount}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: statusColors[order.status] || "#999" }}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-foreground/30 text-center">Last updated: {lastUpdate.toLocaleTimeString()}</p>
    </div>
  );
}