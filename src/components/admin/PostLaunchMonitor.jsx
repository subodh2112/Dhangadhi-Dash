import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, TrendingUp, Users, DollarSign, ShoppingBag, AlertCircle, RefreshCw, Activity, CreditCard, Bike } from "lucide-react";

export default function PostLaunchMonitor() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [dailyData, setDailyData] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [orders, users, payments, crashes, sysLogs, riders] = await Promise.all([
        base44.entities.Order.filter({}, "-created_date", 500).catch(() => []),
        base44.entities.User.list(500).catch(() => []),
        base44.entities.Payment.filter({}, "-created_date", 500).catch(() => []),
        base44.entities.CrashReport.filter({}, "-created_date", 100).catch(() => []),
        base44.entities.SystemLog.filter({ event_type: { $in: ["error", "critical"] } }, "-created_date", 100).catch(() => []),
        base44.entities.Rider.list(50).catch(() => []),
      ]);

      const recentOrders = orders.filter(o => o.created_date && new Date(o.created_date) >= thirtyDaysAgo);
      const recentPayments = payments.filter(p => p.created_date && new Date(p.created_date) >= thirtyDaysAgo);
      const recentUsers = users.filter(u => u.created_date && new Date(u.created_date) >= thirtyDaysAgo);
      const recentCrashes = crashes.filter(c => c.created_date && new Date(c.created_date) >= thirtyDaysAgo);
      const recentErrors = sysLogs.filter(l => l.created_date && new Date(l.created_date) >= thirtyDaysAgo);

      const delivered = recentOrders.filter(o => o.status === "delivered");
      const failedPayments = recentPayments.filter(p => p.payment_status === "failed");
      const totalRevenue = delivered.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const activeRiders = riders.filter(r => r.status === "available" || r.status === "on_delivery");

      const deliverySuccessRate = recentOrders.length > 0 ? Math.round((delivered.length / recentOrders.length) * 100) : 0;
      const paymentSuccessRate = recentPayments.length > 0 ? Math.round(((recentPayments.length - failedPayments.length) / recentPayments.length) * 100) : 100;

      const byDay = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        byDay[key] = { date: key, orders: 0, revenue: 0, users: 0 };
      }
      recentOrders.forEach(o => {
        const key = o.created_date?.split("T")[0];
        if (key && byDay[key]) { byDay[key].orders++; byDay[key].revenue += o.total_amount || 0; }
      });
      recentUsers.forEach(u => {
        const key = u.created_date?.split("T")[0];
        if (key && byDay[key]) byDay[key].users++;
      });

      setMetrics({
        totalOrders: recentOrders.length,
        deliveredOrders: delivered.length,
        totalRevenue,
        newUsers: recentUsers.length,
        failedPayments: failedPayments.length,
        crashes: recentCrashes.length,
        errors: recentErrors.length,
        deliverySuccessRate,
        paymentSuccessRate,
        activeRiders: activeRiders.length,
        avgOrderValue: delivered.length > 0 ? Math.round(totalRevenue / delivered.length) : 0,
      });
      setDailyData(Object.values(byDay));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const maxOrders = Math.max(...dailyData.map(d => d.orders), 1);

  const statCards = [
    { label: "Total Orders (30d)", value: metrics.totalOrders, sub: `${metrics.deliveredOrders} delivered`, icon: ShoppingBag, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" },
    { label: "Revenue (30d)", value: `Rs ${metrics.totalRevenue?.toLocaleString()}`, sub: `Avg Rs ${metrics.avgOrderValue}`, icon: DollarSign, color: "bg-terai/10 text-terai" },
    { label: "New Users (30d)", value: metrics.newUsers, sub: "Registrations", icon: Users, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10" },
    { label: "Delivery Success", value: `${metrics.deliverySuccessRate}%`, sub: `${metrics.deliveredOrders} delivered`, icon: TrendingUp, color: "bg-saffron/10 text-saffron" },
    { label: "Payment Success", value: `${metrics.paymentSuccessRate}%`, sub: `${metrics.failedPayments} failed`, icon: CreditCard, color: metrics.failedPayments > 5 ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-terai/10 text-terai" },
    { label: "App Crashes", value: metrics.crashes, sub: `${metrics.errors} errors`, icon: AlertCircle, color: metrics.crashes > 3 ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-terai/10 text-terai" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Activity className="w-6 h-6 text-saffron" /><div><h2 className="font-display font-bold text-lg text-foreground">Post-Launch Monitor</h2><p className="text-xs text-foreground/50">First 30 days performance tracking</p></div></div>
        <button onClick={load} className="p-2 rounded-lg bg-muted text-foreground/50 hover:text-saffron"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center " + s.color}><s.icon className="w-4 h-4" /></div>
            </div>
            <p className="text-2xl font-display font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-foreground/40">{s.label}</p>
            <p className="text-[10px] text-foreground/30 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-saffron" /> 30-Day Order Trend</h3>
        <div className="flex items-end gap-1 h-32">
          {dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full bg-gradient-to-t from-saffron to-saffron/60 rounded-t-md transition-all hover:from-terai hover:to-terai/60" style={{ height: `${(d.orders / maxOrders) * 100}%`, minHeight: d.orders > 0 ? "4px" : "2px" }} />
              <span className="text-[8px] text-foreground/30">{d.date.slice(5)}</span>
              {d.orders > 0 && <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-carbon text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">{d.orders} orders • Rs {d.revenue}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Bike className="w-4 h-4 text-saffron" /> Delivery Health</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-foreground/60">Success Rate</span><span className="text-sm font-bold text-foreground">{metrics.deliverySuccessRate}%</span></div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-terai rounded-full" style={{ width: `${metrics.deliverySuccessRate}%` }} /></div>
            <div className="flex items-center justify-between"><span className="text-xs text-foreground/60">Delivered Orders</span><span className="text-sm font-bold text-foreground">{metrics.deliveredOrders}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-foreground/60">Active Riders</span><span className="text-sm font-bold text-foreground">{metrics.activeRiders}</span></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-saffron" /> Payment Health</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-foreground/60">Success Rate</span><span className="text-sm font-bold text-foreground">{metrics.paymentSuccessRate}%</span></div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-terai rounded-full" style={{ width: `${metrics.paymentSuccessRate}%` }} /></div>
            <div className="flex items-center justify-between"><span className="text-xs text-foreground/60">Failed Payments</span><span className="text-sm font-bold text-red-500">{metrics.failedPayments}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-foreground/60">Avg Order Value</span><span className="text-sm font-bold text-foreground">Rs {metrics.avgOrderValue}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-saffron" /> Issues Requiring Attention</h3>
        <div className="space-y-2">
          {metrics.crashes === 0 && metrics.failedPayments === 0 && metrics.errors === 0 ? (
            <p className="text-sm text-terai flex items-center gap-2"><TrendingUp className="w-4 h-4" /> No critical issues detected. System running smoothly.</p>
          ) : (
            <>
              {metrics.crashes > 3 && <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-500/5"><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-xs text-foreground/70">{metrics.crashes} crashes in 30 days — investigate crash reports</span></div>}
              {metrics.failedPayments > 5 && <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/5"><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-xs text-foreground/70">{metrics.failedPayments} failed payments — check payment gateway status</span></div>}
              {metrics.errors > 10 && <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/5"><AlertCircle className="w-4 h-4 text-orange-500" /><span className="text-xs text-foreground/70">{metrics.errors} system errors — review system monitor</span></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}