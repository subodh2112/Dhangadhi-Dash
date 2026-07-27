import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Package, Search, Loader2, CheckCircle2, Clock, Bike, Store, Truck, Home, XCircle, MapPin } from "lucide-react";
import TrackingMap from "@/components/tracking/TrackingMap";

const statusFlow = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: Store },
  { key: "ready_for_pickup", label: "Ready for Pickup", icon: Package },
  { key: "rider_assigned", label: "Rider Assigned", icon: Bike },
  { key: "picked_up", label: "Picked Up", icon: Truck },
  { key: "on_the_way", label: "On the Way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadRecent();
  }, [user]);

  async function loadRecent() {
    if (!user) return;
    try {
      const orders = await base44.entities.Order.filter({ created_by_id: user.id }, "-created_date", 5);
      setRecentOrders(orders);
      const active = orders.find((o) => !["delivered", "cancelled", "rejected"].includes(o.status));
      if (active) {
        setOrder(active);
        setOrderNumber(active.order_number);
      }
    } catch {
      // ignore
    }
  }

  async function searchOrder(e) {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const orders = await base44.entities.Order.filter({ order_number: orderNumber.trim() }, "-created_date", 1);
      if (orders.length > 0) {
        setOrder(orders[0]);
      } else {
        setOrder(null);
        toast({ title: "Order not found", description: "Check your order number and try again.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const currentIndex = order ? statusFlow.findIndex((s) => s.key === order.status) : -1;
  const isCancelled = order && ["cancelled", "rejected"].includes(order.status);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Order Status" subtitle="Track your order in real-time with live status updates." icon={Package} gradient="from-blue-600 to-cyan-600" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={searchOrder} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="Enter your order number (e.g. DD-XXXXXX)" className="pl-10 h-12" />
          </div>
          <Button type="submit" disabled={loading} className="h-12 px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
          </Button>
        </form>

        {recentOrders.length > 0 && !order && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <p className="text-xs text-foreground/50 mb-2">Recent Orders</p>
            <div className="flex flex-wrap gap-2">
              {recentOrders.map((o) => (
                <button key={o.id} onClick={() => { setOrder(o); setOrderNumber(o.order_number); }} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-saffron/10 hover:text-saffron transition-colors">
                  {o.order_number}
                </button>
              ))}
            </div>
          </div>
        )}

        {!order && searched && !loading && (
          <div className="text-center py-12 text-foreground/40">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No order found with that number.</p>
          </div>
        )}

        {!order && !searched && recentOrders.length === 0 && (
          <div className="text-center py-12 text-foreground/40">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="mb-4">Enter your order number to track its status.</p>
            <Link to="/orders"><Button variant="outline" className="h-11">View Order History</Button></Link>
          </div>
        )}

        {order && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-foreground/50">Order Number</p>
                  <p className="font-bold text-foreground">{order.order_number}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${isCancelled ? "bg-red-100 text-red-700" : order.status === "delivered" ? "bg-terai/10 text-terai" : "bg-saffron/10 text-saffron"}`}>
                  {isCancelled ? order.status : order.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-sm text-foreground/60 space-y-1">
                <p className="flex items-center gap-1.5"><Store className="w-4 h-4" /> {order.store_name}</p>
                {order.estimated_minutes > 0 && <p className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Est. {order.estimated_minutes} min</p>}
                {order.rider_name && <p className="flex items-center gap-1.5"><Bike className="w-4 h-4" /> Rider: {order.rider_name}</p>}
                <p className="font-bold text-foreground pt-1">Total: Rs. {order.total_amount}</p>
              </div>
            </div>

            {!isCancelled && currentIndex >= statusFlow.findIndex((s) => s.key === "rider_assigned") && (
              <div className="bg-card border border-border rounded-2xl p-5 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-saffron" />
                  <h3 className="font-bold text-foreground text-sm">Live Delivery Map</h3>
                  {order.rider_name && <span className="text-xs text-foreground/50 ml-auto">Rider: {order.rider_name}</span>}
                </div>
                <div className="rounded-xl overflow-hidden h-[320px]">
                  <TrackingMap
                    status={order.status}
                    riderPosition={(order.rider_lat && order.rider_lng) ? [order.rider_lat, order.rider_lng] : null}
                  />
                </div>
                {order.status === "on_the_way" && (
                  <p className="text-xs text-saffron font-medium mt-2 text-center animate-pulse">Rider is on the way to your location...</p>
                )}
              </div>
            )}

            {!isCancelled ? (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-5">Delivery Progress</h3>
                <div className="relative">
                  {statusFlow.map((step, i) => {
                    const isDone = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                      <div key={step.key} className="flex gap-3 pb-6 last:pb-0 relative">
                        {i < statusFlow.length - 1 && (
                          <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${i < currentIndex ? "bg-terai" : "bg-border"}`} />
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isDone ? "bg-terai text-white" : "bg-muted text-foreground/40"} ${isCurrent ? "ring-4 ring-terai/20" : ""}`}>
                          <step.icon className="w-4 h-4" />
                        </div>
                        <div className="pt-1.5">
                          <p className={`text-sm font-medium ${isDone ? "text-foreground" : "text-foreground/40"}`}>{step.label}</p>
                          {isCurrent && <p className="text-xs text-terai mt-0.5">In progress...</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="font-bold text-foreground">Order {order.status}</p>
                {order.rejection_reason && <p className="text-xs text-foreground/60 mt-1">{order.rejection_reason}</p>}
              </div>
            )}

            <div className="text-center">
              <Link to="/track"><Button variant="outline" className="h-11">Full Tracking Map</Button></Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}