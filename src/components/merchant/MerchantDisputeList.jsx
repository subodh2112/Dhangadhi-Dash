import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import MerchantDisputeForm from "@/components/support/MerchantDisputeForm";

const statusColors = {
  filed: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  under_review: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  resolved: "bg-terai/10 text-terai",
  rejected: "bg-muted text-foreground/40",
};

export default function MerchantDisputeList({ merchantId }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!merchantId) { setLoading(false); return; }
    try {
      const data = await base44.entities.MerchantDispute.filter({ merchant_id: merchantId }, "-created_date", 50);
      setDisputes(data);
    } catch {}
    setLoading(false);
  }, [merchantId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(true)} className="w-full p-3 rounded-2xl border border-dashed border-saffron/40 text-sm text-saffron font-bold flex items-center justify-center gap-1.5 hover:bg-saffron/5"><Plus className="w-4 h-4" /> File New Dispute</button>

      {disputes.length === 0 ? (
        <div className="text-center py-8"><AlertCircle className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No disputes filed yet.</p></div>
      ) : (
        <div className="space-y-2">
          {disputes.map(d => (
            <div key={d.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm text-foreground capitalize">{d.dispute_type?.replace(/_/g, " ")}</p>
                <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full capitalize " + (statusColors[d.status] || "bg-muted")}>{d.status?.replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-foreground/50 line-clamp-2">{d.description}</p>
              <div className="flex items-center gap-2 mt-1">
                {d.order_number && <span className="text-[10px] text-foreground/40">{d.order_number}</span>}
                <span className="text-[10px] text-foreground/30">{new Date(d.created_date).toLocaleDateString()}</span>
              </div>
              {d.resolution && <div className="mt-2 p-2 rounded-lg bg-terai/5"><p className="text-xs text-terai"><strong>Resolution:</strong> {d.resolution}</p></div>}
            </div>
          ))}
        </div>
      )}

      {showForm && <MerchantDisputeForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />}
    </div>
  );
}