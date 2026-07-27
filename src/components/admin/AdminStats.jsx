import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Bike, Store, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { base44 } from "@/api/base44Client";

export default function AdminStats() {
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [riders, setRiders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Order.list("-created_date", 50).catch(() => []),
      base44.entities.Store.list("-rating", 50).catch(() => []),
      base44.entities.Rider.list("-created_date", 50).catch(() => []),
      base44.entities.Product.list("-created_date", 50).catch(() => []),
    ]).then(([o, s, r, p]) => {
      setOrders(o); setStores(s); setRiders(r); setProducts(p);
    }).finally(() => setLoading(false));
  }, []);

  const todayRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const activeRiders = riders.filter((r) => r.status === "available" || r.status === "on_delivery").length;
  const activeStores = stores.filter((s) => s.is_open).length;

  const stats = [
    { label: "Today's Revenue", value: `Rs ${todayRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-saffron/10 text-saffron" },
    { label: "Today's Orders", value: orders.length, icon: ShoppingBag, color: "bg-terai/10 text-terai" },
    { label: "Active Riders", value: activeRiders, icon: Bike, color: "bg-blue-50 text-blue-500" },
    { label: "Active Merchants", value: activeStores, icon: Store, color: "bg-amber-50 text-amber-500" },
  ];

  const monthlyData = [
    { month: "Jan", sales: 45000 }, { month: "Feb", sales: 52000 },
    { month: "Mar", sales: 48000 }, { month: "Apr", sales: 61000 },
    { month: "May", sales: 55000 }, { month: "Jun", sales: 67000 },
    { month: "Jul", sales: todayRevenue || 72000 },
  ];

  const storeOrderCount = {};
  orders.forEach((o) => { const n = o.store_name || "Unknown"; storeOrderCount[n] = (storeOrderCount[n] || 0) + 1; });
  const topStores = Object.entries(storeOrderCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topProducts = products.filter((p) => p.is_bestseller || p.is_popular).slice(0, 5);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-display font-extrabold text-foreground">{stat.value}</p>
              <p className="text-xs text-foreground/40 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-3xl border border-border p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Monthly Sales</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} formatter={(value) => [`Rs ${value.toLocaleString()}`, "Sales"]} />
              <Bar dataKey="sales" fill="hsl(13, 100%, 50%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Top Selling Stores</h2>
          {topStores.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-8">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {topStores.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-saffron/10 text-saffron text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-foreground truncate">{name}</span>
                  <span className="text-sm font-bold text-saffron">{count} orders</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Top Selling Products</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No data yet.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {topProducts.map((product) => (
              <div key={product.id} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-2 overflow-hidden">
                  {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                </div>
                <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                <p className="text-xs text-saffron font-bold">Rs {product.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}