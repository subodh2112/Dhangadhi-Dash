import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Award, Gift, TrendingUp, Loader2, Check, Star } from "lucide-react";
import { getOrCreateWallet, redeemPoints, getLoyaltyLevel } from "@/lib/loyalty";

const redemptionOptions = [
  { points: 100, discount: 50, label: "Rs 50 Off" },
  { points: 250, discount: 150, label: "Rs 150 Off" },
  { points: 500, discount: 350, label: "Rs 350 Off" },
  { points: 1000, discount: 800, label: "Rs 800 Off" },
];

const levelColors = { Bronze: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", Silver: "bg-gray-200 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400", Gold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400", Platinum: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400", Diamond: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" };

export default function LoyaltyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [redeemedCode, setRedeemedCode] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (user?.id) {
        const w = await getOrCreateWallet(user.id);
        setWallet(w);
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleRedeem = async (option) => {
    if (!wallet || wallet.total_points < option.points) return;
    setRedeeming(option.points);
    const code = await redeemPoints(user.id, option.points, option.discount);
    if (code) {
      const w = await getOrCreateWallet(user.id);
      setWallet(w);
      setRedeemedCode(code);
      toast({ title: "Coupon created!", description: "Code: " + code });
    } else {
      toast({ title: "Failed to redeem", variant: "destructive" });
    }
    setRedeeming(null);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;

  const points = wallet?.total_points || 0;
  const totalSpent = wallet?.total_spent || 0;
  const level = wallet?.level || "Bronze";
  const levelData = getLoyaltyLevel(totalSpent);
  const progressPct = levelData.next ? Math.min(100, Math.round(((totalSpent - levelData.min) / (levelData.next - levelData.min)) * 100)) : 100;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-saffron to-saffron/80 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Total Points</p>
            <p className="text-4xl font-display font-extrabold">{points.toLocaleString()}</p>
          </div>
          <Award className="w-12 h-12 text-white/30" />
        </div>
        <div className="pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/90 font-bold flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {level} Member</span>
            {levelData.next && <span className="text-white/60 text-xs">Rs {levelData.next - totalSpent} to {levelData.name === level ? "next level" : "unlock " + level}</span>}
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: progressPct + "%" }} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
          <span className="text-white/70 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Total Spent: Rs {totalSpent.toLocaleString()}</span>
          <span className="text-white/70 flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Redeemed: {wallet?.redeemed_points || 0} pts</span>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Gift className="w-5 h-5 text-saffron" /> Available Rewards for Your Next Order</h3>
          {points > 0 && <span className="text-xs font-bold text-terai bg-terai/10 px-2.5 py-1 rounded-full">{redemptionOptions.filter((o) => points >= o.points).length} ready to use</span>}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {redemptionOptions.map((opt) => {
            const canRedeem = points >= opt.points;
            return (
              <div key={opt.points} className={"rounded-2xl border-2 p-4 transition-all " + (canRedeem ? "border-saffron/30 bg-saffron/5" : "border-border opacity-50")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{opt.label}</span>
                    {canRedeem && <span className="text-[9px] font-bold bg-terai/10 text-terai px-1.5 py-0.5 rounded">READY</span>}
                  </div>
                  <span className="text-xs text-saffron font-bold">{opt.points} pts</span>
                </div>
                <p className="text-xs text-foreground/40 mb-3">Get Rs {opt.discount} off your next order</p>
                <button onClick={() => handleRedeem(opt)} disabled={!canRedeem || redeeming === opt.points} className="w-full h-9 rounded-xl bg-saffron text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {redeeming === opt.points ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : canRedeem ? <><Check className="w-3.5 h-3.5" /> Redeem Now</> : `Need ${opt.points - points} more pts`}
                </button>
              </div>
            );
          })}
        </div>
        {redeemedCode && (
          <div className="mt-4 p-4 rounded-xl bg-terai/10 flex items-center gap-3">
            <Check className="w-5 h-5 text-terai flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-terai">Your coupon code: {redeemedCode}</p>
              <p className="text-xs text-foreground/50">Use this code at checkout to get your discount on your next order.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}