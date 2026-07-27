import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wallet, ShoppingBag, TrendingUp, Package, Loader2, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";

export default function MerchantOverview({ storeId, storeName, merchantId }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!storeId) { setLoading(false); return; }
      try {
        const [o, p] = await Promise.all([
          base44.entities.Order.filter({ store_id: storeId }, "-created_date", 200).catch(() => []),
          base44.entities.Product.filter({ store_id: storeId }, "-created_date", 200).catch(() => []),
        ]);
        setOrders(o);
        setProducts(p);
      } catch {}
      setLoading(false);
    };
    load();
  }, [storeId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_date).toDateString() === todayStr);
  const todayDelivered = todayOrders.filter((o) => o.status === "delivered");
  const todayEarnings = todayDelivered.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const activeOrders = orders.filter((o) => !["delivered", "cancelled", "rejected"].includes(o.status));

  // Parse items from today's orders to find top products
  const productSales = {};
  todayOrders.forEach((order) => {
    if (!order.items) return;
    try {
      let items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        const name = item.name || item.product_name || item.title;
        const qty = item.qty || item.quantity || 1;
        if (name) {
          if (!productSales[name]) productSales[name] = { count: 0, revenue: 0 };
          productSales[name].count += qty;
          productSales[name].revenue += (item.price || 0) * qty;
        }
      });
    } catch {}
  });

  const topProducts = Object.entries(productSales).sort(([, a], [, b]) => b.count - a.count).slice(0, 5);
  const totalProductCount = products.length;
  const lowStockCount = products.filter((p) => (p.stock || 0) <= (p.low_stock_threshold || 5) && p.is_available !== false).length;

  const stats = [
    { label: "Today's Earnings", value: "Rs " + todayEarnings.toLocaleString(), sub: todayDelivered.length + " delivered", icon: Wallet, color: "bg-saffron/10 text-saffron", gradient: "from-saffron to-saffron/80" },
    { label: "Today's Orders", value: todayOrders.length, sub: activeOrders.length + " active now", icon: ShoppingBag, color: "bg-terai/10 text-terai" },
    { label: "Avg Order Value", value: "Rs " + (todayOrders.length > 0 ? Math.round(todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0) / todayOrders.length) : 0), sub: "per order today", icon: TrendingUp, color: "bg-blue-500/10 text-blue-500" },
    { label: "Total Products", value: totalProductCount, sub: lowStockCount + " low stock", icon: Package, color: "bg-purple-500/10 text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero earnings card */}
      <div className="bg-gradient-to-br from-saffron to-saffron/80 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">Today's Earnings</p>
            <p className="text-4xl font-display font-extrabold">Rs {todayEarnings.toLocaleString()}</p>
            <p className="text-white/60 text-xs mt-1">{todayDelivered.length} delivered · {todayOrders.length} total orders today</p>
          </div>
          <Wallet className="w-12 h-12 text-white/30" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
              <div className={"w-10 h-10 rounded-xl flex items-center justify-center mb-3 " + stat.color}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-display font-extrabold text-foreground">{stat.value}</p>
              <p className="text-xs text-foreground/40 font-medium">{stat.label}</p>
              <p className="text-[10px] text-foreground/30 mt-0.5">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Two-column: Top Products + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products Today */}
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-saffron" /> Top Products Today
          </h3>
          {topProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-foreground/40">No product sales yet today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map(([name, data], i) => {
                const product = products.find((p) => p.name === name);
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 " + (i === 0 ? "bg-saffron/10 text-saffron" : "bg-muted text-foreground/50")}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                      <p className="text-xs text-foreground/40">{data.count} sold · Rs {data.revenue.toLocaleString()}</p>
                    </div>
                    {product?.image_url && (
                      <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders Today */}
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-saffron" /> Recent Orders
          </h3>
          {todayOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-foreground/40">No orders yet today.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {todayOrders.slice(0, 8).map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " + (order.status === "delivered" ? "bg-terai/10 text-terai" : order.status === "cancelled" ? "bg-red-500/10 text-red-500" : "bg-saffron/10 text-saffron")}>
                    {order.status === "delivered" ? <CheckCircle2 className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{order.order_number}</p>
                    <p className="text-xs text-foreground/40 truncate">{order.customer_name || "Customer"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">Rs {(order.total_amount || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-foreground/30 capitalize">{order.status.replace(/_/g, " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}