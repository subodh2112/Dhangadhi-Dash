import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Send, MessageSquare, CheckCircle, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportChat from "@/components/support/SupportChat";

export default function SupportTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.SupportTicket.get(id);
      setTicket(data);
    } catch { toast({ title: "Ticket not found", variant: "destructive" }); navigate("/help"); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;
  if (!ticket) return null;

  const statusColors = { open: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", in_progress: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", waiting: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", resolved: "bg-terai/10 text-terai", closed: "bg-muted text-foreground/40" };
  const priorityColors = { low: "bg-muted text-foreground/40", medium: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", high: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", urgent: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link to="/help" className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-saffron mb-4"><ArrowLeft className="w-4 h-4" /> Back to Help Center</Link>

          <div className="bg-card rounded-2xl border border-border p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                <span className={"text-[10px] font-bold px-2 py-1 rounded-full " + (priorityColors[ticket.priority] || "bg-muted")}>{ticket.priority}</span>
                <span className={"text-[10px] font-bold px-2 py-1 rounded-full " + (statusColors[ticket.status] || "bg-muted")}>{ticket.status?.replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-foreground/40">{ticket.ticket_id}</p>
            </div>
            <h1 className="font-display font-extrabold text-xl text-foreground mb-2">{ticket.subject}</h1>
            <div className="flex items-center gap-3 text-xs text-foreground/40 mb-3">
              <span>{ticket.user_name}</span>
              <span>·</span>
              <span className="capitalize">{ticket.user_type}</span>
              <span>·</span>
              <span className="capitalize">{ticket.category?.replace(/_/g, " ")}</span>
              <span>·</span>
              <span>{new Date(ticket.created_date).toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-sm text-foreground/70 whitespace-pre-wrap">{ticket.description}</p>
            </div>
            {ticket.attachments && (
              <div className="mt-3">
                <p className="text-xs font-bold text-foreground/40 mb-1">Attachments</p>
                <div className="flex gap-2 flex-wrap">
                  {ticket.attachments.split(",").filter(Boolean).map((url, i) => (
                    <img key={i} src={url.trim()} alt="attachment" className="w-16 h-16 rounded-lg object-cover border border-border" />
                  ))}
                </div>
              </div>
            )}
            {ticket.admin_reply && (
              <div className="mt-3 p-3 rounded-xl bg-saffron/5 border border-saffron/10">
                <p className="text-xs font-bold text-saffron mb-1">Admin Response</p>
                <p className="text-sm text-foreground/70">{ticket.admin_reply}</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-saffron" /> Live Chat</h3>
            <SupportChat ticketId={ticket.id} user={user} ticketStatus={ticket.status} onStatusChange={load} />
          </div>

          {ticket.status === "resolved" && (
            <div className="mt-4 p-4 rounded-2xl bg-terai/5 border border-terai/10 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-terai" />
              <p className="text-sm text-terai font-medium">This ticket has been resolved. Thank you for your patience!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}