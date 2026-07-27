import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Download, FileText, TrendingUp, Package, DollarSign } from "lucide-react";
import { exportCSV } from "@/lib/merchantWallet";

const ranges = [
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 90 Days" },
  { id: "all", label: "All Time" },
];

export default function MerchantReports({ storeId, storeName }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try {
      const [o, p] = await Promise.all([
        base44.entities.Order.filter({ store_id: storeId }, "-created_date", 500).catch(() => []),
        base44.entities.Product.filter({ store_id: storeId }, "-created_date", 200).catch(() => []),
      ]);
      setOrders(o);
      setProducts(p);
    } catch {}
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 9999;
  const cutoff = new Date(now.getTime() - days * 86400000);
  const filteredOrders = orders.filter(o => new Date(o.created_date) >= cutoff);
  const delivered = filteredOrders.filter(o => o.status === "delivered");
  const cancelled = filteredOrders.filter(o => o.status === "cancelled" || o.status === "rejected");
  const totalRevenue = delivered.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalDeliveryFees = delivered.reduce((s, o) => s + (o.delivery_fee || 0), 0);
  const avgOrderValue = delivered.length > 0 ? Math.round(totalRevenue / delivered.length) : 0;
  const commission = Math.round(totalRevenue * 0.1);
  const netEarnings = totalRevenue - commission;

  const productSales = {};
  delivered.forEach(o => {
    try {
      const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          const name = item.name || item.product_name || "Unknown";
          if (!productSales[name]) productSales[name] = { qty: 0, revenue: 0 };
          productSales[name].qty += item.quantity || 1;
          productSales[name].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    } catch {
      const itemText = o.items || "";
      const parts = itemText.split(", ");
      parts.forEach(part => {
        const match = part.match(/(\d+)x\s+(.+)/);
        if (match) {
          const name = match[2];
          if (!productSales[name]) productSales[name] = { qty: 0, revenue: 0 };
          productSales[name].qty += parseInt(match[1]);
        }
      });
    }
  });
  const topProducts = Object.entries(productSales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);

  const exportSalesReport = () => {
    const rows = [["Order Number", "Customer", "Date", "Status", "Total", "Delivery Fee", "Payment Method"], ...filteredOrders.map(o => [o.order_number, o.customer_name, new Date(o.created_date).toLocaleString(), o.status, o.total_amount, o.delivery_fee, o.payment_method])];
    exportCSV(rows, "sales_report_" + range + ".csv");
    toast({ title: "Sales report exported!" });
  };

  const exportProductReport = () => {
    const rows = [["Product Name", "Quantity Sold", "Revenue (Rs)"], ...topProducts.map(([name, data]) => [name, data.qty, data.revenue])];
    exportCSV(rows, "product_report.csv");
    toast({ title: "Product report exported!" });
  };

  const exportFinancialReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue", "Rs " + totalRevenue],
      ["Platform Commission (10%)", "Rs " + commission],
      ["Net Earnings", "Rs " + netEarnings],
      ["Delivery Fees Collected", "Rs " + totalDeliveryFees],
      ["Total Orders", filteredOrders.length],
      ["Delivered Orders", delivered.length],
      ["Cancelled Orders", cancelled.length],
      ["Average Order Value", "Rs " + avgOrderValue],
    ];
    exportCSV(rows, "financial_report_" + range + ".csv");
    toast({ title: "Financial report exported!" });
  };

  const stats = [
    { label: "Total Revenue", value: "Rs " + totalRevenue.toLocaleString(), icon: DollarSign, color: "bg-saffron/10 text-saffron" },
    { label: "Net Earnings", value: "Rs " + netEarnings.toLocaleString(), icon: TrendingUp, color: "bg-terai/10 text-terai" },
    { label: "Commission (10%)", value: "Rs " + commission.toLocaleString(), icon: DollarSign, color: "bg-red-500/10 text-red-500" },
    { label: "Avg Order Value", value: "Rs " + avgOrderValue.toLocaleString(), icon: TrendingUp, color: "bg-blue-500/10 text-blue-500" },
    { label: "Delivered Orders", value: delivered.length, icon: Package, color: "bg-terai/10 text-terai" },
    { label: "Cancelled", value: cancelled.length, icon: Package, color: "bg-red-500/10 text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto no-scrollbar">
        {ranges.map(r => <button key={r.id} onClick={() => setRange(r.id)} className={"flex-1 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap " + (range === r.id ? "bg-background text-saffron shadow-sm" : "text-foreground/50")}>{r.label}</button>)}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
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

      <div className="grid sm:grid-cols-3 gap-4">
        <button onClick={exportSalesReport} className="bg-card rounded-2xl border border-border p-4 hover:border-saffron/30 transition-colors text-left">
          <FileText className="w-5 h-5 text-saffron mb-2" />
          <p className="font-bold text-sm text-foreground">Sales Report</p>
          <p className="text-xs text-foreground/40">Order details, revenue, status</p>
          <span className="text-xs text-saffron font-bold flex items-center gap-1 mt-2"><Download className="w-3 h-3" /> Export CSV</span>
        </button>
        <button onClick={exportProductReport} className="bg-card rounded-2xl border border-border p-4 hover:border-saffron/30 transition-colors text-left">
          <Package className="w-5 h-5 text-saffron mb-2" />
          <p className="font-bold text-sm text-foreground">Product Report</p>
          <p className="text-xs text-foreground/40">Top sellers, inventory movement</p>
          <span className="text-xs text-saffron font-bold flex items-center gap-1 mt-2"><Download className="w-3 h-3" /> Export CSV</span>
        </button>
        <button onClick={exportFinancialReport} className="bg-card rounded-2xl border border-border p-4 hover:border-saffron/30 transition-colors text-left">
          <DollarSign className="w-5 h-5 text-saffron mb-2" />
          <p className="font-bold text-sm text-foreground">Financial Report</p>
          <p className="text-xs text-foreground/40">Commission, payments, net earnings</p>
          <span className="text-xs text-saffron font-bold flex items-center gap-1 mt-2"><Download className="w-3 h-3" /> Export CSV</span>
        </button>
      </div>

      {topProducts.length > 0 && (
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">Top Products</h3>
          <div className="space-y-2">
            {topProducts.map(([name, data], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-saffron/10 text-saffron text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-sm font-semibold text-foreground truncate">{name}</span>
                <span className="text-sm font-bold text-saffron">{data.qty} sold</span>
                <span className="text-xs text-foreground/40">Rs {data.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}