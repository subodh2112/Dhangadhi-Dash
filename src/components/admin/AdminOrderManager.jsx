import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, Filter, Eye, X, Bike, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAdminAction } from "@/lib/adminLog";

const statuses = ["pending", "accepted", "preparing", "ready_for_pickup", "rider_assigned", "picked_up", "on_the_way", "delivered", "rejected", "cancelled"];

export default function AdminOrderManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    try {
      const [o, r] = await Promise.all([
        base44.entities.Order.list("-created_date", 200),
        base44.entities.Rider.list("-created_date", 100).catch(() => []),
      ]);
      setOrders(o);
      setRiders(r);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    if (search && !o.order_number?.toLowerCase().includes(search.toLowerCase()) && !o.customer_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    if (paymentFilter && o.payment_method !== paymentFilter) return false;
    return true;
  });

  const changeStatus = async (orderId, newStatus, orderNumber) => {
    setActionLoading(orderId);
    try {
      await base44.entities.Order.update(orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selected) setSelected(prev => ({ ...prev, status: newStatus }));
      await logAdminAction("Changed order status", "Order", orderNumber, "Status changed to " + newStatus);
      toast({ title: "Order status updated to " + newStatus });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setActionLoading(null);
  };

  const reassignRider = async (orderId, riderId, orderNumber) => {
    const rider = riders.find(r => r.id === riderId);
    if (!rider) return;
    setActionLoading(orderId);
    try {
      await base44.entities.Order.update(orderId, { rider_id: riderId, rider_name: rider.name, status: "rider_assigned" });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, rider_id: riderId, rider_name: rider.name, status: "rider_assigned" } : o));
      if (selected) setSelected(prev => ({ ...prev, rider_id: riderId, rider_name: rider.name, status: "rider_assigned" }));
      await logAdminAction("Reassigned rider", "Order", orderNumber, "Assigned rider: " + rider.name);
      toast({ title: "Rider reassigned to " + rider.name });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setActionLoading(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const statusColors = { pending: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", accepted: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", preparing: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400", ready_for_pickup: "bg-cyan-50 text-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-400", rider_assigned: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400", picked_up: "bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400", on_the_way: "bg-saffron/10 text-saffron", delivered: "bg-terai/10 text-terai", rejected: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", cancelled: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or customer..." className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
          <option value="">All Payments</option>
          <option value="cod">Cash on Delivery</option>
          <option value="esewa">eSewa</option>
          <option value="khalti">Khalti</option>
          <option value="card">Card</option>
        </select>
      </div>

      <p className="text-xs text-foreground/40">{filtered.length} orders found</p>

      <div className="space-y-2">
        {filtered.slice(0, 50).map(o => (
          <div key={o.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm text-foreground">{o.order_number}</p>
                <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (statusColors[o.status] || "bg-muted")}>{o.status?.replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-foreground/50 truncate">{o.customer_name} · {o.store_name} · Rs {o.total_amount}</p>
            </div>
            <button onClick={() => setSelected(o)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-saffron/10 hover:text-saffron transition-colors"><Eye className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="text-center py-12"><Filter className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No orders match your filters.</p></div>}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2">Order {selected.order_number}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-foreground/40">Customer</p><p className="font-semibold text-foreground">{selected.customer_name}</p></div>
                  <div><p className="text-xs text-foreground/40">Store</p><p className="font-semibold text-foreground">{selected.store_name}</p></div>
                  <div><p className="text-xs text-foreground/40">Total</p><p className="font-semibold text-foreground">Rs {selected.total_amount}</p></div>
                  <div><p className="text-xs text-foreground/40">Payment</p><p className="font-semibold text-foreground">{selected.payment_method}</p></div>
                  <div><p className="text-xs text-foreground/40">Rider</p><p className="font-semibold text-foreground">{selected.rider_name || "Not assigned"}</p></div>
                  <div><p className="text-xs text-foreground/40">Date</p><p className="font-semibold text-foreground">{new Date(selected.created_date).toLocaleString()}</p></div>
                </div>

                {selected.delivery_address && <div><p className="text-xs text-foreground/40">Delivery Address</p><p className="text-sm text-foreground/70">{selected.delivery_address}</p></div>}

                <div>
                  <p className="text-xs text-foreground/40 mb-2 font-semibold uppercase">Order Timeline</p>
                  <div className="space-y-1">
                    {["pending", "accepted", "preparing", "rider_assigned", "picked_up", "on_the_way", "delivered"].map((step, i) => {
                      const stepIndex = statuses.indexOf(selected.status);
                      const done = stepIndex >= i && selected.status !== "cancelled" && selected.status !== "rejected";
                      return (
                        <div key={step} className="flex items-center gap-2">
                          <div className={"w-3 h-3 rounded-full " + (done ? "bg-terai" : "bg-muted")} />
                          <span className={"text-xs " + (done ? "text-foreground font-semibold" : "text-foreground/30")}>{step.replace(/_/g, " ")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-foreground/40 mb-1 font-semibold uppercase">Change Status</p>
                  <select onChange={(e) => changeStatus(selected.id, e.target.value, selected.order_number)} value={selected.status} disabled={actionLoading === selected.id} className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm">
                    {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </div>

                <div>
                  <p className="text-xs text-foreground/40 mb-1 font-semibold uppercase flex items-center gap-1"><Bike className="w-3 h-3" /> Assign/Reassign Rider</p>
                  <select onChange={(e) => e.target.value && reassignRider(selected.id, e.target.value, selected.order_number)} value="" className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm">
                    <option value="">Select rider...</option>
                    {riders.map(r => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}
                  </select>
                </div>

                {selected.status !== "cancelled" && (
                  <button onClick={() => changeStatus(selected.id, "cancelled", selected.order_number)} disabled={actionLoading === selected.id} className="w-full h-10 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel Order</button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}