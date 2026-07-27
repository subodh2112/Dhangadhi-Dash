import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import MobileBackButton from "@/components/MobileBackButton";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, TrendingUp, DollarSign, Clock, ArrowDownToLine, Building2, Loader2, ArrowUpRight, ArrowDownRight, ChevronLeft } from "lucide-react";
import { getOrCreateWallet } from "@/lib/merchantWallet";
import WithdrawalDialog from "@/components/merchant/WithdrawalDialog";

export default function MerchantWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [orders, setOrders] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const merchantId = user?.id;
  const storeId = user?.store_id;

  const load = useCallback(async () => {
    if (!merchantId) { setLoading(false); return; }
    try {
      // Fetch store name
      let sName = null;
      if (storeId) {
        try { const store = await base44.entities.Store.get(storeId); sName = store?.name; } catch {}
      }
      const w = await getOrCreateWallet(merchantId, storeId, sName);
      setWallet(w);
      const [o, wd] = await Promise.all([
        base44.entities.Order.filter({ store_id: storeId }, "-created_date", 100).catch(() => []),
        base44.entities.MerchantWithdrawal.filter({ merchant_id: merchantId }, "-created_date", 50).catch(() => []),
      ]);
      setOrders(o);
      setWithdrawals(wd);
    } catch {}
    setLoading(false);
  }, [merchantId, storeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>
        <Footer />
      </div>
    );
  }

  const available = wallet?.available_balance || 0;
  const totalSales = wallet?.total_sales || 0;
  const withdrawn = wallet?.withdrawn_amount || 0;
  const commission = wallet?.commission_amount || 0;
  const netEarnings = totalSales - commission;

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending" || w.status === "approved");
  const pendingPayouts = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

  // Build combined transaction history (credits from delivered orders + debits from withdrawals)
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const credits = deliveredOrders.map((o) => ({
    id: o.id,
    type: "credit",
    title: "Order Earnings",
    subtitle: o.order_number + " · " + (o.customer_name || "Customer"),
    amount: (o.total_amount || 0) - Math.round((o.total_amount || 0) * (wallet?.commission_rate || 0.1)),
    date: o.delivered_time || o.created_date,
    status: "completed",
  }));
  const debits = withdrawals.map((w) => ({
    id: w.id,
    type: "debit",
    title: "Withdrawal Request",
    subtitle: (w.payment_method || "bank_transfer").replace(/_/g, " "),
    amount: w.amount || 0,
    date: w.requested_date,
    status: w.status,
  }));
  const transactions = [...credits, ...debits]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 40);

  const stats = [
    { label: "Available Balance", value: "Rs " + available.toLocaleString(), icon: Wallet, color: "bg-saffron/10 text-saffron" },
    { label: "Total Earnings", value: "Rs " + netEarnings.toLocaleString(), icon: TrendingUp, color: "bg-terai/10 text-terai" },
    { label: "Pending Payouts", value: "Rs " + pendingPayouts.toLocaleString(), icon: Clock, color: "bg-amber-500/10 text-amber-500" },
    { label: "Total Withdrawn", value: "Rs " + withdrawn.toLocaleString(), icon: DollarSign, color: "bg-blue-500/10 text-blue-500" },
  ];

  const statusColors = {
    completed: "bg-terai/10 text-terai",
    pending: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    approved: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    paid: "bg-terai/10 text-terai",
    rejected: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <MobileBackButton />
          <PageHero
            icon={Wallet}
            title="Merchant Wallet"
            subtitle="Track your earnings, pending payouts, and withdrawal history."
          />

          <div className="mt-6 space-y-6">
            {/* Balance card with withdraw button */}
            <div className="bg-gradient-to-br from-saffron to-saffron/80 rounded-3xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Available Balance</p>
                  <p className="text-4xl font-display font-extrabold">Rs {available.toLocaleString()}</p>
                  <p className="text-white/60 text-xs mt-1">Net earnings: Rs {netEarnings.toLocaleString()} · Commission: Rs {commission.toLocaleString()}</p>
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
                className="mt-4 w-full h-12 rounded-xl bg-white text-saffron font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4" /> {wallet?.bank_linked ? "Withdraw Funds" : "Link Bank & Withdraw"}
              </button>
            </div>

            {/* Stats grid */}
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

            {/* Pending payouts detail */}
            {pendingWithdrawals.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Pending Payouts ({pendingWithdrawals.length})</h3>
                <div className="space-y-2">
                  {pendingWithdrawals.map((w) => (
                    <div key={w.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/5">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">Rs {w.amount?.toLocaleString()}</p>
                        <p className="text-xs text-foreground/40">{w.payment_method?.replace(/_/g, " ")} · {new Date(w.requested_date).toLocaleDateString()}</p>
                      </div>
                      <span className={"text-[10px] font-bold px-2 py-1 rounded-full capitalize " + (statusColors[w.status] || "bg-muted")}>{w.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction history */}
            <div className="bg-card rounded-3xl border border-border p-6">
              <h3 className="font-display font-bold text-lg text-foreground mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <p className="text-sm text-foreground/40 text-center py-8">No transactions yet. Your earnings and withdrawals will appear here.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((t) => (
                    <div key={t.type + "-" + t.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className={"w-9 h-9 rounded-lg flex items-center justify-center shrink-0 " + (t.type === "credit" ? "bg-terai/10 text-terai" : "bg-saffron/10 text-saffron")}>
                        {t.type === "credit" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">{t.title}</p>
                        <p className="text-xs text-foreground/40 truncate">{t.subtitle} · {new Date(t.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={"font-bold text-sm " + (t.type === "credit" ? "text-terai" : "text-foreground")}>{t.type === "credit" ? "+" : "-"}Rs {t.amount?.toLocaleString()}</p>
                        <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize " + (statusColors[t.status] || "bg-muted")}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center">
              <Link to="/merchant" className="inline-flex items-center gap-1.5 text-sm font-bold text-saffron hover:underline">
                <ChevronLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WithdrawalDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        wallet={wallet}
        merchantId={merchantId}
        storeId={storeId}
        storeName={wallet?.store_name}
        onCompleted={load}
      />
    </div>
  );
}