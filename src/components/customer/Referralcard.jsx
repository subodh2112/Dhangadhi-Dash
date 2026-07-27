import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Share2, Users, Gift, Check, Loader2, UserPlus } from "lucide-react";
import { ensureReferralCode, getReferralStats } from "@/lib/loyalty";

export default function ReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, pointsEarned: 0, referrals: [] });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (user?.id) {
        const c = await ensureReferralCode(user);
        setCode(c || "");
        const s = await getReferralStats(user.id);
        setStats(s);
      }
      setLoading(false);
    };
    init();
  }, [user?.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code || "");
    setCopied(true);
    toast({ title: "Referral code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = "Join me on Dhangadhi Dash! Use my referral code " + code + " to get 50 bonus points on your first order. Download the app today!";
    if (navigator.share) {
      navigator.share({ title: "Dhangadhi Dash Referral", text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Referral message copied to clipboard!" });
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  return (
    <div className="bg-card rounded-3xl border border-border p-6">
      <h3 className="font-display font-bold text-lg text-foreground mb-1 flex items-center gap-2"><UserPlus className="w-5 h-5 text-saffron" /> Refer & Earn</h3>
      <p className="text-sm text-foreground/50 mb-4">Share your code. They get 50 bonus points on signup, you get 50 when they complete their first order!</p>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 px-4 py-3 rounded-xl bg-saffron/5 border border-saffron/20 text-center">
          <span className="text-xl font-mono font-extrabold text-saffron tracking-wider">{code || "Generating..."}</span>
        </div>
        <button onClick={handleCopy} className="w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0">
          {copied ? <Check className="w-5 h-5 text-terai" /> : <Copy className="w-5 h-5 text-foreground/60" />}
        </button>
        <button onClick={handleShare} className="w-11 h-11 rounded-xl bg-saffron text-white flex items-center justify-center hover:bg-saffron/90 transition-colors flex-shrink-0">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <Users className="w-4 h-4 text-foreground/40 mx-auto mb-1" />
          <p className="text-lg font-display font-extrabold text-foreground">{stats.total}</p>
          <p className="text-[10px] text-foreground/40">Referred</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <Check className="w-4 h-4 text-terai mx-auto mb-1" />
          <p className="text-lg font-display font-extrabold text-foreground">{stats.completed}</p>
          <p className="text-[10px] text-foreground/40">Completed</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <Gift className="w-4 h-4 text-saffron mx-auto mb-1" />
          <p className="text-lg font-display font-extrabold text-foreground">{stats.pointsEarned}</p>
          <p className="text-[10px] text-foreground/40">Points Earned</p>
        </div>
      </div>

      {stats.referrals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <p className="text-xs font-bold text-foreground/40 uppercase">Recent Referrals</p>
          {stats.referrals.slice(0, 5).map((ref) => (
            <div key={ref.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground/60 truncate flex-1">{ref.referred_email}</span>
              <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (ref.status === "completed" || ref.status === "rewarded" ? "bg-terai/10 text-terai" : "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400")}>{ref.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}