import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { ShieldCheck, KeyRound, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ActivateStaff() {
  const [step, setStep] = useState("code");
  const [staffCode, setStaffCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [roleName, setRoleName] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookupCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await base44.functions.invoke("staff_invitation", {
        action: "lookup_code",
        staff_code: staffCode.trim().toUpperCase(),
      });
      const data = response.data || response;

      if (data.status === "accepted") {
        setError("This staff code has already been activated. Please log in.");
        setStep("error");
        return;
      }

      setEmail(data.email);
      setToken(data.token);
      setRoleName(data.role_display_name);
      setFullName(data.full_name);

      // Send OTP to the staff member's email
      try {
        await base44.auth.resendOtp(data.email);
        toast({ title: "Verification code sent", description: "Check your email for the 6-digit code." });
      } catch {
        // OTP might already be sent during registration
      }

      setStep("otp");
    } catch (err) {
      const errData = err?.response?.data || err;
      setError(errData.error || err.message || "Invalid staff code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Step 1: Verify OTP
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }

      // Step 2: Accept the invitation (updates role to admin + staff_role)
      const response = await base44.functions.invoke("staff_invitation", {
        action: "accept",
        token,
        full_name: fullName,
      });
      const data = response.data || response;

      if (data.success) {
        setStep("success");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to activate account");
      }
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  function handleResendOtp() {
    base44.auth.resendOtp(email).then(() => {
      toast({ title: "Code resent", description: "Check your email." });
    }).catch(() => {
      toast({ title: "Failed to resend code", variant: "destructive" });
    });
  }

  // --- ERROR STEP ---
  if (step === "error") {
    return (
      <AuthLayout icon={AlertCircle} title="Activation Error" subtitle="We couldn't process this staff code">
        <div className="text-center py-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground/70 text-sm mb-6">{error}</p>
          <Button onClick={() => { setStep("code"); setError(""); }} variant="outline" className="w-full h-11">Try Again</Button>
          <Button onClick={() => { window.location.href = "/login"; }} variant="ghost" className="w-full h-11 mt-2">Go to Login</Button>
        </div>
      </AuthLayout>
    );
  }

  // --- SUCCESS STEP ---
  if (step === "success") {
    return (
      <AuthLayout icon={CheckCircle} title="Account Activated!" subtitle="Your staff account is ready">
        <div className="text-center py-4">
          <CheckCircle className="w-16 h-16 text-terai mx-auto mb-4" />
          <p className="text-foreground/70 text-sm mb-2">
            You are now a <span className="font-bold text-saffron">{roleName}</span>
          </p>
          <p className="text-foreground/50 text-xs mb-6">Redirecting to your dashboard...</p>
          <Loader2 className="w-6 h-6 text-saffron animate-spin mx-auto" />
        </div>
      </AuthLayout>
    );
  }

  // --- OTP STEP ---
  if (step === "otp") {
    return (
      <AuthLayout icon={Mail} title="Verify Your Email" subtitle={"We sent a 6-digit code to " + email}>
        <div className="mb-4 p-3 rounded-lg bg-saffron/5 border border-saffron/15 text-center">
          <p className="text-xs text-foreground/50">Activating as</p>
          <p className="font-bold text-sm text-foreground">{fullName}</p>
          <p className="text-xs text-saffron">{roleName}</p>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={handleVerifyOtp}>
          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" disabled={loading || otpCode.length < 6} className="w-full h-12 font-medium">
            {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating...</>) : "Activate Account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Didn't receive the code?{" "}
            <button type="button" onClick={handleResendOtp} className="text-primary font-medium hover:underline">Resend</button>
          </p>
        </form>
      </AuthLayout>
    );
  }

  // --- CODE ENTRY STEP ---
  return (
    <AuthLayout icon={ShieldCheck} title="Activate Staff Account" subtitle="Enter your staff code to get started">
      <form onSubmit={handleLookupCode} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="staff_code">Staff Code</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="staff_code"
              type="text"
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
              placeholder="DD-STAFF-XXXX"
              className="pl-10 h-12 font-mono font-bold tracking-wide"
              required
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">Enter the code given to you by your administrator.</p>
        </div>
        <Button type="submit" disabled={loading || staffCode.length < 3} className="w-full h-12 font-medium">
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Looking up...</>) : (<><ShieldCheck className="w-4 h-4 mr-2" /> Continue</>)}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground mt-4">
        Already activated?{" "}
        <a href="/login" className="text-primary font-medium hover:underline">Log in</a>
      </p>
    </AuthLayout>
  );
}