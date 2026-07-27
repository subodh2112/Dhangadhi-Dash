import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Bike, Star, Search, Ban, CheckCircle, Loader2, TrendingUp, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const vehicles = [
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
];

const emptyForm = { name: "", phone: "", vehicle_type: "motorcycle", area: "Dhangadhi" };

export default function RiderManager() {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRiders = () => {
    setLoading(true);
    base44.entities.Rider.list("-created_date", 100)
      .then(setRiders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchRiders, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Rider name is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.Rider.create({
        ...form,
        status: "available",
        rating: 4.8,
        total_deliveries: 0,
        total_earnings: 0,
        is_suspended: false,
      });
      setForm(emptyForm);
      fetchRiders();
      toast({ title: "Rider created!" });
    } catch {
      setError("Failed to create rider. Admin access required.");
    }
    setSubmitting(false);
  };

  const toggleSuspend = async (rider) => {
    setActionLoading(rider.id);
    try {
      await base44.entities.Rider.update(rider.id, {
        is_suspended: !rider.is_suspended,
        status: !rider.is_suspended ? "offline" : "available",
      });
      setRiders((prev) => prev.map((r) => r.id === rider.id ? { ...r, is_suspended: !rider.is_suspended, status: !rider.is_suspended ? "offline" : "available" } : r));
      toast({ title: rider.is_suspended ? "Rider activated" : "Rider suspended" });
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRiders = riders.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.name?.toLowerCase().includes(q) || r.rider_code?.toLowerCase().includes(q) || r.phone?.includes(q);
  });

  const inputClass = "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron";
  const labelClass = "text-xs font-bold text-foreground/60 uppercase tracking-wide mb-1.5 block";

  const statusBadge = (status, suspended) => {
    if (suspended) return "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400";
    const map = {
      available: "bg-terai/10 text-terai",
      on_delivery: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
      busy: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
      on_break: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
      offline: "bg-muted text-foreground/40",
    };
    return map[status] || map.offline;
  };

  const statusLabel = (status, suspended) => suspended ? "Suspended" : status?.replace(/_/g, " ") || "offline";

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Add Rider Form */}
        <div className="bg-card rounded-3xl border border-border p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-saffron" /> Add New Rider
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Rider Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
              </div>
              <div>
                <label className={labelClass}>Vehicle Type</label>
                <select className={inputClass} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
                  {vehicles.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Area</label>
              <input className={inputClass} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Dhangadhi Core" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-saffron text-white font-bold hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-4 h-4" /> Create Rider</>}
            </button>
          </form>
        </div>

        {/* Rider List */}
        <div className="bg-card rounded-3xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">All Riders ({riders.length})</h2>
          </div>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40"
              placeholder="Search by name, rider code, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : filteredRiders.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-8">{search ? "No riders match your search." : "No riders yet. Add one!"}</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {filteredRiders.map((r) => (
                <div key={r.id} className={`p-3 rounded-xl border ${r.is_suspended ? "border-red-200 bg-red-50/30 dark:border-red-500/20 dark:bg-red-500/5" : "border-border bg-muted/50"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0">
                      <Bike className="w-5 h-5 text-saffron" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                        {r.rider_code && <span className="text-[10px] font-mono font-bold text-saffron bg-saffron/10 px-1.5 py-0.5 rounded">{r.rider_code}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground/40 flex-wrap">
                        <span className="capitalize">{r.vehicle_type}</span>
                        {r.phone && <span>• {r.phone}</span>}
                        {r.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-saffron fill-saffron" />{r.rating.toFixed(1)}</span>}
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize ${statusBadge(r.status, r.is_suspended)}`}>{statusLabel(r.status, r.is_suspended)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2 ml-12 text-xs text-foreground/50">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {r.total_deliveries || 0} deliveries</span>
                    <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Rs {r.total_earnings || 0}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => toggleSuspend(r)}
                      disabled={actionLoading === r.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${r.is_suspended ? "bg-terai/10 text-terai hover:bg-terai/20" : "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"}`}
                    >
                      {actionLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : r.is_suspended ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      {r.is_suspended ? "Activate" : "Suspend"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}