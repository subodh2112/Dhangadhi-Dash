import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PullToRefresh from "@/components/PullToRefresh";
import { getOrCreateWallet, requestWithdrawal } from "@/lib/riderWallet";
import { Wallet, TrendingUp, Star, Package, ChevronLeft, Loader2, ArrowDownToLine, Check, X, Clock, Banknote, Smartphone } from "lucide-react";

const paymentMethods = [
  { value: "bank_transfer", label: "Bank Transfer", icon: Banknote },
  { value: "esewa", label: "eSewa", icon: Smartphone },
  { value: "khalti", label: "Khalti", icon: Smartphone },
  { value: "cash", label: "Cash Pickup", icon: Banknote },
];

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", icon: Clock },
  approved: { label: "Approved", color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", icon: Check },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", icon: X },
  paid: { label: "Paid", color: "bg-terai/10 text-terai", icon: Check },
};

export default function RiderWalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [orders, setOrders] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: "", payment_method: "bank_transfer", account_details: "" });

  const loadData = async () => {
    try {
      const [walletData, allOrders, allWithdrawals] = await Promise.all([
        getOrCreateWallet(user?.id, user?.full_name).catch(() => null),
        base44.entities.Order.list("-created_date", 200).catch(() => []),
        base44.entities.Withdrawal.filter({ rider_id: user?.id }).catch(() => []),
      ]);
      setWallet(walletData);
      setOrders(allOrders);
      setWithdrawals(allWithdrawals.sort((a, b) => new Date(b.requested_date || b.created_date) - new Date(a.requested_date || a.created_date)));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const myCompleted = orders.filter((o) => (o.rider_id === user?.id || o.rider_name === user?.full_name) && o.status === "delivered");
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 86400000;
  const monthStart = todayStart - 30 * 86400000;
  const getOrderTime = (o) => new Date(o.created_date || o.updated_date || Date.now()).getTime();

  const earningsToday = myCompleted.filter((o) => getOrderTime(o) >= todayStart).reduce((s, o) => s + (o.delivery_fee || 40) + (o.rider_tip || 0), 0);
  const earningsWeek = myCompleted.filter((o) => getOrderTime(o) >= weekStart).reduce((s, o) => s + (o.delivery_fee || 40) + (o.rider_tip || 0), 0);
  const earningsMonth = myCompleted.filter((o) => getOrderTime(o) >= monthStart).reduce((s, o) => s + (o.delivery_fee || 40) + (o.rider_tip || 0), 0);
  const completedToday = myCompleted.filter((o) => getOrderTime(o) >= todayStart).length;
  const pendingWithdrawal = withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + w.amount, 0);

  const stats = [
    { label: "Today's Earnings", value: "Rs " + earningsToday, icon: TrendingUp, color: "bg-saffron/10 text-saffron" },
    { label: "Completed", value: completedToday + " today", icon: Package, color: "bg-terai/10 text-terai" },
    { label: "Avg Rating", value: (myCompleted.length > 0 ? (myCompleted.reduce((s, o) => s + (o.rider_rating || 0), 0) / myCompleted.length).toFixed(1) : "—"), icon: Star, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Pending Withdrawal", value: "Rs " + pendingWithdrawal, icon: Clock, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  ];

  const handleSubmit = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount < 500) { toast({ title: "Minimum withdrawal is Rs 500", variant: "destructive" }); return; }
    if (!form.account_details.trim()) { toast({ title: "Please provide account details", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      await requestWithdrawal(user.id, user.full_name, amount, form.payment_method, form.account_details);
      toast({ title: "Withdrawal requested!", description: "Your request is pending approval." });
      setShowForm(false);
      setForm({ amount: "", payment_method: "bank_transfer", account_details: "" });
      loadData();
    } catch (e) { toast({ title: e.message || "Failed to request withdrawal", variant: "destructive" }); }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div><Footer /></div>
  );

  const inputClass = "w-full h-11 px-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <PullToRefresh onRefresh={loadData}>
        <div className="mx-auto max-w-3xl">
          <Link to="/rider" className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-saffron mb-4"><ChevronLeft className="w-4 h-4" /> Back to Dashboard</Link>

          <div className="bg-gradient-to-br from-carbon to-saffron/20 rounded-3xl p-6 mb-6 text-white">
            <p className="text-white/60 text-sm font-medium">Available Balance</p>
            <p className="text-4xl font-display font-extrabold mt-1">Rs {wallet?.available_balance || 0}</p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div><p className="text-white/50 text-xs">Total Earned</p><p className="text-lg font-bold">Rs {wallet?.total_earnings || 0}</p></div>
              <div><p className="text-white/50 text-xs">Withdrawn</p><p className="text-lg font-bold">Rs {wallet?.withdrawn_amount || 0}</p></div>
              <div><p className="text-white/50 text-xs">Pending</p><p className="text-lg font-bold">Rs {wallet?.pending_amount || 0}</p></div>
            </div>
            <Button className="w-full mt-6 bg-saffron hover:bg-saffron/90 h-12" onClick={() => setShowForm(!showForm)} disabled={(wallet?.available_balance || 0) < 500}>
              <ArrowDownToLine className="w-4 h-4" /> Request Withdrawal
            </Button>
            {(wallet?.available_balance || 0) < 500 && <p className="text-white/40 text-xs text-center mt-2">Minimum balance of Rs 500 required</p>}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => { const Icon = stat.icon; return (
              <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
                <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + stat.color}><Icon className="w-4 h-4" /></div>
                <p className="text-xl font-display font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground/40">{stat.label}</p>
              </div>
            ); })}
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-2xl border border-border p-4 text-center"><p className="text-xs text-foreground/40 mb-1">Daily</p><p className="text-lg font-bold text-saffron">Rs {earningsToday}</p></div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center"><p className="text-xs text-foreground/40 mb-1">Weekly</p><p className="text-lg font-bold text-terai">Rs {earningsWeek}</p></div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center"><p className="text-xs text-foreground/40 mb-1">Monthly</p><p className="text-lg font-bold text-blue-500">Rs {earningsMonth}</p></div>
          </div>

          {showForm && (
            <div className="bg-card rounded-3xl border border-border p-6 mb-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Request Withdrawal</h2>
              <div className="space-y-3">
                <div><label className="text-xs text-foreground/50 font-medium">Amount (Rs)</label><input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Minimum Rs 500" /></div>
                <div><label className="text-xs text-foreground/50 font-medium">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((m) => { const Icon = m.icon; return (
                      <button key={m.value} type="button" onClick={() => setForm({ ...form, payment_method: m.value })} className={"flex items-center gap-2 px-3 h-11 rounded-xl border text-sm font-medium transition-colors " + (form.payment_method === m.value ? "border-saffron bg-saffron/5 text-saffron" : "border-border text-foreground/60")}>
                        <Icon className="w-4 h-4" /> {m.label}
                      </button>
                    ); })}
                  </div>
                </div>
                <div><label className="text-xs text-foreground/50 font-medium">Account Details</label><textarea className={inputClass + " h-20 resize-none"} value={form.account_details} onChange={(e) => setForm({ ...form, account_details: e.target.value })} placeholder="Bank account number, eSewa/Khalti ID, or pickup location" /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="flex-1 bg-saffron hover:bg-saffron/90" onClick={handleSubmit} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}</Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-3xl border border-border p-6">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-foreground/40 text-center py-8">No withdrawal requests yet.</p>
            ) : (
              <div className="space-y-2">
                {withdrawals.map((w) => { const sc = statusConfig[w.status] || statusConfig.pending; const SIcon = sc.icon; return (
                  <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className={"w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 " + sc.color}><SIcon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">Rs {w.amount}</p>
                      <p className="text-xs text-foreground/40">{w.payment_method.replace(/_/g, " ")} · {w.requested_date ? new Date(w.requested_date).toLocaleDateString() : "—"}</p>
                    </div>
                    <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold " + sc.color}>{sc.label}</span>
                  </div>
                ); })}
              </div>
            )}
          </div>
        </div>
        </PullToRefresh>
      </main>
      <Footer />
    </div>
  );
}