import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PullToRefresh from "@/components/PullToRefresh";
import SupportChat from "@/components/support/SupportChat.jsx";
import AgentCallPanel from "@/components/support/AgentCallPanel";
import { endSupportCall, escalateTicket, assignTicket, resolveTicket } from "@/lib/support";
import { Phone, PhoneOff, MessageSquare, Ticket, History, Loader2, ChevronRight, ArrowUpCircle, CheckCircle, Clock, User } from "lucide-react";

const statusColors = {
  open: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  in_progress: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  waiting: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  resolved: "bg-terai/10 text-terai",
  closed: "bg-muted text-foreground/40",
};

const categoryLabels = {
  order_issue: "Order Issue", payment_issue: "Payment Issue", refund: "Refund",
  rider_issue: "Rider Issue", merchant_issue: "Merchant Issue",
  technical_problem: "Technical Problem", account_problem: "Account Problem", other: "Other",
};

export default function SupportDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("calls");
  const [calls, setCalls] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchUser, setSearchUser] = useState("");
  const [historyResults, setHistoryResults] = useState({ tickets: [], calls: [] });
  const [activeCall, setActiveCall] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, t] = await Promise.all([
        base44.entities.SupportCall.list("-created_date", 100).catch(() => []),
        base44.entities.SupportTicket.list("-created_date", 200).catch(() => []),
      ]);
      setCalls(c);
      setTickets(t);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsubCalls = base44.entities.SupportCall.subscribe(() => load());
    const unsubTickets = base44.entities.SupportTicket.subscribe(() => load());
    return () => { unsubCalls(); unsubTickets(); };
  }, [load]);

  const handleAnswer = (call) => {
    setActiveCall(call);
  };

  const handleEndCall = async (callId) => {
    await endSupportCall(callId, "agent_ended");
    load();
  };

  const handleEscalate = async (ticketId) => {
    const result = await escalateTicket(ticketId, user.id);
    if (result.success) { toast({ title: "Ticket escalated to admin" }); load(); }
    else toast({ title: result.error, variant: "destructive" });
  };

  const handleAssign = async (ticketId) => {
    const result = await assignTicket(ticketId, user.id, user.full_name || user.email);
    if (result.success) { toast({ title: "Ticket assigned to you" }); load(); }
    else toast({ title: result.error, variant: "destructive" });
  };

  const handleStatus = async (ticketId, status) => {
    await base44.entities.SupportTicket.update(ticketId, { status, assigned_agent_id: user.id }).catch(() => {});
    if (status === "resolved") await resolveTicket(ticketId, user.id, "Resolved by support agent");
    toast({ title: "Ticket " + status.replace(/_/g, " ") });
    load();
  };

  const searchHistory = async () => {
    if (!searchUser.trim()) return;
    try {
      const [uTickets, uCalls] = await Promise.all([
        base44.entities.SupportTicket.filter({ user_id: searchUser.trim() }, "-created_date", 50).catch(() => []),
        base44.entities.SupportCall.filter({ caller_id: searchUser.trim() }, "-created_date", 50).catch(() => []),
      ]);
      setHistoryResults({ tickets: uTickets, calls: uCalls });
    } catch {
      setHistoryResults({ tickets: [], calls: [] });
    }
  };

  const queuedCalls = calls.filter((c) => c.status === "queued" || c.status === "connecting" || c.status === "ringing");
  const activeCalls = calls.filter((c) => c.status === "connected");
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const myTickets = tickets.filter((t) => t.assigned_agent_id === user.id && t.status !== "resolved" && t.status !== "closed");

  const tabs = [
    { key: "calls", label: "Call Queue", icon: Phone, count: queuedCalls.length },
    { key: "chats", label: "Live Chats", icon: MessageSquare, count: openTickets.length },
    { key: "tickets", label: "Tickets", icon: Ticket, count: tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length },
    { key: "history", label: "History", icon: History, count: 0 },
  ];

  const renderOrderContext = (ctx) => {
    if (!ctx) return null;
    try {
      const o = JSON.parse(ctx);
      return (
        <div className="mt-2 p-2 rounded-lg bg-saffron/5 border border-saffron/10 text-xs space-y-0.5">
          <p className="font-bold text-saffron">Order Context</p>
          <p className="text-foreground/60">#{o.order_number} · {o.store_name}</p>
          <p className="text-foreground/60">Customer: {o.customer_name} · Status: {o.status}</p>
          {o.rider_name && <p className="text-foreground/60">Rider: {o.rider_name}</p>}
        </div>
      );
    } catch { return null; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>
      <Footer /></div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <PullToRefresh onRefresh={load}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">Support Dashboard</h1>
            <p className="text-foreground/50 text-sm mt-1">Answer calls, reply to chats, and manage tickets.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-2xl border border-border p-4"><Phone className="w-5 h-5 text-saffron mb-2" /><p className="text-2xl font-bold text-foreground">{queuedCalls.length}</p><p className="text-xs text-foreground/40">Queued Calls</p></div>
            <div className="bg-card rounded-2xl border border-border p-4"><MessageSquare className="w-5 h-5 text-terai mb-2" /><p className="text-2xl font-bold text-foreground">{activeCalls.length}</p><p className="text-xs text-foreground/40">Active Calls</p></div>
            <div className="bg-card rounded-2xl border border-border p-4"><Ticket className="w-5 h-5 text-blue-500 mb-2" /><p className="text-2xl font-bold text-foreground">{openTickets.length}</p><p className="text-xs text-foreground/40">Open Tickets</p></div>
            <div className="bg-card rounded-2xl border border-border p-4"><User className="w-5 h-5 text-purple-500 mb-2" /><p className="text-2xl font-bold text-foreground">{myTickets.length}</p><p className="text-xs text-foreground/40">Assigned to Me</p></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={"px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 " + (tab === t.key ? "bg-background text-saffron shadow-sm" : "text-foreground/50")}>
                <t.icon className="w-4 h-4" /> {t.label}
                {t.count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-saffron/10 text-saffron text-[10px]">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Call Queue */}
          {tab === "calls" && (
            <div className="space-y-3">
              {queuedCalls.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center"><Phone className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No calls in queue.</p></div>
              ) : (
                queuedCalls.map((c) => (
                  <div key={c.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-foreground">{c.caller_name}</p>
                      <p className="text-xs text-foreground/40 capitalize">{c.caller_type} · {c.call_type === "callback" ? "Callback" : "Incoming"}</p>
                      {c.call_type === "callback" && c.scheduled_time && <p className="text-xs text-foreground/50">Preferred: {c.scheduled_time}</p>}
                      {c.queue_position && <p className="text-xs text-saffron font-bold mt-0.5">Queue #{c.queue_position} · ~{Math.ceil((c.estimated_wait_seconds || 45) / 60)} min wait</p>}
                      {renderOrderContext(c.order_context)}
                    </div>
                    <button onClick={() => handleAnswer(c)} className="px-4 py-2 rounded-xl bg-terai text-white text-sm font-bold flex items-center gap-1.5 hover:bg-terai/90">
                      <Phone className="w-4 h-4" /> Answer
                    </button>
                  </div>
                ))
              )}
              {activeCalls.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold text-sm text-foreground/60 mb-2">Active Calls</h3>
                  {activeCalls.map((c) => (
                    <div key={c.id} className="bg-terai/5 rounded-2xl border border-terai/20 p-4 flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm text-foreground">{c.caller_name}</p>
                        <p className="text-xs text-terai flex items-center gap-1"><Clock className="w-3 h-3" /> Connected</p>
                        {renderOrderContext(c.order_context)}
                      </div>
                      <button onClick={() => handleEndCall(c.id)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center gap-1.5"><PhoneOff className="w-4 h-4" /> End</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Chats / Tickets */}
          {(tab === "chats" || tab === "tickets") && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                {openTickets.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-8 text-center"><Ticket className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No open tickets.</p></div>
                ) : (
                  openTickets.map((t) => (
                    <button key={t.id} onClick={() => setSelectedTicket(t)} className={"w-full text-left bg-card rounded-2xl border p-4 transition-colors " + (selectedTicket?.id === t.id ? "border-saffron" : "border-border hover:border-saffron/40")}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm text-foreground truncate">{t.subject}</p>
                        <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (statusColors[t.status] || "bg-muted")}>{t.status?.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-xs text-foreground/40">{t.user_name} · {categoryLabels[t.category] || t.category}</p>
                      {t.escalated && <p className="text-[10px] font-bold text-red-500 mt-1">⚠ ESCALATED</p>}
                    </button>
                  ))
                )}
              </div>
              <div>
                {selectedTicket ? (
                  <div className="bg-card rounded-2xl border border-border p-4 sticky top-24">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm text-foreground">{selectedTicket.subject}</p>
                        <p className="text-xs text-foreground/40">{selectedTicket.user_name} · {selectedTicket.user_email || ""}</p>
                      </div>
                      <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (statusColors[selectedTicket.status] || "bg-muted")}>{selectedTicket.status?.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-xs text-foreground/60 mb-2 p-2 rounded-lg bg-muted/50">{selectedTicket.description}</p>
                    {renderOrderContext(selectedTicket.order_context)}
                    <div className="flex flex-wrap gap-2 my-3">
                      <button onClick={() => handleAssign(selectedTicket.id)} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-foreground/70 hover:text-saffron">Assign to Me</button>
                      <button onClick={() => handleStatus(selectedTicket.id, "waiting")} className="px-3 py-1.5 rounded-lg bg-blue-50 text-xs font-bold text-blue-500 dark:bg-blue-500/10">Waiting</button>
                      <button onClick={() => handleStatus(selectedTicket.id, "resolved")} className="px-3 py-1.5 rounded-lg bg-terai/10 text-xs font-bold text-terai flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolve</button>
                      <button onClick={() => handleEscalate(selectedTicket.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-xs font-bold text-red-500 dark:bg-red-500/10 flex items-center gap-1"><ArrowUpCircle className="w-3 h-3" /> Escalate</button>
                    </div>
                    <SupportChat ticketId={selectedTicket.id} user={user} ticketStatus={selectedTicket.status} onStatusChange={load} />
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border border-border p-8 text-center"><MessageSquare className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">Select a ticket to view chat.</p></div>
                )}
              </div>
            </div>
          )}

          {/* History */}
          {tab === "history" && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">User History Lookup</h3>
                <div className="flex gap-2">
                  <input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Enter user ID..." className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm" />
                  <button onClick={searchHistory} className="px-4 h-10 rounded-xl bg-saffron text-white text-sm font-bold">Search</button>
                </div>
                <p className="text-xs text-foreground/40 mt-2">Search by customer, rider, or merchant user ID to view their tickets and call history.</p>
              </div>
              {historyResults.tickets.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 className="font-bold text-sm text-foreground mb-2">Tickets ({historyResults.tickets.length})</h3>
                  <div className="space-y-2">
                    {historyResults.tickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div><p className="text-sm font-bold text-foreground">{t.subject}</p><p className="text-xs text-foreground/40">{categoryLabels[t.category] || t.category} · {new Date(t.created_date).toLocaleDateString()}</p></div>
                        <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (statusColors[t.status] || "bg-muted")}>{t.status?.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {historyResults.calls.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 className="font-bold text-sm text-foreground mb-2">Call Logs ({historyResults.calls.length})</h3>
                  <div className="space-y-2">
                    {historyResults.calls.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div><p className="text-sm font-bold text-foreground">{c.call_type === "callback" ? "Callback" : "Call"} · {c.caller_name}</p><p className="text-xs text-foreground/40">{new Date(c.started_at || c.created_date).toLocaleString()}</p></div>
                        <span className="text-xs text-foreground/50">{c.duration_seconds ? c.duration_seconds + "s" : c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {historyResults.tickets.length === 0 && historyResults.calls.length === 0 && searchUser && (
                <div className="bg-card rounded-2xl border border-border p-8 text-center"><History className="w-10 h-10 text-foreground/20 mx-auto mb-2" /><p className="text-sm text-foreground/40">No history found for this user.</p></div>
              )}
            </div>
          )}
        </div>
        </PullToRefresh>
      </main>
      {activeCall && (
        <AgentCallPanel
          callId={activeCall.id}
          agent={user}
          callerName={activeCall.caller_name}
          callerType={activeCall.caller_type}
          onClose={() => { setActiveCall(null); load(); }}
        />
      )}
      <Footer />
    </div>
  );
}