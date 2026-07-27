import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageSquare, CheckCircle, Clock, AlertTriangle, TrendingUp, Eye, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAdminAction } from "@/lib/adminLog";
import SupportChat from "@/components/support/SupportChat";

export default function SupportManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.SupportTicket.list("-created_date", 200);
      setTickets(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdating(true);
    try {
      const updates = { status: newStatus, assigned_agent_id: user?.id };
      if (newStatus === "resolved" || newStatus === "closed") updates.resolved_at = new Date().toISOString();
      await base44.entities.SupportTicket.update(ticketId, updates);
      await logAdminAction("Updated ticket status", "SupportTicket", selected?.subject, "Status → " + newStatus);
      toast({ title: "Ticket " + newStatus.replace(/_/g, " ") });
      setSelected(null);
      load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setUpdating(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  const open = tickets.filter(t => t.status === "open");
  const urgent = tickets.filter(t => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed");
  const resolved = tickets.filter(t => t.status === "resolved" || t.status === "closed");
  const resolutionRate = tickets.length > 0 ? Math.round((resolved.length / tickets.length) * 100) : 0;

  const stats = [
    { label: "Open Tickets", value: open.length, icon: MessageSquare, color: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
    { label: "Urgent", value: urgent.length, icon: AlertTriangle, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Resolved", value: resolved.length, icon: CheckCircle, color: "bg-terai/10 text-terai" },
    { label: "Resolution Rate", value: resolutionRate + "%", icon: TrendingUp, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  ];

  let filtered = tickets;
  if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
  if (priorityFilter) filtered = filtered.filter(t => t.priority === priorityFilter);

  const statusColors = { open: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", in_progress: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", waiting: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", resolved: "bg-terai/10 text-terai", closed: "bg-muted text-foreground/40" };
  const priorityColors = { low: "bg-muted text-foreground/40", medium: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", high: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", urgent: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + s.color}><Icon className="w-4 h-4" /></div>
              <p className="text-lg font-display font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-foreground/40">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {["", "open", "in_progress", "waiting", "resolved", "closed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-xs font-bold capitalize " + (statusFilter === s ? "bg-background text-saffron shadow-sm" : "text-foreground/50")}>{s || "All"}</button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {["", "urgent", "high", "medium", "low"].map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} className={"px-3 py-1.5 rounded-lg text-xs font-bold capitalize " + (priorityFilter === p ? "bg-background text-saffron shadow-sm" : "text-foreground/50")}>{p || "All Priority"}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><MessageSquare className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No tickets found.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map(t => (
            <div key={t.id} className="bg-card rounded-2xl border border-border p-4 cursor-pointer hover:border-saffron/30" onClick={() => setSelected(t)}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm text-foreground truncate">{t.subject}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (priorityColors[t.priority] || "bg-muted")}>{t.priority}</span>
                  <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (statusColors[t.status] || "bg-muted")}>{t.status?.replace(/_/g, " ")}</span>
                </div>
              </div>
              <p className="text-xs text-foreground/50 truncate">{t.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-foreground/40">{t.user_name || "Unknown"} · {t.user_type} · {t.category?.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-foreground/30">{new Date(t.created_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.subject}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-1.5">
                  <span className={"text-[10px] font-bold px-2 py-1 rounded-full " + (priorityColors[selected.priority] || "bg-muted")}>{selected.priority}</span>
                  <span className={"text-[10px] font-bold px-2 py-1 rounded-full " + (statusColors[selected.status] || "bg-muted")}>{selected.status?.replace(/_/g, " ")}</span>
                  <span className="text-[10px] text-foreground/40 ml-auto">{selected.ticket_id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-foreground/40">User</p><p className="font-semibold">{selected.user_name} ({selected.user_type})</p></div>
                  <div><p className="text-xs text-foreground/40">Category</p><p className="font-semibold capitalize">{selected.category?.replace(/_/g, " ")}</p></div>
                </div>
                <div className="p-3 rounded-xl bg-muted/50"><p className="text-xs font-bold text-foreground/40 mb-1">Description</p><p className="text-sm text-foreground/70 whitespace-pre-wrap">{selected.description}</p></div>
                {selected.attachments && (
                  <div className="flex gap-2 flex-wrap">
                    {selected.attachments.split(",").filter(Boolean).map((url, i) => <img key={i} src={url.trim()} alt="attachment" className="w-16 h-16 rounded-lg object-cover border border-border" />)}
                  </div>
                )}
                {selected.admin_reply && <div className="p-3 rounded-xl bg-saffron/5 border border-saffron/10"><p className="text-xs font-bold text-saffron mb-1">Admin Reply</p><p className="text-sm text-foreground/70">{selected.admin_reply}</p></div>}

                <div className="border-t border-border pt-3">
                  <p className="text-xs font-bold text-foreground/40 mb-2">Live Chat</p>
                  <SupportChat ticketId={selected.id} user={user} ticketStatus={selected.status} onStatusChange={() => { load(); }} />
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-xs font-bold text-foreground/40 mb-2">Update Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleStatusChange(selected.id, "in_progress")} disabled={updating} className="h-9 rounded-lg bg-amber-500 text-white text-xs font-bold disabled:opacity-50">In Progress</button>
                    <button onClick={() => handleStatusChange(selected.id, "waiting")} disabled={updating} className="h-9 rounded-lg bg-blue-500 text-white text-xs font-bold disabled:opacity-50">Waiting</button>
                    <button onClick={() => handleStatusChange(selected.id, "resolved")} disabled={updating} className="h-9 rounded-lg bg-terai text-white text-xs font-bold disabled:opacity-50">Resolve</button>
                    <button onClick={() => handleStatusChange(selected.id, "closed")} disabled={updating} className="h-9 rounded-lg bg-muted text-foreground/60 text-xs font-bold disabled:opacity-50 col-span-3">Close Ticket</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}