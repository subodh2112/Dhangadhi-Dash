import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Download, FileText, TrendingUp, Users, Store, Bike, DollarSign } from "lucide-react";
import { exportCSV } from "@/lib/merchantWallet";

const ranges = [{ id: "7d", label: "7 Days" }, { id: "30d", label: "30 Days" }, { id: "90d", label: "90 Days" }, { id: "all", label: "All Time" }];

export default function AdminReports() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const load = useCallback(async () => {
    try {
      const [o, u, s, r] = await Promise.all([
        base44.entities.Order.list("-created_date", 500),
        base44.entities.User.list("-created_date", 200).catch(() => []),
        base44.entities.Store.list("-created_date", 200).catch(() => []),
        base44.entities.Rider.list("-created_date", 200).catch(() => []),
      ]);
      setOrders(o); setUsers(u); setStores(s); setRiders(r);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 9999;
  const cutoff = new Date(Date.now() - days * 86400000);
  const filteredOrders = orders.filter(o => new Date(o.created_date) >= cutoff);
  const delivered = filteredOrders.filter(o => o.status === "delivered");
  const cancelled = filteredOrders.filter(o => o.status === "cancelled" || o.status === "rejected");
  const totalRevenue = delivered.reduce((s, o) => s + (o.total_amount || 0), 0);
  const commission = Math.round(totalRevenue * 0.1);
  const newUsers = users.filter(u => new Date(u.created_date) >= cutoff);
  const customers = users.filter(u => u.role === "user" || u.role === "customer");

  const prevDays = days * 2;
  const prevCutoff = new Date(Date.now() - prevDays * 86400000);
  const prevOrders = orders.filter(o => new Date(o.created_date) >= prevCutoff && new Date(o.created_date) < cutoff);
  const prevRevenue = prevOrders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total_amount || 0), 0);
  const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

  const storeSales = {};
  delivered.forEach(o => { const name = o.store_name || "Unknown"; storeSales[name] = (storeSales[name] || 0) + (o.total_amount || 0); });
  const topStores = Object.entries(storeSales).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const riderDeliveries = {};
  delivered.forEach(o => { const name = o.rider_name || "Unassigned"; riderDeliveries[name] = (riderDeliveries[name] || 0) + 1; });
  const topRiders = Object.entries(riderDeliveries).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const stats = [
    { label: "Total Revenue", value: "Rs " + totalRevenue.toLocaleString(), icon: DollarSign, color: "bg-saffron/10 text-saffron" },
    { label: "Total Orders", value: filteredOrders.length, icon: TrendingUp, color: "bg-blue-500/10 text-blue-500" },
    { label: "Growth", value: (growth >= 0 ? "+" : "") + growth + "%", icon: TrendingUp, color: growth >= 0 ? "bg-terai/10 text-terai" : "bg-red-500/10 text-red-500" },
    { label: "Commission", value: "Rs " + commission.toLocaleString(), icon: DollarSign, color: "bg-purple-500/10 text-purple-500" },
    { label: "New Users", value: newUsers.length, icon: Users, color: "bg-cyan-500/10 text-cyan-500" },
    { label: "Total Customers", value: customers.length, icon: Users, color: "bg-indigo-500/10 text-indigo-500" },
  ];

  const exportSalesReport = () => {
    const rows = [["Date", "Order Number", "Customer", "Store", "Status", "Total", "Payment Method", "Rider"], ...filteredOrders.map(o => [new Date(o.created_date).toLocaleString(), o.order_number, o.customer_name, o.store_name, o.status, o.total_amount, o.payment_method, o.rider_name])];
    exportCSV(rows, "sales_report_" + range + ".csv");
    toast({ title: "Sales report exported!" });
  };

  const exportUserReport = () => {
    const rows = [["Name", "Email", "Role", "Registered"], ...users.map(u => [u.full_name, u.email, u.role, new Date(u.created_date).toLocaleString()])];
    exportCSV(rows, "user_report.csv");
    toast({ title: "User report exported!" });
  };

  const exportMerchantReport = () => {
    const rows = [["Store Name", "Category", "Rating", "Total Sales (Rs)", "Is Open"], ...stores.map(s => [s.name, s.category, s.rating, storeSales[s.name] || 0, s.is_open ? "Yes" : "No"])];
    exportCSV(rows, "merchant_report.csv");
    toast({ title: "Merchant report exported!" });
  };

  const exportRiderReport = () => {
    const rows = [["Rider Name", "Phone", "Status", "Rating", "Total Deliveries", "Total Earnings"], ...riders.map(r => [r.name, r.phone, r.status, r.rating, r.total_deliveries, r.total_earnings])];
    exportCSV(rows, "rider_report.csv");
    toast({ title: "Rider report exported!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {ranges.map(r => <button key={r.id} onClick={() => setRange(r.id)} className={"flex-1 px-3 py-2 rounded-lg text-xs font-bold " + (range === r.id ? "bg-background text-saffron shadow-sm" : "text-foreground/50")}>{r.label}</button>)}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><Icon className="w-4 h-4" /></div>
              <p className="text-lg font-display font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-foreground/40">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Sales Report", desc: "Revenue, orders, growth", icon: TrendingUp, action: exportSalesReport },
          { label: "User Report", desc: "Registrations, retention", icon: Users, action: exportUserReport },
          { label: "Merchant Report", desc: "Store performance", icon: Store, action: exportMerchantReport },
          { label: "Rider Report", desc: "Deliveries, earnings", icon: Bike, action: exportRiderReport },
        ].map(r => {
          const Icon = r.icon;
          return (
            <button key={r.label} onClick={r.action} className="bg-card rounded-2xl border border-border p-4 text-left hover:border-saffron/30 transition-colors">
              <Icon className="w-5 h-5 text-saffron mb-2" />
              <p className="font-bold text-sm text-foreground">{r.label}</p>
              <p className="text-xs text-foreground/40 mb-2">{r.desc}</p>
              <span className="text-xs text-saffron font-bold flex items-center gap-1"><Download className="w-3 h-3" /> Export CSV</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">Top Stores by Revenue</h3>
          {topStores.length === 0 ? <p className="text-sm text-foreground/40 text-center py-8">No data.</p> : (
            <div className="space-y-2">
              {topStores.map(([name, revenue], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-saffron/10 text-saffron text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-foreground truncate">{name}</span>
                  <span className="text-sm font-bold text-saffron">Rs {revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">Top Riders by Deliveries</h3>
          {topRiders.length === 0 ? <p className="text-sm text-foreground/40 text-center py-8">No data.</p> : (
            <div className="space-y-2">
              {topRiders.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-terai/10 text-terai text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-foreground truncate">{name}</span>
                  <span className="text-sm font-bold text-terai">{count} deliveries</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}