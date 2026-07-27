import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, ImageIcon, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createMerchantDispute } from "@/lib/support";

const disputeTypes = [
  { id: "incorrect_cancellation", label: "Incorrect Order Cancellation" },
  { id: "payment_mismatch", label: "Payment Mismatch" },
  { id: "customer_complaint", label: "Customer Complaint" },
  { id: "delivery_issue", label: "Delivery Issue" },
  { id: "other", label: "Other" },
];

export default function MerchantDisputeForm({ onClose, onCreated }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ order_id: "", dispute_type: "payment_mismatch", description: "" });
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40";

  useEffect(() => {
    base44.entities.Order.list("-created_date", 10).then(setOrders).catch(() => {});
  }, []);

  const selectedOrder = orders.find(o => o.id === form.order_id);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEvidenceUrl(file_url);
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) { toast({ title: "Description required", variant: "destructive" }); return; }
    setSending(true);
    const result = await createMerchantDispute(user, selectedOrder, form.dispute_type, form.description, evidenceUrl);
    if (result.success) {
      toast({ title: "Dispute filed!", description: "Admin will review your case." });
      onCreated();
    } else {
      toast({ title: result.error || "Failed", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-saffron" /> File a Dispute</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Related Order</label>
            <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} className={inputClass}>
              <option value="">Select order</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} — {o.customer_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Dispute Type</label>
            <select value={form.dispute_type} onChange={(e) => setForm({ ...form, dispute_type: e.target.value })} className={inputClass}>
              {disputeTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass + " resize-none"} placeholder="Describe the dispute..." />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Evidence (optional)</label>
            {evidenceUrl ? (
              <div className="relative">
                <img src={evidenceUrl} alt="evidence" className="w-full h-32 rounded-xl object-cover" />
                <button onClick={() => setEvidenceUrl("")} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs">✕</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-20 rounded-xl border border-dashed border-border cursor-pointer hover:border-saffron/40">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-saffron" /> : <><ImageIcon className="w-4 h-4 text-foreground/40" /><span className="text-sm text-foreground/40">Upload evidence</span></>}
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            )}
          </div>
          <button onClick={handleSubmit} disabled={sending} className="w-full h-11 rounded-xl bg-saffron text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> File Dispute</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}