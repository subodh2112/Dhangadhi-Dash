import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Phone, MessageSquare, X, Send, Bike, Star } from "lucide-react";
import { maskPhone } from "@/lib/riderTracking";

export default function RiderContactBar({ order, rider }) {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const riderPhone = rider?.phone;
  const vehicleNumber = rider?.vehicle_number;
  const riderPhoto = rider?.profile_photo_url;
  const riderRating = rider?.rating?.toFixed(1) || "4.8";

  useEffect(() => {
    if (!order?.id) return;
    const loadMessages = async () => {
      try {
        const msgs = await base44.entities.ChatMessage.filter({ order_id: order.id }, "created_date", 100);
        setMessages(msgs);
        setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
      } catch {}
    };
    loadMessages();
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.order_id === order.id) {
        loadMessages();
      }
    });
    return unsubscribe;
  }, [order?.id]);

  const sendMessage = async () => {
    if (!input.trim() || !order?.id) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      const senderType = user?.role === "rider" ? "rider" : "customer";
      await base44.entities.ChatMessage.create({
        order_id: order.id,
        order_number: order.order_number,
        sender_id: user?.id,
        sender_type: senderType,
        sender_name: user?.full_name || "User",
        message: text,
        is_read: false,
      });
    } catch {}
    setSending(false);
  };

  return (
    <>
      <div className="bg-card rounded-3xl border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-saffron/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {riderPhoto ? <img src={riderPhoto} alt={order.rider_name} className="w-full h-full object-cover" /> : <Bike className="w-7 h-7 text-saffron" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">{order.rider_name || "Assigning rider..."}</p>
            <div className="flex items-center gap-3 text-xs text-foreground/50">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-saffron fill-saffron" /> {riderRating}</span>
              {vehicleNumber && <span className="truncate">{vehicleNumber}</span>}
            </div>
          </div>
          {order.rider_name && (
            <div className="flex gap-2 flex-shrink-0">
              <a href={"tel:" + (riderPhone || "")} className="w-11 h-11 rounded-full bg-terai/10 flex items-center justify-center hover:bg-terai/20 transition-colors" title={"Call " + maskPhone(riderPhone)}>
                <Phone className="w-5 h-5 text-terai" />
              </a>
              <button onClick={() => setChatOpen(true)} className="w-11 h-11 rounded-full bg-saffron/10 flex items-center justify-center hover:bg-saffron/20 transition-colors" title="Chat">
                <MessageSquare className="w-5 h-5 text-saffron" />
              </button>
            </div>
          )}
        </div>
        {order.delivery_instructions && (
          <div className="mt-3 p-3 rounded-xl bg-muted/50 text-xs text-foreground/60">
            <span className="font-bold text-foreground/70">Instructions: </span>{order.delivery_instructions}
          </div>
        )}
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-carbon/50 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative bg-card rounded-t-3xl sm:rounded-3xl border border-border w-full sm:max-w-md h-[70vh] sm:h-[500px] flex flex-col safe-area-pb">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-saffron/10 flex items-center justify-center overflow-hidden">
                    {riderPhoto ? <img src={riderPhoto} alt="" className="w-full h-full object-cover" /> : <Bike className="w-4 h-4 text-saffron" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{order.rider_name}</p>
                    <p className="text-xs text-foreground/40">{order.order_number}</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-2 text-foreground/40 hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-foreground/40 py-8">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={"flex " + (isMine ? "justify-end" : "justify-start")}>
                        <div className={"max-w-[75%] px-3 py-2 rounded-2xl text-sm " + (isMine ? "bg-saffron text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                          <p>{msg.message}</p>
                          <p className={"text-[9px] mt-0.5 " + (isMine ? "text-white/50" : "text-foreground/30")}>{msg.sender_name} · {new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-3 border-t border-border flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Type a message..."
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-saffron/30"
                />
                <button onClick={sendMessage} disabled={!input.trim() || sending} className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}