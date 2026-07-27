import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "I want momo under NPR 300",
    "Best rated restaurants near me",
    "Find pharmacy open now",
    "Budget-friendly grocery options",
  ];

  useEffect(() => {
    if (!open || initialized) return;
    const init = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: "d_dash_assistant",
          metadata: { name: "D Dash Assistant Chat" },
        });
        setConversation(conv);
        setMessages([
          {
            role: "assistant",
            content: "Namaste! 🙏 I'm your D Dash Assistant. I can help you find the best restaurants, grocery stores, pharmacies, and more across Dhangadhi. What are you looking for today?",
          },
        ]);
        setInitialized(true);
      } catch {
        setMessages([
          {
            role: "assistant",
            content: "Namaste! I'm your D Dash Assistant. How can I help you find great local food and products in Dhangadhi today?",
          },
        ]);
        setInitialized(true);
      }
    };
    init();
  }, [open, initialized]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const message = text || input;
    if (!message.trim() || loading) return;
    setInput("");
    setLoading(true);

    if (conversation) {
      try {
        await base44.agents.addMessage(conversation, { role: "user", content: message });
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: message },
          { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." },
        ]);
        setLoading(false);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: "I'm having trouble connecting to the server. Please refresh and try again." },
      ]);
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[60vh] sm:h-[520px] bg-white rounded-3xl shadow-2xl shadow-carbon/20 border border-border flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-carbon text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-saffron flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">D Dash Assistant</p>
                  <p className="text-xs text-white/50">AI Shopping Helper</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-saffron" : "bg-carbon"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-saffron text-white rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                    {msg.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-sm max-w-none [&>*]:mb-0">{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-carbon flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    {[0, 1, 2].map((d) => (
                      <div key={d} className="w-2 h-2 bg-carbon/30 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {messages.length <= 1 && !loading && (
                <div className="pt-2">
                  <p className="text-xs text-foreground/40 font-semibold uppercase tracking-wide mb-2">Try asking:</p>
                  <div className="flex flex-col gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="text-left text-sm text-foreground/70 bg-muted/50 hover:bg-muted rounded-xl px-3 py-2 transition-colors border border-border"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 h-11 px-4 rounded-full border border-border bg-white text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="w-11 h-11 flex-shrink-0 rounded-full bg-saffron text-white flex items-center justify-center hover:bg-saffron/90 transition-colors disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full bg-saffron text-white shadow-lg shadow-saffron/40 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6" />
          <span className="absolute inset-0 rounded-full bg-saffron animate-ping opacity-20" />
        </motion.button>
      )}
    </>
  );
}