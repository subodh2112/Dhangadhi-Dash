import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ShoppingBag, TrendingUp, Package, Star, XCircle, Loader2, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

export default function MerchantAnalytics({ storeId, storeName }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try {
      const [o, p] = await Promise.all([
        base44.entities.Order.filter({ store_id: storeId }, "-created_date", 500).catch(() => []),
        base44.entities.Product.filter({ store_id: storeId }, "-created_date", 200).catch(() => []),
      ]);
      setOrders(o);
      setProducts(p);
    } catch {} finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const now = new Date();
  const today = orders.filter((o) => { const d = new Date(o.created_date); return d.toDateString() === now.toDateString(); });
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekOrders = orders.filter((o) => new Date(o.created_date) >= weekAgo);
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthOrders = orders.filter((o) => new Date(o.created_date) >= monthAgo);
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled" || o.status === "rejected");
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const avgRating = products.length > 0 ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1) : "—";

  const productSales = {};
  deliveredOrders.forEach((o) => {
    try {
      const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
      if (Array.isArray(items)) {
        items.forEach((item) => { const name = item.name || item.product_name || "Unknown"; productSales[name] = (productSales[name] || 0) + (item.quantity || 1); });
      }
    } catch {}
  });
  const popularProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name: name.substring(0, 15), count }));

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOrders = orders.filter((o) => new Date(o.created_date).toDateString() === d.toDateString());
    last7Days.push({ day: d.toLocaleDateString("en", { weekday: "short" }), orders: dayOrders.length, revenue: dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0) });
  }

  const statusData = [
    { name: "Delivered", value: deliveredOrders.length, color: "hsl(149, 100%, 27%)" },
    { name: "Cancelled", value: cancelledOrders.length, color: "hsl(0, 84%, 60%)" },
    { name: "Active", value: orders.length - deliveredOrders.length - cancelledOrders.length, color: "hsl(13, 100%, 50%)" },
  ].filter((d) => d.value > 0);

  const stats = [
    { label: "Today's Orders", value: today.length, icon: ShoppingBag, color: "bg-saffron/10 text-saffron" },
    { label: "Weekly Orders", value: weekOrders.length, icon: Package, color: "bg-blue-500/10 text-blue-500" },
    { label: "Monthly Orders", value: monthOrders.length, icon: TrendingUp, color: "bg-terai/10 text-terai" },
    { label: "Total Revenue", value: `Rs ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-amber-500/10 text-amber-500" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "bg-purple-500/10 text-purple-500" },
    { label: "Cancelled", value: cancelledOrders.length, icon: XCircle, color: "bg-red-500/10 text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}><Icon className="w-5 h-5" /></div>
              <p className="text-2xl font-display font-extrabold text-foreground">{stat.value}</p>
              <p className="text-xs text-foreground/40 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-3xl border border-border p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(value, name) => name === "revenue" ? [`Rs ${value}`, "Revenue"] : [value, "Orders"]} />
              <Bar dataKey="orders" fill="hsl(13, 100%, 50%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Order Status</h2>
          {statusData.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-16">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.name}: ${entry.value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Popular Products</h2>
        {popularProducts.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No sales data yet.</p>
        ) : (
          <div className="space-y-3">
            {popularProducts.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-saffron/10 text-saffron text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-sm font-semibold text-foreground truncate">{name}</span>
                <span className="text-sm font-bold text-saffron">{count} sold</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}