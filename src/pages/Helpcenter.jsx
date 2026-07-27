import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Search, LifeBuoy, MessageSquare, Plus, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/support/FAQSection";
import TicketForm from "@/components/support/TicketForm";
import ComplaintForm from "@/components/support/ComplaintForm";
import { Link } from "react-router-dom";

const categories = {
  customer: [
    { id: "order_issues", label: "Order Issues" },
    { id: "payment_problems", label: "Payment Problems" },
    { id: "refund_requests", label: "Refund Requests" },
    { id: "delivery_issues", label: "Delivery Issues" },
    { id: "account_problems", label: "Account Problems" },
  ],
  merchant: [
    { id: "order_management", label: "Order Management" },
    { id: "payment_settlement", label: "Payment Settlement" },
    { id: "store_problems", label: "Store Problems" },
    { id: "product_issues", label: "Product Issues" },
  ],
  rider: [
    { id: "delivery_problems", label: "Delivery Problems" },
    { id: "earnings_issues", label: "Earnings Issues" },
    { id: "account_verification", label: "Account Verification" },
    { id: "technical_problems", label: "Technical Problems" },
  ],
};

export default function HelpCenter() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("customer");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [tickets, setTickets] = useState([]);

  const role = user?.role === "user" ? "customer" : user?.role || "customer";

  const loadTickets = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await base44.entities.SupportTicket.filter({ user_id: user.id }, "-created_date", 5);
      setTickets(data);
    } catch {}
  }, [user?.id]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const statusColors = { open: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400", in_progress: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", waiting: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", resolved: "bg-terai/10 text-terai", closed: "bg-muted text-foreground/40" };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-saffron/10 flex items-center justify-center mx-auto mb-4"><LifeBuoy className="w-8 h-8 text-saffron" /></div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-2">Help Center</h1>
            <p className="text-sm text-foreground/50 max-w-md mx-auto">Find answers, report issues, and get the support you need.</p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-foreground/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for help..." className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40" />
          </div>

          <div className="flex gap-2 mb-6 justify-center">
            {["customer", "merchant", "rider"].map(t => (
              <button key={t} onClick={() => setActiveType(t)} className={"px-4 py-2 rounded-xl text-xs font-bold capitalize " + (activeType === t ? "bg-saffron text-white" : "bg-muted text-foreground/50")}>{t}</button>
            ))}
          </div>

          <FAQSection search={search} userType={activeType} />

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-display font-bold text-lg text-foreground mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-saffron" /> Your Tickets</h3>
              {tickets.length === 0 ? (
                <p className="text-sm text-foreground/40 mb-3">No tickets yet.</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {tickets.map(t => (
                    <Link key={t.id} to={`/support/${t.id}`} className="block p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-bold text-foreground truncate">{t.subject}</p>
                        <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full " + (statusColors[t.status] || "bg-muted")}>{t.status?.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-xs text-foreground/40">{t.category?.replace(/_/g, " ")} · {new Date(t.created_date).toLocaleDateString()}</p>
                    </Link>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowTicketForm(true)} className="flex-1 h-10 rounded-xl bg-saffron text-white text-sm font-bold flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" /> Ticket</button>
                <button onClick={() => setShowComplaintForm(true)} className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-1.5"><Flag className="w-4 h-4" /> Complaint</button>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-display font-bold text-lg text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/orders" className="block p-3 rounded-xl bg-muted/50 hover:bg-muted text-sm font-medium text-foreground">View Your Orders</Link>
                <Link to="/transactions" className="block p-3 rounded-xl bg-muted/50 hover:bg-muted text-sm font-medium text-foreground">Transaction History</Link>
                <Link to="/profile" className="block p-3 rounded-xl bg-muted/50 hover:bg-muted text-sm font-medium text-foreground">Account Settings</Link>
                {role === "rider" && <Link to="/rider" className="block p-3 rounded-xl bg-muted/50 hover:bg-muted text-sm font-medium text-foreground">Rider Dashboard</Link>}
                {role === "merchant" && <Link to="/merchant" className="block p-3 rounded-xl bg-muted/50 hover:bg-muted text-sm font-medium text-foreground">Merchant Dashboard</Link>}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      {showTicketForm && <TicketForm user={user} userType={role} categories={categories[role] || categories.customer} onClose={() => setShowTicketForm(false)} onCreated={() => { setShowTicketForm(false); loadTickets(); }} />}
      {showComplaintForm && <ComplaintForm onClose={() => setShowComplaintForm(false)} onCreated={() => setShowComplaintForm(false)} />}
    </div>
  );
}