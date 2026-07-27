import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, TrendingUp, DollarSign, Percent, Loader2, Download, ArrowDownToLine, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getOrCreateWallet } from "@/lib/merchantWallet";
import { exportCSV } from "@/lib/merchantWallet";
import WithdrawalDialog from "@/components/merchant/WithdrawalDialog";

export default function MerchantEarnings({ storeId, storeName, merchantId }) {
  const { toast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [orders, setOrders] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const load = useCallback(async () => {
    if (!merchantId) { setLoading(false); return; }
    try {
      const w = await getOrCreateWallet(merchantId, storeId, storeName);
      setWallet(w);
      const o = await base44.entities.Order.filter({ store_id: storeId }, "-created_date", 200).catch(() => []);
      setOrders(o);
      const wd = await base44.entities.MerchantWithdrawal.filter({ merchant_id: merchantId }, "-created_date", 20).catch(() => []);
      setWithdrawals(wd);
    } catch {}
    setLoading(false);
  }, [merchantId, storeId, storeName]);

  useEffect(() => { load(); }, [load]);

  const handleSyncSheets = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("sync_to_google_sheets", {});
      toast({ title: "Synced to Google Sheets!", description: res.data?.ordersSynced + " orders synced." });
    } catch { toast({ title: "Sync failed (admin only)", variant: "destructive" }); }
    setSyncing(false);
  };

  const handleExport = () => {
    const delivered = orders.filter(o => o.status === "delivered");
    const rows = [["Order Number", "Customer", "Date", "Total", "Status"], ...delivered.map(o => [o.order_number, o.customer_name, new Date(o.created_date).toLocaleDateString(), o.total_amount, o.status])];
    exportCSV(rows, "merchant_earnings.csv");
    toast({ title: "CSV exported!" });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const available = wallet?.available_balance || 0;
  const totalSales = wallet?.total_sales || 0;
  const commission = wallet?.commission_amount || 0;
  const withdrawn = wallet?.withdrawn_amount || 0;
  const netEarnings = totalSales - commission;
  const commissionRate = (wallet?.commission_rate || 0.1) * 100;

  const now = new Date();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dayOrders = orders.filter(o => new Date(o.created_date).toDateString() === d.toDateString() && o.status === "delivered");
    last7Days.push({ day: d.toLocaleDateString("en", { weekday: "short" }), revenue: dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0), orders: dayOrders.length });
  }

  const statusColors = { pending: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", approved: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", paid: "bg-terai/10 text-terai", rejected: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" };

  const stats = [
    { label: "Available Balance", value: "Rs " + available.toLocaleString(), icon: Wallet, color: "bg-saffron/10 text-saffron" },
    { label: "Total Sales", value: "Rs " + totalSales.toLocaleString(), icon: TrendingUp, color: "bg-terai/10 text-terai" },
    { label: "Commission (10%)", value: "Rs " + commission.toLocaleString(), icon: Percent, color: "bg-red-500/10 text-red-500" },
    { label: "Withdrawn", value: "Rs " + withdrawn.toLocaleString(), icon: DollarSign, color: "bg-blue-500/10 text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-saffron to-saffron/80 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">Available Balance</p>
            <p className="text-4xl font-display font-extrabold">Rs {available.toLocaleString()}</p>
            <p className="text-white/60 text-xs mt-1">Commission rate: {commissionRate}% · Net earnings: Rs {netEarnings.toLocaleString()}</p>
          </div>
          <Wallet className="w-12 h-12 text-white/30" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          {wallet?.bank_linked ? (
            <span className="text-xs text-white/70 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {wallet.bank_name} · ****{String(wallet.bank_account_number || "").slice(-4)}</span>
          ) : (
            <span className="text-xs text-white/70">No bank account linked yet</span>
          )}
        </div>
        <button
          onClick={() => setWithdrawOpen(true)}
          disabled={available <= 0 && wallet?.bank_linked}
          className="mt-4 w-full h-12 rounded-xl bg-white text-saffron font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-white/90 transition-colors"
        >
          <ArrowDownToLine className="w-4 h-4" /> {wallet?.bank_linked ? "Withdraw Funds" : "Link Bank & Withdraw"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + stat.color}><Icon className="w-4 h-4" /></div>
              <p className="text-lg font-display font-extrabold text-foreground">{stat.value}</p>
              <p className="text-xs text-foreground/40">{stat.label}</p>
            </div>
          );
        })}
      </div>

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

      <Link to="/merchant/wallet" className="flex items-center justify-center gap-2 h-12 rounded-xl bg-carbon text-white text-sm font-bold hover:bg-carbon/90 transition-colors">
        <Wallet className="w-4 h-4" /> View Full Wallet
      </Link>

      <div className="flex gap-3">
        <button onClick={handleExport} className="flex-1 h-12 rounded-xl border border-border bg-card text-sm font-bold text-foreground hover:bg-muted flex items-center justify-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
        <button onClick={handleSyncSheets} disabled={syncing} className="flex-1 h-12 rounded-xl bg-terai text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Sync to Google Sheets
        </button>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <h3 className="font-display font-bold text-lg text-foreground mb-4">Withdrawal History</h3>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-8">No withdrawals yet.</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">Rs {w.amount?.toLocaleString()}</p>
                  <p className="text-xs text-foreground/40">{w.payment_method?.replace(/_/g, " ")} · {new Date(w.requested_date).toLocaleDateString()}</p>
                </div>
                <span className={"text-[10px] font-bold px-2 py-1 rounded-full capitalize " + (statusColors[w.status] || "bg-muted")}>{w.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <WithdrawalDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        wallet={wallet}
        merchantId={merchantId}
        storeId={storeId}
        storeName={storeName}
        onCompleted={load}
      />
    </div>
  );
}