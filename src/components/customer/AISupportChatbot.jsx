import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2, Ticket } from "lucide-react";
import { getChatbotResponse } from "@/lib/aiEngine";

export default function AISupportChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", text: "Hi! I'm DashAI, your support assistant. How can I help you today?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const context = { recentMessages: messages.slice(-5) };
      const result = await getChatbotResponse(userMsg, user, context);
      setMessages(prev => [...prev, { role: "bot", text: result.response }]);

      if (result.should_create_ticket) {
        const ticket = await base44.entities.SupportTicket.create({
          subject: userMsg.slice(0, 80),
          description: `Auto-created from AI chatbot.\n\nUser message: ${userMsg}\n\nAI assessment: ${result.response}`,
          category: result.ticket_category || "order_issues",
          priority: result.ticket_priority || "medium",
          status: "open",
          user_id: user?.id,
          user_name: user?.full_name,
          user_type: "customer",
        });
        setConversationId(ticket.id);
        setMessages(prev => [...prev, { role: "bot", text: `I've created a support ticket for you (ID: ${ticket.id?.slice(-6)}). Our team will follow up soon.`, ticketId: ticket.id }]);
      }

      if (!conversationId) {
        await base44.entities.AIConversation.create({
          user_id: user?.id || "anonymous",
          user_name: user?.full_name || "Guest",
          conversation_type: "support",
          messages: JSON.stringify([...messages, { role: "user", text: userMsg }, { role: "bot", text: result.response }]),
          summary: userMsg.slice(0, 100),
          status: result.should_create_ticket ? "escalated" : "active",
        }).then(c => setConversationId(c.id));
      }
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Sorry, I'm having trouble right now. Please try again or contact support." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-saffron text-white shadow-lg shadow-saffron/30 flex items-center justify-center hover:scale-105 transition-transform lg:bottom-6">
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-terai rounded-full flex items-center justify-center text-[10px] font-bold">AI</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden lg:bottom-6">
          <div className="bg-saffron text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Bot className="w-5 h-5" /></div>
              <div><p className="font-bold text-sm">DashAI Support</p><p className="text-[10px] text-white/70">AI-powered • Always online</p></div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
          </div>

          <div ref={scrollRef} className="h-[50vh] max-h-80 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-saffron/10" : "bg-terai/10"}`}>
                  {msg.role === "user" ? <UserIcon className="w-4 h-4 text-saffron" /> : <Bot className="w-4 h-4 text-terai" />}
                </div>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.role === "user" ? "bg-saffron text-white rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.ticketId && <p className="text-[10px] mt-1 pt-1 border-t border-white/20 flex items-center gap-1"><Ticket className="w-3 h-3" /> Ticket created</p>}
                </div>
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-foreground/40 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> DashAI is typing...</div>}
          </div>

          <div className="p-3 border-t border-border flex items-center gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask about orders, refunds..." className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
            <button onClick={sendMessage} disabled={loading || !input.trim()} className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center disabled:opacity-40"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}