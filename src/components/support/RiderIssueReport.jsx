import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, Flag, X } from "lucide-react";
import { createRiderIssue } from "@/lib/support";

const issueTypes = [
  { id: "wrong_address", label: "Wrong Address" },
  { id: "customer_unavailable", label: "Customer Unavailable" },
  { id: "merchant_delay", label: "Merchant Delay" },
  { id: "app_issue", label: "App Issue" },
  { id: "payment_issue", label: "Payment Issue" },
  { id: "other", label: "Other" },
];

export default function RiderIssueReport({ order, onClose, onCreated }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issueType, setIssueType] = useState("wrong_address");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40";

  const handleSubmit = async () => {
    if (!description.trim()) { toast({ title: "Description required", variant: "destructive" }); return; }
    setSending(true);
    const result = await createRiderIssue(user, order, issueType, description);
    if (result.success) {
      toast({ title: "Issue reported!", description: "Support team has been notified." });
      onCreated();
    } else {
      toast({ title: result.error || "Failed", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Flag className="w-5 h-5 text-saffron" /> Report Problem</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        {order && <div className="p-3 rounded-xl bg-muted/50 mb-3"><p className="text-xs text-foreground/40">Order</p><p className="text-sm font-bold text-foreground">{order.order_number}</p></div>}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Issue Type</label>
            <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className={inputClass}>
              {issueTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="Describe the problem..." />
          </div>
          <button onClick={handleSubmit} disabled={sending} className="w-full h-11 rounded-xl bg-saffron text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Report Issue</>}
          </button>
        </div>
      </div>
    </div>
  );
}