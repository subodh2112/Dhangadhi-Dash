import React, { useState } from "react";
import { PhoneCall, Loader2, CheckCircle } from "lucide-react";
import { requestCallback } from "@/lib/support";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const timeSlots = [
  "ASAP (within 30 min)",
  "Morning (9 AM - 12 PM)",
  "Afternoon (12 PM - 4 PM)",
  "Evening (4 PM - 8 PM)",
  "Tomorrow Morning",
];

export default function CallbackRequestForm({ user, userType, orderContext, onClose }) {
  const { toast } = useToast();
  const [preferredTime, setPreferredTime] = useState(timeSlots[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await requestCallback(user, userType, preferredTime, note, orderContext);
    if (result.success) {
      setDone(true);
      toast({ title: "Callback scheduled!", description: "Our team will call you " + preferredTime });
    } else {
      toast({ title: result.error || "Failed", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PhoneCall className="w-5 h-5 text-saffron" /> Request Callback</DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-terai mx-auto mb-3" />
            <p className="font-bold text-foreground mb-1">Callback Scheduled!</p>
            <p className="text-sm text-foreground/50">Our support team will call you {preferredTime.toLowerCase()}.</p>
            <button onClick={onClose} className="mt-4 w-full h-10 rounded-xl bg-saffron text-white font-bold">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-foreground/50">No phone numbers exposed — our team will reach out through the app. Pick a preferred time.</p>
            <div>
              <label className="text-xs font-bold text-foreground/60 mb-1.5 block">Preferred Time</label>
              <select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm">
                {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground/60 mb-1.5 block">Note (optional)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Briefly describe your issue..." className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none" />
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="w-full h-11 rounded-xl bg-saffron text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
              Schedule Callback
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}