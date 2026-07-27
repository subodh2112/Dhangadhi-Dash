import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, UserPlus, UserMinus, Crown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const segmentMeta = {
  new_user: { label: "New Users", icon: UserPlus, color: "bg-blue-50 text-blue-500 dark:bg-blue-500/10", desc: "Registered recently" },
  active_user: { label: "Active Users", icon: Users, color: "bg-terai/10 text-terai", desc: "Frequent orders" },
  inactive_user: { label: "Inactive Users", icon: UserMinus, color: "bg-amber-50 text-amber-500 dark:bg-amber-500/10", desc: "No order 30+ days" },
  high_value_user: { label: "High Value", icon: Crown, color: "bg-purple-50 text-purple-500 dark:bg-purple-500/10", desc: "High spending" },
};

export default function UserSegmentManager() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);

  const load = useCallback(async () => {
    try { setSegments(await base44.entities.UserSegment.filter({}, "-created_date", 200)); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncSegments = async () => {
    setSyncing(true);
    try {
      const orders = await base44.entities.Order.filter({ status: "delivered" }, "-created_date", 500);
      const userMap = {};
      const now = Date.now();
      orders.forEach(o => {
        const uid = o.created_by_id;
        if (!uid) return;
        if (!userMap[uid]) userMap[uid] = { user_id: uid, user_name: o.customer_name || "User", total_orders: 0, total_spent: 0, last_order_date: null };
        userMap[uid].total_orders++;
        userMap[uid].total_spent += o.total_amount || 0;
        if (!userMap[uid].last_order_date || new Date(o.created_date) > new Date(userMap[uid].last_order_date)) {
          userMap[uid].last_order_date = o.created_date;
        }
      });

      const segmentRecords = Object.values(userMap).map(u => {
        const daysSince = u.last_order_date ? Math.floor((now - new Date(u.last_order_date).getTime()) / 86400000) : 999;
        const avg = u.total_orders > 0 ? u.total_spent / u.total_orders : 0;
        let segment = "active_user";
        let isHighValue = false;
        if (u.total_orders <= 1 && daysSince < 14) segment = "new_user";
        if (daysSince >= 30) segment = "inactive_user";
        if (u.total_spent >= 5000 || avg >= 500) { segment = "high_value_user"; isHighValue = true; }
        return { ...u, segment_type: segment, avg_order_value: avg, days_since_last_order: daysSince, is_high_value: isHighValue };
      });

      await base44.entities.UserSegment.deleteMany({});
      await base44.entities.UserSegment.bulkCreate(segmentRecords.slice(0, 200));
      load();
    } catch {}
    setSyncing(false);
  };

  const counts = Object.keys(segmentMeta).reduce((acc, key) => ({ ...acc, [key]: segments.filter(s => s.segment_type === key).length }), {});
  const displayed = activeSegment ? segments.filter(s => s.segment_type === activeSegment) : [];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">User Segments</h2>
          <p className="text-sm text-foreground/50">Automatically categorize users for targeted campaigns.</p>
        </div>
        <Button onClick={syncSegments} disabled={syncing} className="bg-saffron hover:bg-saffron/90 h-9"><RefreshCw className={"w-4 h-4 " + (syncing ? "animate-spin" : "")} /> {syncing ? "Syncing..." : "Sync Segments"}</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(segmentMeta).map(([key, meta]) => (
          <button key={key} onClick={() => setActiveSegment(activeSegment === key ? null : key)} className={`bg-card rounded-2xl border p-4 text-left transition-all ${activeSegment === key ? "border-saffron ring-2 ring-saffron/20" : "border-border"}`}>
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + meta.color}><meta.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-display font-extrabold text-foreground">{counts[key] || 0}</p>
            <p className="text-xs font-bold text-foreground/60">{meta.label}</p>
            <p className="text-[10px] text-foreground/40">{meta.desc}</p>
          </button>
        ))}
      </div>

      {activeSegment && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">{segmentMeta[activeSegment].label} ({displayed.length})</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {displayed.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="font-bold text-sm text-foreground">{s.user_name}</p>
                  <p className="text-xs text-foreground/40">{s.total_orders} orders • Rs {(s.total_spent || 0).toLocaleString()} spent</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground/60">Rs {(s.avg_order_value || 0).toFixed(0)}</p>
                  <p className="text-[10px] text-foreground/40">avg • {s.days_since_last_order}d ago</p>
                </div>
              </div>
            ))}
            {displayed.length === 0 && <p className="text-sm text-foreground/40 text-center py-4">No users in this segment.</p>}
          </div>
        </div>
      )}
    </div>
  );
}