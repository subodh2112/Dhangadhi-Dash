import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, ArrowDownRight, ArrowUpRight, Receipt } from "lucide-react";

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const data = await base44.entities.Transaction.filter({ user_id: user.id }, "-created_date", 100);
      setTransactions(data);
    } catch {}
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const filtered = filter ? transactions.filter(t => t.type === filter) : transactions;
  const isCredit = (type) => type === "payment" || type === "settlement" || type === "earning";
  const typeColors = { payment: "bg-saffron/10 text-saffron", refund: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", payout: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", settlement: "bg-terai/10 text-terai", earning: "bg-cyan-50 text-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-400", withdrawal: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {["", "payment", "refund", "settlement", "earning", "withdrawal"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={"px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap " + (filter === f ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>{f || "All"}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><Receipt className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No transactions yet.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center " + (typeColors[t.type] || "bg-muted")}>
                {isCredit(t.type) ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{t.description || t.type}</p>
                <p className="text-xs text-foreground/40">{new Date(t.created_date).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={"text-sm font-bold " + (isCredit(t.type) ? "text-terai" : "text-saffron")}>{isCredit(t.type) ? "+" : "-"} Rs {t.amount?.toLocaleString()}</p>
                <span className="text-[9px] text-foreground/30 capitalize">{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}