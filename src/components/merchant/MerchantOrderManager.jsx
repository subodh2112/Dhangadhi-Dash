import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, ChefHat, Package, Loader2, Bike, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { sendOrderStatusEmail } from "@/lib/orderNotifications";
import { dispatchToNextRider } from "@/lib/riderDispatch";

const statusColors = {
  pending: "bg-saffron/10 text-saffron", accepted: "bg-blue-500/10 text-blue-500",
  preparing: "bg-amber-500/10 text-amber-500", ready_for_pickup: "bg-purple-500/10 text-purple-500",
  rider_assigned: "bg-indigo-500/10 text-indigo-500", picked_up: "bg-cyan-500/10 text-cyan-500",
  on_the_way: "bg-terai/10 text-terai", delivered: "bg-green-500/10 text-green-500",
  rejected: "bg-red-500/10 text-red-500", cancelled: "bg-red-500/10 text-red-500",
};
const statusLabels = {
  pending: "Pending", accepted: "Accepted", preparing: "Preparing",
  ready_for_pickup: "Ready", rider_assigned: "Rider Assigned",
  picked_up: "Picked Up", on_the_way: "On the Way", delivered: "Delivered",
  rejected: "Rejected", cancelled: "Cancelled",
};
const orderTabs = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready" },
  { key: "delivered", label: "Completed" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
];
const prepOptions = [15, 20, 30, 45];

