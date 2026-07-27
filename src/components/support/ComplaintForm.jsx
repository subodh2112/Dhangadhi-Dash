import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, ImageIcon, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createComplaint } from "@/lib/support";

const complaintTypes = [
  { id: "missing_item", label: "Missing Items" },
  { id: "wrong_item", label: "Wrong Items" },
  { id: "food_quality", label: "Food Quality Issue" },
  { id: "late_delivery", label: "Late Delivery" },
  { id: "rider_behavior", label: "Rider Behavior" },
  { id: "payment_issue", label: "Payment Issue" },
  { id: "other", label: "Other" },
];

export default function ComplaintForm({ onClose, onCreated }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ order_id: "", complaint_type: "missing_item", description: "" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40";

  useEffect(() => {
    base44.entities.Order.filter({ created_by_id: user?.id }, "-created_date", 10).then(setOrders).catch(() => {});
  }, [user?.id]);

  const selectedOrder = orders.find(o => o.id === form.order_id);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) { toast({ title: "Description required", variant: "destructive" }); return; }
    setSending(true);
    const result = await createComplaint(user, selectedOrder, form.complaint_type, form.description, photoUrl);
    if (result.success) {
      toast({ title: "Complaint submitted!", description: "We'll investigate and get back to you." });
      onCreated();
    } else {
      toast({ title: result.error || "Failed", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-saffron" /> File a Complaint</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Related Order (optional)</label>
            <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} className={inputClass}>
              <option value="">Select order</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} — {o.store_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Complaint Type</label>
            <select value={form.complaint_type} onChange={(e) => setForm({ ...form, complaint_type: e.target.value })} className={inputClass}>
              {complaintTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass + " resize-none"} placeholder="Describe what happened..." />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Photo Evidence (optional)</label>
            {photoUrl ? (
              <div className="relative">
                <img src={photoUrl} alt="evidence" className="w-full h-32 rounded-xl object-cover" />
                <button onClick={() => setPhotoUrl("")} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs">✕</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-20 rounded-xl border border-dashed border-border cursor-pointer hover:border-saffron/40">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-saffron" /> : <><ImageIcon className="w-4 h-4 text-foreground/40" /><span className="text-sm text-foreground/40">Upload photo</span></>}
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            )}
          </div>
          <button onClick={handleSubmit} disabled={sending} className="w-full h-11 rounded-xl bg-saffron text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Complaint</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}