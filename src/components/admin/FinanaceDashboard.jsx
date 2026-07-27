import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, DollarSign, TrendingUp, Wallet, Banknote, CreditCard, XCircle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { exportCSV } from "@/lib/merchantWallet";

const ranges = [{ id: "daily", label: "Today" }, { id: "weekly", label: "This Week" }, { id: "monthly", label: "This Month" }, { id: "yearly", label: "This Year" }];

export default function FinanceDashboard() {
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [riderEarnings, setRiderEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("monthly");

  const load = useCallback(async () => {
    try {
      const [p, t, s, e] = await Promise.all([
        base44.entities.Payment.list("-created_date", 500).catch(() => []),
        base44.entities.Transaction.list("-created_date", 500).catch(() => []),
        base44.entities.MerchantSettlement.list("-created_date", 200).catch(() => []),
        base44.entities.RiderEarning.list("-created_date", 200).catch(() => []),
      ]);
      setPayments(p); setTransactions(t); setSettlements(s); setRiderEarnings(e);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const now = new Date();
  const startMap = { daily: new Date(now.getFullYear(), now.getMonth(), now.getDate()), weekly: new Date(now.getTime() - 7 * 86400000), monthly: new Date(now.getFullYear(), now.getMonth(), 1), yearly: new Date(now.getFullYear(), 0, 1) };
  const cutoff = startMap[range];
  const rangePayments = payments.filter(p => new Date(p.payment_date || p.created_date) >= cutoff);
  const rangeTransactions = transactions.filter(t => new Date(t.created_date) >= cutoff);

  const successful = rangePayments.filter(p => p.payment_status === "successful");
  const failed = rangePayments.filter(p => p.payment_status === "failed");
  const codPayments = rangePayments.filter(p => p.payment_method === "cod");
  const onlinePayments = rangePayments.filter(p => p.payment_method !== "cod" && p.payment_method !== "wallet");

  const totalSales = successful.reduce((s, p) => s + (p.amount || 0), 0);
  const platformCommission = settlements.filter(s => new Date(s.created_date) >= cutoff).reduce((s, x) => s + (x.commission_amount || 0), 0);
  const merchantPayouts = settlements.filter(s => s.settlement_status === "settled" && new Date(s.created_date) >= cutoff).reduce((s, x) => s + (x.net_amount || 0), 0);
  const riderPayouts = riderEarnings.filter(e => new Date(e.created_date) >= cutoff).reduce((s, e) => s + (e.total_amount || 0), 0);
  const codCollected = codPayments.filter(p => p.payment_status === "successful").reduce((s, p) => s + (p.amount || 0), 0);
  const onlineCollected = onlinePayments.filter(p => p.payment_status === "successful").reduce((s, p) => s + (p.amount || 0), 0);

  const revenueStats = [
    { label: "Total Sales", value: "Rs " + totalSales.toLocaleString(), icon: DollarSign, color: "bg-saffron/10 text-saffron" },
    { label: "Platform Commission", value: "Rs " + platformCommission.toLocaleString(), icon: TrendingUp, color: "bg-purple-500/10 text-purple-500" },
    { label: "Merchant Payouts", value: "Rs " + merchantPayouts.toLocaleString(), icon: Wallet, color: "bg-terai/10 text-terai" },
    { label: "Rider Payouts", value: "Rs " + riderPayouts.toLocaleString(), icon: Banknote, color: "bg-blue-500/10 text-blue-500" },
  ];

  const paymentStats = [
    { label: "Online Payments", value: onlinePayments.length, sub: "Rs " + onlineCollected.toLocaleString(), icon: CreditCard, color: "bg-saffron/10 text-saffron" },
    { label: "COD Payments", value: codPayments.length, sub: "Rs " + codCollected.toLocaleString(), icon: Banknote, color: "bg-terai/10 text-terai" },
    { label: "Failed Payments", value: failed.length, sub: "Rs " + failed.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString(), icon: XCircle, color: "bg-red-500/10 text-red-500" },
    { label: "Total Transactions", value: rangeTransactions.length, sub: "All types", icon: BarChart3, color: "bg-blue-500/10 text-blue-500" },
  ];

  const pieData = [
    { name: "Online", value: onlineCollected, color: "hsl(13, 100%, 50%)" },
    { name: "COD", value: codCollected, color: "hsl(149, 100%, 27%)" },
    { name: "Failed", value: failed.reduce((s, p) => s + (p.amount || 0), 0), color: "hsl(0, 84%, 60%)" },
  ].filter(d => d.value > 0);

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dayPayments = successful.filter(p => new Date(p.payment_date || p.created_date).toDateString() === d.toDateString());
    last7Days.push({ day: d.toLocaleDateString("en", { weekday: "short" }), revenue: dayPayments.reduce((s, p) => s + (p.amount || 0), 0), count: dayPayments.length });
  }

  const handleExport = () => {
    const rows = [["Payment ID", "Order Number", "Customer", "Amount", "Method", "Status", "Date"], ...rangePayments.map(p => [p.payment_id, p.order_number, p.customer_name, p.amount, p.payment_method, p.payment_status, new Date(p.payment_date || p.created_date).toLocaleString()])];
    exportCSV(rows, "finance_report_" + range + ".csv");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {ranges.map(r => <button key={r.id} onClick={() => setRange(r.id)} className={"px-4 py-2 rounded-lg text-xs font-bold " + (range === r.id ? "bg-background text-saffron shadow-sm" : "text-foreground/50")}>{r.label}</button>)}
        </div>
        <button onClick={handleExport} className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold text-saffron hover:bg-saffron/5">Export CSV</button>
      </div>

      <div>
        <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3 text-saffron">Revenue</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {revenueStats.map(s => {
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
      </div>

      <div>
        <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-3 text-blue-500">Payments</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {paymentStats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
                <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><Icon className="w-4 h-4" /></div>
                <p className="text-lg font-display font-extrabold text-foreground">{s.value}</p>
                <p className="text-xs text-foreground/40">{s.label}</p>
                <p className="text-[10px] text-foreground/30 mt-1">{s.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v) => ["Rs " + v, "Revenue"]} />
              <Bar dataKey="revenue" fill="hsl(13, 100%, 50%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">Payment Distribution</h3>
          {pieData.length === 0 ? <p className="text-sm text-foreground/40 text-center py-16">No data.</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name + ": Rs " + e.value}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v) => "Rs " + v} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}