export default function MerchantOrderManager({ storeId, storeName, merchantId }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [prepTime, setPrepTime] = useState({});

  const loadOrders = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try {
      const data = await base44.entities.Order.filter({ store_id: storeId }, "-created_date", 100);
      setOrders(data);
    } catch {} finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Real-time subscription: auto-update when new orders arrive
  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (event.type === "create" && event.data?.store_id === storeId) {
        setOrders((prev) => {
          if (prev.some((o) => o.id === event.data.id)) return prev;
          return [event.data, ...prev];
        });
        toast({ title: "🔔 New Order Received!", description: `Order ${event.data.order_number} - Rs ${event.data.total_amount}`, className: "bg-saffron text-white" });
        // Play notification sound
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1dJ7rKi+e3t6C5q5ySk+uXWVqZpJoYmKAmGqWfH5yZkmBhX6AYIqPem+cqKd8kqXo9K2ua+Ot5qrlHOsmJiCfo+6e0KJsjIWl2WREQ1OTY2NhYGBkpaWmZSOmZqXlY+Yk5ORkZCPjYyLioqJiIiHhoaGhYWFhISDg4OCgoGBgYCAgH9+fX17eXl1dXRzc3NwcG9ubmxsbGpqaWhoZ2dmZmVlZGRjY2NiYmFhYGA/Xl5cXFtaWlhYV1ZVVFRTUlFQTz4+PDs6NjQyMC8uLSwpKCQiIB8eHBsaGRgXFhITEA8NDAoGBQQDAA==");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}
      } else if (event.type === "update") {
        setOrders((prev) => prev.map((o) => (o.id === event.data.id ? { ...o, ...event.data } : o)));
      } else if (event.type === "delete") {
        setOrders((prev) => prev.filter((o) => o.id !== event.data.id));
      }
    });
    return unsubscribe;
  }, [storeId, toast]);

  const updateOrderStatus = async (orderId, status, extra = {}) => {
    setActionLoading(orderId);
    const prevOrders = orders;
    const order = orders.find((o) => o.id === orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status, ...extra } : o)));
    try {
      await base44.entities.Order.update(orderId, { status, ...extra });
      try { await base44.entities.AuditLog.create({ action: `order_${status}`, target_type: "order", target_name: order?.order_number || "", details: `Status changed to ${status}` }); } catch {}

      if (status === "accepted") {
        try {
          const riders = await base44.entities.Rider.filter({ status: "available" });
          let nearestRider = riders[0];
          if (storeId && riders.length > 0) {
            try {
              const store = await base44.entities.Store.get(storeId);
              if (store?.latitude && store?.longitude) {
                let minDist = Infinity;
                for (const r of riders) {
                  if (r.latitude && r.longitude) {
                    const dist = Math.sqrt(Math.pow(r.latitude - store.latitude, 2) + Math.pow(r.longitude - store.longitude, 2));
                    if (dist < minDist) { minDist = dist; nearestRider = r; }
                  }
                }
              }
            } catch {}
          }
          if (nearestRider) {
            await base44.entities.Notification.create({ recipient_type: "rider", recipient_user_id: nearestRider.user_id, title: "New Delivery Request", message: `Order ${order?.order_number} from ${storeName} - Rs ${order?.delivery_fee || 40} fee.`, type: "rider_request", related_order_id: orderId });
          }
        } catch {}
      }

      if (status === "ready_for_pickup") {
        try {
          await dispatchToNextRider(order, storeId);
        } catch {}
      }

      sendOrderStatusEmail({ ...order, ...extra }, status);
      toast({ title: `Order ${statusLabels[status] || status}` });
    } catch { setOrders(prevOrders); toast({ title: "Failed to update order", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    await updateOrderStatus(rejectModal.id, "rejected", { rejection_reason: rejectReason });
    setRejectModal(null);
    setRejectReason("");
  };

  const filtered = orders.filter((o) => o.status === activeTab);
  const counts = orderTabs.reduce((acc, tab) => { acc[tab.key] = orders.filter((o) => o.status === tab.key).length; return acc; }, {});

  const renderOrderCard = (order) => (
    <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-sm text-foreground">{order.order_number}</p>
          <p className="text-xs text-foreground/40">{order.customer_name} · Rs {order.total_amount}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-muted"}`}>{statusLabels[order.status] || order.status}</span>
      </div>
      <p className="text-xs text-foreground/50 mb-2 line-clamp-1">{order.items}</p>
      <p className="text-xs text-foreground/40 mb-3 flex items-center gap-1"><Package className="w-3 h-3" /> {order.delivery_address}</p>

      {order.status === "pending" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => updateOrderStatus(order.id, "accepted")} disabled={actionLoading === order.id} className="bg-terai hover:bg-terai/90 h-8"><Check className="w-3.5 h-3.5" /> Accept</Button>
          <Button size="sm" variant="destructive" onClick={() => { setRejectModal(order); setRejectReason(""); }} disabled={actionLoading === order.id} className="h-8"><X className="w-3.5 h-3.5" /> Reject</Button>
        </div>
      )}

      {order.status === "accepted" && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => updateOrderStatus(order.id, "preparing", { preparation_minutes: parseInt(prepTime[order.id]) || 30 })} disabled={actionLoading === order.id} className="bg-amber-500 hover:bg-amber-600 h-8"><ChefHat className="w-3.5 h-3.5" /> Start Preparing</Button>
          <div className="flex items-center gap-1">
            {prepOptions.map((m) => (
              <button key={m} onClick={() => setPrepTime((prev) => ({ ...prev, [order.id]: m }))} className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${prepTime[order.id] === m ? "bg-saffron text-white" : "bg-muted text-foreground/60"}`}>{m}m</button>
            ))}
          </div>
          <span className="text-xs text-foreground/40">min</span>
        </div>
      )}

      {order.status === "preparing" && (
        <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready_for_pickup")} disabled={actionLoading === order.id} className="bg-purple-500 hover:bg-purple-600 h-8"><Check className="w-3.5 h-3.5" /> Mark Ready</Button>
      )}

      {["ready_for_pickup","rider_assigned","picked_up","on_the_way"].includes(order.status) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <Clock className="w-3.5 h-3.5" />
            {order.status === "ready_for_pickup" && "Waiting for rider assignment..."}
            {order.status === "rider_assigned" && "Rider is arriving for pickup"}
            {order.status === "picked_up" && "Order picked up - heading to customer"}
            {order.status === "on_the_way" && "Rider is on the way to customer"}
          </div>
          {order.rider_name && ["rider_assigned","picked_up","on_the_way"].includes(order.status) && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Bike className="w-3.5 h-3.5 text-saffron flex-shrink-0" />
              <span className="text-xs text-foreground/60 flex-1 truncate">{order.rider_name}</span>
              {order.rider_lat && order.rider_lng && (
                <a href={"https://www.google.com/maps?q=" + order.rider_lat + "," + order.rider_lng} target="_blank" rel="noopener noreferrer" className="text-xs text-saffron font-bold flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> Track
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {order.rejection_reason && <p className="text-xs text-red-500 mt-2">Reason: {order.rejection_reason}</p>}
    </motion.div>
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-2xl overflow-x-auto no-scrollbar">
        {orderTabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-background text-saffron shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
            {tab.label}
            {counts[tab.key] > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-saffron text-white" : "bg-foreground/10"}`}>{counts[tab.key]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><Package className="w-12 h-12 text-foreground/20 mx-auto mb-3" /><p className="text-foreground/40">No {activeTab} orders.</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">{filtered.map(renderOrderCard)}</div>
      )}

      <Dialog open={!!rejectModal} onOpenChange={(open) => !open && setRejectModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><X className="w-5 h-5 text-red-500" /> Reject Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {rejectModal && <p className="text-sm text-foreground/50">Order {rejectModal.order_number} · Rs {rejectModal.total_amount}</p>}
            <div>
              <Label>Rejection Reason</Label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm" placeholder="e.g. Out of stock, unable to prepare..." />
            </div>
            <Button onClick={handleReject} disabled={!rejectReason.trim()} variant="destructive" className="w-full">Confirm Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}