import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Bike, Loader2, CheckCircle2, Copy, Info } from "lucide-react";

export default function PromoteUserModal({ user, targetRole, onClose, onDone }) {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("");
  const [storeCategory, setStoreCategory] = useState("restaurant");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const isMerchant = targetRole === "merchant";

  const handlePromote = async () => {
    setLoading(true);
    try {
      const payload = { action: "promote", userId: user.id, targetRole };
      if (isMerchant) {
        payload.storeName = storeName || (user.full_name || "New") + " Store";
        payload.storeCategory = storeCategory;
      }
      const res = await base44.functions.invoke("role_management", payload);
      const data = res.data || res;
      setResult(data);
      toast({ title: "User promoted to " + targetRole });
      onDone?.();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to promote";
      toast({ title: msg, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isMerchant ? <Store className="w-5 h-5 text-terai" /> : <Bike className="w-5 h-5 text-blue-500" />}
            Promote to {isMerchant ? "Merchant" : "Rider"}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-terai/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-terai" />
              </div>
            </div>
            <p className="text-center text-sm text-foreground/70">
              <strong className="text-foreground">{user.full_name || user.email}</strong> has been promoted to {targetRole}. Their customer data is preserved.
            </p>
            {isMerchant ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-[10px] uppercase font-bold text-foreground/40">Merchant Code</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-saffron">{result.merchantCode}</p>
                    <button onClick={() => { navigator.clipboard.writeText(result.merchantCode); toast({ title: "Copied!" }); }} className="text-foreground/40 hover:text-foreground"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-[10px] uppercase font-bold text-foreground/40">Store Created</p>
                  <p className="text-sm font-bold text-foreground">{result.storeName}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-[10px] uppercase font-bold text-foreground/40">Rider Code</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-saffron">{result.riderCode}</p>
                  <button onClick={() => { navigator.clipboard.writeText(result.riderCode); toast({ title: "Copied!" }); }} className="text-foreground/40 hover:text-foreground"><Copy className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
            <Button onClick={onClose} className="w-full h-10">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center">
                <span className="text-sm font-bold text-saffron">{user.full_name?.[0]?.toUpperCase() || "U"}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{user.full_name || "Unknown"}</p>
                <p className="text-xs text-foreground/40 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                This user already has an account. Their customer data (orders, wallet, rewards, addresses, referrals) will be preserved. No duplicate account will be created.
              </p>
            </div>
            {isMerchant && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder={(user.full_name || "New") + "'s Store"} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeCategory">Store Category</Label>
                  <select id="storeCategory" value={storeCategory} onChange={(e) => setStoreCategory(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm">
                    <option value="restaurant">Restaurant</option>
                    <option value="grocery">Grocery</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="fashion">Fashion</option>
                    <option value="electronics">Electronics</option>
                    <option value="general">General Store</option>
                  </select>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 h-10">Cancel</Button>
              <Button onClick={handlePromote} disabled={loading} className="flex-1 h-10">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Promote
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}