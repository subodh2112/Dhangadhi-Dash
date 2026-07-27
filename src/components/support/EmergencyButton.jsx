import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Phone, MapPin, Loader2, X, AlertTriangle } from "lucide-react";
import { triggerEmergency } from "@/lib/support";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EmergencyButton({ orderId = "", userType = "customer" }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (open && user?.id) {
      base44.entities.EmergencyContact.filter({ user_id: user.id }).then(setContacts).catch(() => {});
    }
  }, [open, user?.id]);

  const handleTrigger = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast({ title: "Location not available", variant: "destructive" });
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        const result = await triggerEmergency(user, userType, lat, lng, orderId);
        if (result.success) {
          setTriggered(true);
          toast({ title: "Emergency alert sent!", description: "Admin has been notified with your location." });
        } else {
          toast({ title: "Failed to send alert", variant: "destructive" });
        }
        setLoading(false);
      },
      () => {
        toast({ title: "Location permission denied", variant: "destructive" });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
        <Shield className="w-4 h-4" /> Emergency Help
      </button>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-500"><AlertTriangle className="w-5 h-5" /> Emergency Assistance</DialogTitle></DialogHeader>
          {!triggered ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground/60">If you're in danger or need immediate help, press the button below. We'll share your location with our support team and your emergency contacts.</p>
              {contacts.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-foreground/40 mb-2">Your Emergency Contacts</p>
                  <div className="space-y-1">
                    {contacts.map(c => (
                      <a key={c.id} href={"tel:" + c.phone_number} className="flex items-center gap-2 p-2 rounded-xl bg-muted/50 hover:bg-muted">
                        <Phone className="w-4 h-4 text-saffron" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-foreground/40">{c.phone_number} · {c.relationship}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={handleTrigger} disabled={loading} className="w-full h-14 rounded-2xl bg-red-500 text-white font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 animate-pulse">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-5 h-5" /> SEND EMERGENCY ALERT</>}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-terai/10 flex items-center justify-center mx-auto"><Shield className="w-8 h-8 text-terai" /></div>
              <div>
                <p className="font-bold text-lg text-foreground">Alert Sent Successfully</p>
                <p className="text-sm text-foreground/50 mt-1">Our support team has been notified and is responding to your emergency.</p>
              </div>
              {location && (
                <a href={"https://www.openstreetmap.org/?mlat=" + location.lat + "&mlon=" + location.lng + "&zoom=16"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-sm font-bold text-foreground">
                  <MapPin className="w-4 h-4 text-saffron" /> View My Location
                </a>
              )}
              {contacts.map(c => (
                <a key={c.id} href={"tel:" + c.phone_number} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500">
                  <Phone className="w-4 h-4" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-xs">{c.phone_number}</p>
                  </div>
                  <span className="text-xs font-bold">Call →</span>
                </a>
              ))}
              <a href="tel:100" className="flex items-center gap-2 p-3 rounded-xl bg-red-500 text-white">
                <Phone className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold">Police Emergency</p>
                  <p className="text-xs">Call 100</p>
                </div>
                <span className="text-xs font-bold">Call →</span>
              </a>
              <button onClick={() => setOpen(false)} className="w-full h-10 rounded-xl bg-muted text-sm font-bold text-foreground/60">Close</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}