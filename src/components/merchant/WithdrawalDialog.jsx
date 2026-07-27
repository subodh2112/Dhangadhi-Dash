import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowDownToLine, Building2, ShieldCheck, CheckCircle2, Landmark, AlertCircle } from "lucide-react";
import { linkBankAccount, requestWithdrawal } from "@/lib/merchantWallet";

export default function WithdrawalDialog({
  open,
  onOpenChange,
  wallet,
  merchantId,
  storeId,
  storeName,
  onCompleted,
}) {
  const { toast } = useToast();
  const [step, setStep] = useState("amount"); // amount | confirm | done
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bank linking form state
  const [bankName, setBankName] = useState(wallet?.bank_name || "");
  const [accountHolder, setAccountHolder] = useState(wallet?.bank_account_holder || "");
  const [accountNumber, setAccountNumber] = useState(wallet?.bank_account_number || "");
  const [bankBranch, setBankBranch] = useState(wallet?.bank_branch || "");
  const [linking, setLinking] = useState(false);

  const available = wallet?.available_balance || 0;
  const bankLinked = wallet?.bank_linked === true;

  const reset = () => {
    setStep("amount");
    setAmount("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleLinkBank = async () => {
    if (!bankName.trim() || !accountHolder.trim() || !accountNumber.trim()) {
      toast({ title: "Please fill all required bank fields", variant: "destructive" });
      return;
    }
    setLinking(true);
    const result = await linkBankAccount(wallet.id, {
      bank_name: bankName.trim(),
      bank_account_holder: accountHolder.trim(),
      bank_account_number: accountNumber.trim(),
      bank_branch: bankBranch.trim(),
    });
    setLinking(false);
    if (result.success) {
      toast({ title: "Bank account linked!", description: "Your payout account is now saved securely." });
      onCompleted();
    } else {
      toast({ title: result.error || "Failed to link bank account", variant: "destructive" });
    }
  };

  const handleProceedToConfirm = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (amt > available) {
      toast({ title: "Amount exceeds available balance", variant: "destructive" });
      return;
    }
    setStep("confirm");
  };

  const handleConfirmWithdrawal = async () => {
    const amt = Number(amount);
    setSubmitting(true);
    const accountDetails = JSON.stringify({
      bank_name: wallet.bank_name,
      account_holder: wallet.bank_account_holder,
      account_number: wallet.bank_account_number,
      branch: wallet.bank_branch || "",
    });
    const result = await requestWithdrawal(merchantId, storeId, storeName, amt, "bank_transfer", accountDetails);
    setSubmitting(false);
    if (result.success) {
      setStep("done");
    } else {
      toast({ title: result.error || "Withdrawal failed", variant: "destructive" });
    }
  };

  const handleDone = () => {
    reset();
    onCompleted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ArrowDownToLine className="w-5 h-5 text-saffron" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Request a transfer of your earnings to your linked bank account. Requests are reviewed by our finance team.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Bank linking (if not linked) */}
        {!bankLinked && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Link your bank account first to receive payouts securely.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/60">Bank Name *</label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. NIC Asia Bank"
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/60">Account Holder Name *</label>
              <input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="As per bank records"
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/60">Account Number *</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground/60">Branch (optional)</label>
              <input
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                placeholder="Branch location"
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40"
              />
            </div>
            <Button onClick={handleLinkBank} disabled={linking} className="w-full h-12 bg-saffron text-white font-bold">
              {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Landmark className="w-4 h-4" /> Link Bank Account</>}
            </Button>
          </div>
        )}

        {/* Step 2: Amount entry */}
        {bankLinked && step === "amount" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <Building2 className="w-5 h-5 text-saffron shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground/60">{wallet?.bank_name}</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {wallet?.bank_account_holder} · ****{String(wallet?.bank_account_number || "").slice(-4)}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground/60 mb-1 block">Withdrawal Amount (Rs)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full h-12 px-3 rounded-xl border border-border bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-saffron/40"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-foreground/40">Available: Rs {available.toLocaleString()}</p>
                {available > 0 && (
                  <button onClick={() => setAmount(String(available))} className="text-xs text-saffron font-bold">
                    Withdraw all
                  </button>
                )}
              </div>
            </div>
            <Button
              onClick={handleProceedToConfirm}
              disabled={!amount || Number(amount) <= 0 || Number(amount) > available}
              className="w-full h-12 bg-saffron text-white font-bold"
            >
              Review & Confirm
            </Button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {bankLinked && step === "confirm" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-saffron/5 rounded-xl p-3">
              <ShieldCheck className="w-5 h-5 text-saffron shrink-0" />
              <p className="text-xs text-foreground/70 font-medium">
                Please review your withdrawal details before confirming. This request will be sent to our finance team for processing.
              </p>
            </div>
            <div className="space-y-3 bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between">
                <span className="text-sm text-foreground/50">Amount</span>
                <span className="text-lg font-display font-extrabold text-saffron">Rs {Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/50">To Bank</span>
                <span className="text-sm font-semibold text-foreground">{wallet?.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/50">Account Holder</span>
                <span className="text-sm font-semibold text-foreground">{wallet?.bank_account_holder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/50">Account Number</span>
                <span className="text-sm font-semibold text-foreground">****{String(wallet?.bank_account_number || "").slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/50">Remaining Balance</span>
                <span className="text-sm font-semibold text-foreground">Rs {(available - Number(amount)).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("amount")} className="flex-1 h-12 font-bold">
                Back
              </Button>
              <Button onClick={handleConfirmWithdrawal} disabled={submitting} className="flex-1 h-12 bg-saffron text-white font-bold">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Confirm Withdrawal
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "done" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-terai/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-terai" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Withdrawal Requested!</h3>
              <p className="text-sm text-foreground/50 mt-1">
                Rs {Number(amount).toLocaleString()} will be transferred to your {wallet?.bank_name} account once approved by our finance team.
              </p>
            </div>
            <Button onClick={handleDone} className="w-full h-12 bg-saffron text-white font-bold">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}