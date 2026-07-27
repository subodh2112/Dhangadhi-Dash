import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Store, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import BottomSheetSelect from "@/components/BottomSheetSelect";

const NOTIFICATION_EMAIL = "arbsstudios@gmail.com";

const businessTypes = ["Restaurant", "Grocery Store", "Pharmacy", "Bakery", "Local Shop", "Other"];

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-border focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all text-sm";

export default function PartnershipForm({ open, onClose }) {
  const [form, setForm] = useState({ businessName: "", businessType: "", ownerName: "", phone: "", email: "", address: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const body = [
        "New Partnership Application Received!",
        "",
        `Business Name: ${form.businessName}`,
        `Business Type: ${form.businessType}`,
        `Owner Name: ${form.ownerName}`,
        `Phone: ${form.phone}`,
        `Email: ${form.email}`,
        `Address: ${form.address}`,
        `Message: ${form.message || "N/A"}`,
        "",
        "Review this application and reach out to the business owner to proceed.",
      ].join("\n");

      await base44.integrations.Core.SendEmail({
        to: NOTIFICATION_EMAIL,
        subject: `New Partnership Application: ${form.businessName}`,
        body: body,
      });
      setSent(true);
      setForm({ businessName: "", businessType: "", ownerName: "", phone: "", email: "", address: "", message: "" });
    } catch (err) {
      setError(true);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSent(false);
    setError(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-carbon/50 backdrop-blur-sm" onClick={handleClose} />
          <motion.div className="relative bg-background rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
            {sent ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-terai/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-terai" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-2">Application Received!</h3>
                <p className="text-sm text-foreground/55 mb-6">Thank you for your interest in partnering with Dhangadhi Dash. Our team will review your application and get back to you within 48 hours.</p>
                <Button onClick={handleClose} className="bg-saffron hover:bg-saffron/90 text-white rounded-full px-6">Close</Button>
              </div>
            ) : (
              <>
                <div className="sticky top-0 bg-background/90 backdrop-blur-sm px-6 py-4 border-b border-border flex items-center justify-between rounded-t-3xl z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-terai/10 flex items-center justify-center"><Store className="w-5 h-5 text-terai" /></div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground leading-tight">Partner With Us</h3>
                      <p className="text-xs text-foreground/50">Grow your business with DDash</p>
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-2 text-foreground/50 hover:text-foreground transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Business Name *</label>
                      <input name="businessName" required value={form.businessName} onChange={handleChange} className={inputClass} placeholder="e.g. Himalayan Kitchen" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Business Type *</label>
                      <BottomSheetSelect
                        value={form.businessType}
                        onChange={(val) => setForm({ ...form, businessType: val })}
                        options={businessTypes.map((t) => ({ value: t, label: t }))}
                        placeholder="Select type"
                        label="Business Type"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Owner Name *</label>
                      <input name="ownerName" required value={form.ownerName} onChange={handleChange} className={inputClass} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Phone *</label>
                      <input name="phone" type="tel" required value={form.phone} onChange={handleChange} className={inputClass} placeholder="+977 98XXXXXXXX" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                    <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} placeholder="you@business.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Business Address *</label>
                    <input name="address" required value={form.address} onChange={handleChange} className={inputClass} placeholder="Street, Dhangadhi" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Message</label>
                    <textarea name="message" rows={3} value={form.message} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Tell us about your business..." />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Something went wrong. Please try again or contact us directly.
                    </div>
                  )}
                  <Button type="submit" disabled={loading} className="w-full bg-terai hover:bg-terai/90 text-white rounded-xl h-12 font-bold shadow-lg shadow-terai/25">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}