import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Gift, Loader2, CheckCircle2, Star } from "lucide-react";

const levels = [
  { name: "Bronze", min: 0, color: "bg-amber-700", perk: "5% bonus points on orders" },
  { name: "Silver", min: 500, color: "bg-gray-400", perk: "Free delivery on orders above Rs. 500" },
  { name: "Gold", min: 1500, color: "bg-amber-500", perk: "10% bonus points + priority support" },
  { name: "Platinum", min: 3000, color: "bg-cyan-500", perk: "Exclusive offers + free delivery" },
  { name: "Diamond", min: 5000, color: "bg-purple-500", perk: "VIP concierge + 15% bonus points" },
];

export default function LoyaltyRewards() {
  const { toast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ points: "", reward_type: "free_delivery" });
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const wallets = await base44.entities.LoyaltyWallet.filter({}, "-created_date", 1);
      setWallet(wallets[0] || { points: 0, level: "Bronze", total_spent: 0, rewards_redeemed: 0 });
      const rw = await base44.entities.Reward.filter({}, "-created_date", 20);
      setRewards(rw);
    } catch {
      setWallet({ points: 0, level: "Bronze", total_spent: 0, rewards_redeemed: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(e) {
    e.preventDefault();
    setRedeeming(true);
    try {
      await base44.entities.Reward.create({
        reward_type: form.reward_type,
        action: "redeem",
        points: -parseInt(form.points),
        description: "Redeemed " + form.points + " points for " + form.reward_type,
      });
      toast({ title: "Reward Redeemed!", description: "Your reward will be applied to your next order." });
      setForm({ points: "", reward_type: "free_delivery" });
      loadData();
    } catch (err) {
      toast({ title: "Redemption failed", description: err.message, variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  }

  const currentLevel = levels.find((l) => l.name === (wallet?.level || "Bronze")) || levels[0];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  const progress = nextLevel ? Math.min(100, ((wallet?.points || 0) - currentLevel.min) / (nextLevel.min - currentLevel.min) * 100) : 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center pt-32"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Loyalty Rewards" subtitle="Earn points on every order and unlock exclusive rewards." icon={Gift} gradient="from-amber-500 to-orange-600" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Points Card */}
        <div className="bg-gradient-to-br from-saffron to-orange-600 rounded-3xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide">Your Points</p>
              <p className="text-4xl font-extrabold">{wallet?.points || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs uppercase tracking-wide">Current Level</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-5 h-5 fill-white" />
                <p className="text-xl font-bold">{wallet?.level || "Bronze"}</p>
              </div>
            </div>
          </div>
          {nextLevel && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Progress to {nextLevel.name}</span>
                <span>{wallet?.points || 0} / {nextLevel.min}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: progress + "%" }} />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-xl font-bold text-foreground">Rs. {wallet?.total_spent?.toFixed(0) || 0}</p>
            <p className="text-xs text-foreground/50">Total Spent</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-xl font-bold text-foreground">{wallet?.rewards_redeemed || 0}</p>
            <p className="text-xs text-foreground/50">Rewards Redeemed</p>
          </div>
        </div>

        {/* Levels */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display font-bold text-foreground mb-4">Membership Levels</h2>
          <div className="space-y-3">
            {levels.map((l) => (
              <div key={l.name} className={`flex items-center justify-between p-3 rounded-xl ${l.name === currentLevel.name ? "bg-saffron/5 border border-saffron/15" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${l.color} flex items-center justify-center`}><Star className="w-4 h-4 text-white fill-white" /></div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{l.name} {l.name === currentLevel.name && <span className="text-xs text-saffron">• Current</span>}</p>
                    <p className="text-xs text-foreground/50">{l.perk}</p>
                  </div>
                </div>
                <span className="text-xs text-foreground/40">{l.min}+ pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Redeem */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display font-bold text-foreground mb-4">Redeem Points</h2>
          <form onSubmit={handleRedeem} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Points to Redeem</Label>
                <Input type="number" min="50" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} placeholder="e.g. 100" className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label>Reward Type</Label>
                <select value={form.reward_type} onChange={(e) => setForm((f) => ({ ...f, reward_type: e.target.value }))} className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="free_delivery">Free Delivery</option>
                  <option value="cashback">Cashback</option>
                  <option value="coupon">Discount Coupon</option>
                  <option value="points">Bonus Points</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={redeeming || !form.points} className="w-full h-12">
              {redeeming ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redeeming...</> : "Redeem Now"}
            </Button>
          </form>
        </div>

        {/* History */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-foreground mb-4">Reward History</h2>
          {rewards.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-4">No rewards yet. Start ordering to earn points!</p>
          ) : (
            <div className="space-y-2">
              {rewards.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${r.action === "redeem" ? "text-red-500" : "text-terai"}`} />
                    <div>
                      <p className="text-sm text-foreground">{r.description || r.action}</p>
                      <p className="text-xs text-foreground/40">{new Date(r.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${r.points < 0 ? "text-red-500" : "text-terai"}`}>{r.points > 0 ? "+" : ""}{r.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}