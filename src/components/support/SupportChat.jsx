import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, Image as ImageIcon, Paperclip, MessageCircle, Check, CheckCheck } from "lucide-react";
import { sendSupportChatMessage, markMessagesRead } from "@/lib/support";

export default function SupportChat({ ticketId, user, ticketStatus, onStatusChange }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);
  const isAgent = user?.role === "admin" || user?.role === "support_agent";

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.SupportChatMessage.filter({ ticket_id: ticketId }, "created_date", 200);
      setMessages(data);
      if (data.length > 0) {
        markMessagesRead(ticketId, user.id);
        // Mark other's messages as read visually
        setMessages((prev) => prev.map((m) => (m.sender_id !== user.id ? { ...m, is_read: true } : m)));
      }
    } catch {}
    setLoading(false);
  }, [ticketId, user.id]);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.SupportChatMessage.subscribe((event) => {
      if (event.data?.ticket_id === ticketId) load();
    });
    return unsubscribe;
  }, [load, ticketId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, otherTyping]);

  const handleTyping = () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (!typing) setTyping(true);
    typingTimeout.current = setTimeout(() => setTyping(false), 2000);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    const senderType = isAgent ? "agent" : "user";
    const result = await sendSupportChatMessage(ticketId, user.id, user.full_name || user.email || "User", senderType, input.trim());
    if (result.success) {
      setInput("");
      setTyping(false);
      if (!isAgent && ticketStatus === "open") {
        await base44.entities.SupportTicket.update(ticketId, { status: "in_progress" }).catch(() => {});
        if (onStatusChange) onStatusChange();
      }
      load();
    } else {
      toast({ title: result.error || "Failed to send", variant: "destructive" });
    }
    setSending(false);
  };

  const handleFile = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const senderType = isAgent ? "agent" : "user";
      const isImage = type === "image";
      const result = await sendSupportChatMessage(
        ticketId, user.id, user.full_name || user.email, senderType,
        isImage ? "📷 Image" : "📎 " + (file.name || "File"),
        { fileUrl: file_url, fileName: file.name, imageUrl: isImage ? file_url : "", messageType: isImage ? "image" : "file" }
      );
      if (result.success) load();
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    setSending(false);
    e.target.value = "";
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  const isClosed = ticketStatus === "resolved" || ticketStatus === "closed";

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <div className="text-center py-6"><MessageCircle className="w-8 h-8 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No messages yet. Start the conversation!</p></div>
      ) : (
        <div ref={scrollRef} className="space-y-2 max-h-80 overflow-y-auto">
          {messages.map((m) => {
            const isMe = m.sender_id === user.id;
            const msgType = m.message_type || (m.image_url ? "image" : "text");
            return (
              <div key={m.id} className={"flex " + (isMe ? "justify-end" : "justify-start")}>
                <div className={"max-w-[75%] rounded-2xl p-3 " + (isMe ? "bg-saffron text-white" : "bg-muted text-foreground")}>
                  {!isMe && <p className="text-[10px] font-bold mb-0.5 opacity-60">{m.sender_name}</p>}
                  {msgType === "image" && m.image_url ? (
                    <img src={m.image_url} alt="attachment" className="rounded-lg max-w-full max-h-48" />
                  ) : msgType === "file" && m.file_url ? (
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer" download={m.file_name} className={"flex items-center gap-2 text-sm underline " + (isMe ? "text-white" : "text-saffron")}>
                      <Paperclip className="w-4 h-4" /> {m.file_name || "Download file"}
                    </a>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  )}
                  <div className={"flex items-center gap-1 justify-end mt-1 " + (isMe ? "text-white/50" : "text-foreground/30")}>
                    <span className="text-[9px]">{new Date(m.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isMe && (m.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                  </div>
                </div>
              </div>
            );
          })}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      )}

      {isClosed ? (
        <div className="text-center py-3"><p className="text-sm text-foreground/40">This ticket is {ticketStatus}. Chat is closed.</p></div>
      ) : (
        <div className="flex gap-2 items-end">
          <label className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center cursor-pointer hover:bg-saffron/10 hover:text-saffron flex-shrink-0">
            <ImageIcon className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={(e) => handleFile(e, "image")} className="hidden" />
          </label>
          <label className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center cursor-pointer hover:bg-saffron/10 hover:text-saffron flex-shrink-0">
            <Paperclip className="w-4 h-4" />
            <input type="file" onChange={(e) => handleFile(e, "file")} className="hidden" />
          </label>
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
          />
          <button onClick={handleSend} disabled={sending || !input.trim()} className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"><Send className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}