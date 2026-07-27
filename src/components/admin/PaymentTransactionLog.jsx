import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import { exportCSV } from "@/lib/merchantWallet";

const types = ["payment", "refund", "payout", "commission", "settlement", "earning", "withdrawal"];
const statuses = ["pending", "completed", "failed", "cancelled"];

export default function PaymentTransactionLog() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.Transaction.list("-created_date", 200);
      setTransactions(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const filtered = transactions.filter(t => {
    if (search && !t.transaction_id?.toLowerCase().includes(search.toLowerCase()) && !t.user_name?.toLowerCase().includes(search.toLowerCase()) && !t.order_number?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  const handleExport = () => {
    const rows = [["Transaction ID", "User", "Type", "Amount", "Status", "Order", "Description", "Date"], ...filtered.map(t => [t.transaction_id, t.user_name, t.type, t.amount, t.status, t.order_number, t.description, new Date(t.created_date).toLocaleString()])];
    exportCSV(rows, "transaction_log.csv");
  };

  const typeColors = { payment: "bg-saffron/10 text-saffron", refund: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", payout: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", commission: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400", settlement: "bg-terai/10 text-terai", earning: "bg-cyan-50 text-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-400", withdrawal: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" };
  const statusColors = { pending: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", completed: "bg-terai/10 text-terai", failed: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", cancelled: "bg-muted text-foreground/40" };
  const isCredit = (type) => type === "payment" || type === "settlement" || type === "earning";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by transaction ID, user, or order..." className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleExport} className="px-4 h-10 rounded-xl bg-card border border-border text-xs font-bold text-saffron hover:bg-saffron/5 flex items-center gap-1"><Download className="w-3 h-3" /> Export</button>
      </div>

      <p className="text-xs text-foreground/40">{filtered.length} transactions</p>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><Search className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No transactions found.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map(t => (
            <div key={t.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center " + (typeColors[t.type] || "bg-muted")}>
                {isCredit(t.type) ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground truncate">{t.description || t.type}</p>
                  <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (typeColors[t.type] || "bg-muted")}>{t.type}</span>
                </div>
                <p className="text-xs text-foreground/40 truncate">{t.user_name} · {t.order_number || "—"} · {new Date(t.created_date).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={"text-sm font-bold " + (isCredit(t.type) ? "text-terai" : "text-saffron")}>{isCredit(t.type) ? "+" : "-"} Rs {t.amount?.toLocaleString()}</p>
                <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (statusColors[t.status] || "bg-muted")}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}