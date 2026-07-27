import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, RefreshCw, Send, Users, Zap } from "lucide-react";
import { generateMarketingActions } from "@/lib/aiEngine";

const segmentLabels = {
  new_user: "New Users",
  active_user: "Active Users",
  inactive_user: "Inactive Users",
  high_value_user: "High Value Users",
};

const segmentColors = {
  new_user: "bg-blue-50 text-blue-500 dark:bg-blue-500/10",
  active_user: "bg-terai/10 text-terai",
  inactive_user: "bg-amber-50 text-amber-500 dark:bg-amber-500/10",
  high_value_user: "bg-purple-50 text-purple-500 dark:bg-purple-500/10",
};

export default function AIMarketingAutomation() {
  const [segments, setSegments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(null);

  const load = useCallback(async () => {
    try {
      const [segs, cmps] = await Promise.all([
        base44.entities.UserSegment.filter({}, "-created_date", 200).catch(() => []),
        base44.entities.Campaign.filter({ status: "active" }, "-created_date", 20).catch(() => []),
      ]);
      setSegments(segs);
      setCampaigns(cmps);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    try {
      const counts = Object.keys(segmentLabels).reduce((acc, key) => ({ ...acc, [key]: segs.filter(s => s.segment_type === key).length }), {});
      const result = await generateMarketingActions(counts, campaigns);
      setActions(result);
    } catch {}
    setGenerating(false);
  };

  const segs = segments;
  const counts = Object.keys(segmentLabels).reduce((acc, key) => ({ ...acc, [key]: segs.filter(s => s.segment_type === key).length }), {});

  const sendNotifications = async (action) => {
    setSending(action.segment);
    try {
      const targetUsers = segs.filter(s => s.segment_type === action.segment);
      const notifications = targetUsers.slice(0, 50).map(u => ({
        user_id: u.user_id,
        title: "Special Offer Just For You!",
        message: action.message,
        type: "promotion",
        is_read: false,
      }));
      if (notifications.length > 0) {
        await base44.entities.Notification.bulkCreate(notifications);
      }
    } catch {}
    setSending(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-saffron" /><div><h2 className="font-display font-bold text-lg text-foreground">AI Marketing Automation</h2><p className="text-xs text-foreground/50">AI-generated campaign actions for each segment</p></div></div>
        <button onClick={generate} disabled={generating} className="flex items-center gap-2 px-4 h-9 rounded-xl bg-saffron text-white text-sm font-bold disabled:opacity-40">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Generate Actions
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(segmentLabels).map(([key, label]) => (
          <div key={key} className="bg-card rounded-2xl border border-border p-4">
            <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 " + segmentColors[key]}><Users className="w-4 h-4" /></div>
            <p className="text-2xl font-display font-extrabold text-foreground">{counts[key] || 0}</p>
            <p className="text-xs text-foreground/40">{label}</p>
          </div>
        ))}
      </div>

      {actions?.actions?.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-display font-bold text-sm text-foreground">Recommended Actions</h3>
          {actions.actions.map((action, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (segmentColors[action.segment] || "bg-muted")}>{segmentLabels[action.segment] || action.segment}</span>
                  <span className="text-xs font-bold text-saffron">{action.discount_percent}% off</span>
                </div>
                <button onClick={() => sendNotifications(action)} disabled={sending === action.segment} className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-saffron text-white text-xs font-bold disabled:opacity-40">
                  {sending === action.segment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Notify Users
                </button>
              </div>
              <p className="text-sm text-foreground/70">{action.message}</p>
              <p className="text-[10px] text-foreground/40 mt-1">Action: {action.action}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-foreground/40">Click "Generate Actions" to get AI-powered marketing recommendations.</p>
        </div>
      )}
    </div>
  );
}