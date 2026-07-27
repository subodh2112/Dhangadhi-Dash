import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Phone, MessageSquare, PhoneCall, Flag, AlertTriangle, X } from "lucide-react";
import SupportCallModal from "@/components/support/SupportCallModal";
import CallbackRequestForm from "@/components/support/CallbackRequestForm";
import TicketForm from "@/components/support/TicketForm";
import EmergencyButton from "@/components/support/EmergencyButton";
import { useAuth } from "@/lib/AuthContext";
import { buildOrderContext } from "@/lib/support";

const TICKET_CATEGORIES = [
  { id: "order_issue", label: "Order Issue" },
  { id: "payment_issue", label: "Payment Issue" },
  { id: "refund", label: "Refund" },
  { id: "rider_issue", label: "Rider Issue" },
  { id: "merchant_issue", label: "Merchant Issue" },
  { id: "technical_problem", label: "Technical Problem" },
  { id: "account_problem", label: "Account Problem" },
  { id: "other", label: "Other" },
];

export default function SupportHub({ order, floating = true }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null);

  const role = user?.role === "user" ? "customer" : user?.role || "customer";
  const orderContext = buildOrderContext(order);

  const options = [
    { key: "chat", label: "Live Chat", desc: "Chat with a support agent", icon: MessageSquare, color: "bg-saffron/10 text-saffron" },
    { key: "call", label: "Audio Call", desc: "Call support now", icon: Phone, color: "bg-terai/10 text-terai" },
    { key: "callback", label: "Request Callback", desc: "We'll call you back", icon: PhoneCall, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
    { key: "ticket", label: "Report Issue", desc: "Open a support ticket", icon: Flag, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { key: "emergency", label: "Emergency Support", desc: "Urgent assistance", icon: AlertTriangle, color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  ];

  const handleSelect = (key) => {
    setMode(key);
    setOpen(false);
  };

  return (
    <>
      {floating ? (
        <button
          onClick={() => setOpen(!open)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-saffron text-white shadow-xl shadow-saffron/30 flex items-center justify-center hover:scale-105 transition-transform lg:bottom-6"
          aria-label="Help & Support"
        >
          <Headphones className="w-6 h-6" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="w-full h-12 rounded-xl bg-saffron text-white font-bold flex items-center justify-center gap-2"
        >
          <Headphones className="w-5 h-5" /> Help & Support
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-card rounded-3xl border border-border shadow-2xl p-4 lg:bottom-24"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-saffron" />
                <h3 className="font-display font-bold text-foreground">Help & Support</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-foreground/40 hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {order && (
              <div className="mb-3 p-2.5 rounded-xl bg-saffron/5 border border-saffron/20">
                <p className="text-[10px] font-bold text-saffron uppercase">Order Context Attached</p>
                <p className="text-xs text-foreground/60">Order #{order.order_number} · {order.store_name}</p>
              </div>
            )}
            <div className="space-y-1.5">
              {options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSelect(opt.key)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className={"w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 " + opt.color}>
                    <opt.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{opt.label}</p>
                    <p className="text-xs text-foreground/40 truncate">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === "call" && (
          <SupportCallModal user={user} userType={role} orderContext={orderContext} onClose={() => setMode(null)} />
        )}
        {mode === "callback" && (
          <CallbackRequestForm user={user} userType={role} orderContext={orderContext} onClose={() => setMode(null)} />
        )}
        {mode === "chat" && (
          <TicketForm
            user={user}
            userType={role}
            categories={TICKET_CATEGORIES}
            order={order}
            startWithChat={true}
            onClose={() => setMode(null)}
          />
        )}
        {mode === "ticket" && (
          <TicketForm
            user={user}
            userType={role}
            categories={TICKET_CATEGORIES}
            order={order}
            onClose={() => setMode(null)}
          />
        )}
        {mode === "emergency" && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-carbon/50 backdrop-blur-sm" onClick={() => setMode(null)} />
            <div className="relative bg-card rounded-3xl border border-border p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-foreground">Emergency Support</h3>
                <button onClick={() => setMode(null)} className="p-1 text-foreground/40"><X className="w-5 h-5" /></button>
              </div>
              <EmergencyButton orderId={order?.id || ""} userType={role} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}