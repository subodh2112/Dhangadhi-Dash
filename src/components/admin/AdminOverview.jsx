import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Users, Store, Bike, ShoppingBag, DollarSign, TrendingUp, UserPlus, CheckCircle, XCircle, Activity, Wallet, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { logAdminAction } from "@/lib/adminLog";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [orders, users, stores, riders, mWallets, rWallets, mWithdrawals, rWithdrawals, apps, auditLogs] = await Promise.all([
        base44.entities.Order.list("-created_date", 500).catch(() => []),
        base44.entities.User.list("-created_date", 200).catch(() => []),
        base44.entities.Store.list("-created_date", 200).catch(() => []),
        base44.entities.Rider.list("-created_date", 200).catch(() => []),
        base44.entities.MerchantWallet.list("-created_date", 100).catch(() => []),
        base44.entities.RiderWallet.list("-created_date", 100).catch(() => []),
        base44.entities.MerchantWithdrawal.filter({ status: "pending" }).catch(() => []),
        base44.entities.Withdrawal.filter({ status: "pending" }).catch(() => []),
        base44.entities.MerchantApplication.filter({ status: "pending" }).catch(() => []),
        base44.entities.AuditLog.list("-created_date", 10).catch(() => []),
      ]);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 86400000);

      const customers = users.filter(u => u.role === "user" || u.role === "customer");
      const newThisWeek = customers.filter(u => new Date(u.created_date) >= weekAgo);
      const activeStores = stores.filter(s => !s.is_suspended);
      const onlineRiders = riders.filter(r => r.status === "available" || r.status === "on_delivery");
      const activeDeliveries = riders.filter(r => r.status === "on_delivery");
      const todayOrders = orders.filter(o => new Date(o.created_date) >= todayStart);
      const completed = orders.filter(o => o.status === "delivered");
      const cancelled = orders.filter(o => o.status === "cancelled" || o.status === "rejected");
      const totalRevenue = completed.reduce((s, o) => s + (o.total_amount || 0), 0);
      const commissionEarned = mWallets.reduce((s, w) => s + (w.commission_amount || 0), 0);
      const pendingPayouts = [...mWithdrawals, ...rWithdrawals].reduce((s, w) => s + (w.amount || 0), 0);

      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dayOrders = orders.filter(o => new Date(o.created_date).toDateString() === d.toDateString());
        last7Days.push({ day: d.toLocaleDateString("en", { weekday: "short" }), orders: dayOrders.length, revenue: dayOrders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total_amount || 0), 0) });
      }

      setData({ customers: customers.length, newThisWeek: newThisWeek.length, stores: stores.length, activeStores: activeStores.length, pendingApps: apps.length, riders: riders.length, onlineRiders: onlineRiders.length, activeDeliveries: activeDeliveries.length, totalOrders: orders.length, todayOrders: todayOrders.length, completed: completed.length, cancelled: cancelled.length, totalRevenue, commissionEarned, pendingPayouts, last7Days });
      setLogs(auditLogs);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;
  if (!data) return <p className="text-center text-foreground/40 py-20">Failed to load data.</p>;

  const sections = [
    { title: "Users", color: "text-blue-500", stats: [
      { label: "Total Customers", value: data.customers, icon: Users },
      { label: "New This Week", value: data.newThisWeek, icon: UserPlus },
    ]},
    { title: "Merchants", color: "text-terai", stats: [
      { label: "Total Stores", value: data.stores, icon: Store },
      { label: "Active Stores", value: data.activeStores, icon: CheckCircle },
      { label: "Pending Approvals", value: data.pendingApps, icon: Activity },
    ]},
    { title: "Riders", color: "text-saffron", stats: [
      { label: "Total Riders", value: data.riders, icon: Bike },
      { label: "Online Now", value: data.onlineRiders, icon: Activity },
      { label: "On Delivery", value: data.activeDeliveries, icon: ShoppingBag },
    ]},
    { title: "Orders", color: "text-purple-500", stats: [
      { label: "Total Orders", value: data.totalOrders, icon: ShoppingBag },
      { label: "Today's Orders", value: data.todayOrders, icon: TrendingUp },
      { label: "Completed", value: data.completed, icon: CheckCircle },
      { label: "Cancelled", value: data.cancelled, icon: XCircle },
    ]},
    { title: "Revenue", color: "text-amber-500", stats: [
      { label: "Total Revenue", value: "Rs " + data.totalRevenue.toLocaleString(), icon: DollarSign },
      { label: "Commission Earned", value: "Rs " + data.commissionEarned.toLocaleString(), icon: Wallet },
      { label: "Pending Payouts", value: "Rs " + data.pendingPayouts.toLocaleString(), icon: DollarSign },
    ]},
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className={"font-display font-bold text-sm uppercase tracking-wide mb-3 " + section.color}>{section.title}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {section.stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border p-4">
                  <div className={"w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-2 " + section.color}><Icon className="w-4 h-4" /></div>
                  <p className="text-xl font-display font-extrabold text-foreground">{stat.value}</p>
                  <p className="text-xs text-foreground/40">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {logs.length > 0 && (
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-saffron" /> Recent Admin Activity</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-saffron flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{log.action} · {log.target_name || log.target_type}</p>
                  {log.details && <p className="text-xs text-foreground/40 truncate">{log.details}</p>}
                </div>
                <span className="text-xs text-foreground/30">{new Date(log.created_date).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}