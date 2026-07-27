import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, X, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTicket, createSupportTicketWithOrder } from "@/lib/support";

export default function TicketForm({ user, userType, categories = [], order, startWithChat, onClose, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ category: categories[0]?.id || "", subject: "", description: "", priority: "medium" });
  const [sending, setSending] = useState(false);
  const inputClass = "w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40";

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    setSending(true);
    const result = order
      ? await createSupportTicketWithOrder(user, userType, form.category, form.subject, form.description, form.priority, order)
      : await createTicket(user, userType, form.category, form.subject, form.description, form.priority);
    if (result.success) {
      toast({ title: startWithChat ? "Chat started!" : "Ticket created!", description: startWithChat ? "A support agent will join shortly." : "We'll get back to you soon." });
      onCreated(result.ticket, startWithChat);
    } else {
      toast({ title: result.error || "Failed", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-saffron" /> Create Support Ticket</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClass} placeholder="Brief subject" />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/60 mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass + " resize-none"} placeholder="Describe your issue in detail..." />
          </div>
          <button onClick={handleSubmit} disabled={sending} className="w-full h-11 rounded-xl bg-saffron text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}