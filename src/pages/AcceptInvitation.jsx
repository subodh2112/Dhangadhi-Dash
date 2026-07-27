import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { ROLE_DEFS } from "@/lib/permissions";
import { ShieldCheck, Mail, Lock, Loader2, CheckCircle, AlertCircle, KeyRound, LogOut } from "lucide-react";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

export default function AcceptInvitation() {
  const { token } = useParams();
  const [step, setStep] = useState("loading");
  const [invitation, setInvitation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    validateToken();
  }, []);

  async function validateToken() {
    try {
      const response = await base44.functions.invoke("staff_invitation", { action: "validate", token });
      const data = response.data || response;
      if (data.valid) {
        setInvitation(data);
        setFullName(data.full_name || "");
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          try {
            const me = await base44.auth.me();
            setCurrentUser(me);
            setStep("authenticated");
          } catch {
            setStep("register");
          }
        } else {
          setStep("register");
        }
      } else {
        setErrorMsg(data.error || "Invalid invitation");
        setStep("error");
      }
    } catch (err) {
      const errData = err?.response?.data || err;
      setErrorMsg(errData.error || err.message || "Failed to validate invitation");
      setStep("error");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: invitation.email, password });
      setStep("otp");
      toast({ title: "Verification code sent", description: "Check your email for the 6-digit code." });
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
        toast({
          title: "Account already exists",
          description: "Redirecting you to login. Please log in, then reopen this invitation link.",
          variant: "destructive",
        });
        setTimeout(() => {
          base44.auth.redirectToLogin(window.location.pathname);
        }, 2500);
      } else {
        toast({ title: "Registration failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: invitation.email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      await acceptInvitation();
    } catch (err) {
      toast({ title: "Invalid code", description: err.message || "Verification failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptAuthenticated() {
    setLoading(true);
    setStep("accepting");
    try {
      await acceptInvitation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to accept invitation");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvitation() {
    setStep("accepting");
    try {
      const response = await base44.functions.invoke("staff_invitation", { action: "accept", token, full_name: fullName });
      const data = response.data || response;
      if (data.success) {
        setStep("success");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to accept invitation");
      }
    } catch (err) {
      const errData = err?.response?.data || err;
      const msg = errData.error || err.message || "Failed to accept invitation";
      setErrorMsg(msg);
      setStep("error");
    }
  }

  function handleResendOtp() {
    base44.auth.resendOtp(invitation.email).then(() => {
      toast({ title: "Code resent", description: "Check your email." });
    }).catch(() => {
      toast({ title: "Failed to resend code", variant: "destructive" });
    });
  }

  function handleLogout() {
    base44.auth.logout(window.location.pathname);
  }

  // --- LOADING ---
  if (step === "loading") {
    return (
      <AuthLayout icon={ShieldCheck} title="Validating Invitation" subtitle="Please wait...">
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  // --- ERROR ---
  if (step === "error") {
    return (
      <AuthLayout icon={AlertCircle} title="Invitation Error" subtitle="We couldn't process this invitation">
        <div className="text-center py-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground/70 text-sm mb-6">{errorMsg}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.href = "/"} variant="outline" className="w-full h-11">
              Go Home
            </Button>
            {invitation && (
              <p className="text-xs text-foreground/40 mt-4">
                Need a new invitation? Contact {invitation.invited_by_name || "your administrator"}.
              </p>
            )}
          </div>
        </div>
      </AuthLayout>
    );
  }

  // --- ACCEPTING ---
  if (step === "accepting") {
    return (
      <AuthLayout icon={ShieldCheck} title="Activating Account" subtitle="Setting up your staff permissions...">
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  // --- SUCCESS ---
  if (step === "success") {
    return (
      <AuthLayout icon={CheckCircle} title="Welcome Aboard!" subtitle="Your staff account is ready">
        <div className="text-center py-4">
          <CheckCircle className="w-16 h-16 text-terai mx-auto mb-4" />
          <p className="text-foreground/70 text-sm mb-2">
            You are now a <span className="font-bold text-saffron">{invitation?.role_display_name}</span>
          </p>
          <p className="text-foreground/50 text-xs mb-6">Redirecting to your dashboard...</p>
          <Loader2 className="w-6 h-6 text-saffron animate-spin mx-auto" />
        </div>
      </AuthLayout>
    );
  }

  // --- OTP ---
  if (step === "otp") {
    return (
      <AuthLayout icon={Mail} title="Verify Your Email" subtitle={"We sent a 6-digit code to " + invitation.email}>
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{errorMsg}</div>
        )}
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
        <Button onClick={handleVerifyOtp} disabled={loading || otpCode.length < 6} className="w-full h-12 font-medium">
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>) : "Verify & Accept Invitation"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResendOtp} className="text-primary font-medium hover:underline">Resend</button>
        </p>
      </AuthLayout>
    );
  }

  // --- AUTHENTICATED (already logged in) ---
  if (step === "authenticated" && currentUser) {
    const isAlreadyAdmin = currentUser.role === "admin";
    const emailMismatch = currentUser.email !== invitation.email;
    const roleDef = ROLE_DEFS[invitation.staff_role];

    return (
      <AuthLayout icon={ShieldCheck} title="Accept Staff Invitation" subtitle={"Invited as " + invitation.role_display_name}>
        {/* Invitation Details */}
        <div className="mb-6 p-4 rounded-xl bg-saffron/5 border border-saffron/15 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-saffron" />
            <p className="font-bold text-sm text-foreground">{invitation.role_display_name}</p>
          </div>
          {roleDef && <p className="text-xs text-foreground/60">{roleDef.description}</p>}
          <div className="text-xs text-foreground/50 space-y-1 pt-1">
            <p><span className="font-medium text-foreground/70">Invited by:</span> {invitation.invited_by_name}</p>
            <p><span className="font-medium text-foreground/70">Email:</span> {invitation.email}</p>
            <p><span className="font-medium text-foreground/70">Expires:</span> {invitation.expires_at ? new Date(invitation.expires_at).toLocaleString() : "—"}</p>
          </div>
          {invitation.personal_message && (
            <p className="text-xs text-foreground/60 italic pt-1 border-t border-saffron/10">"{invitation.personal_message}"</p>
          )}
        </div>

        {isAlreadyAdmin ? (
          <div className="text-center py-4">
            <CheckCircle className="w-10 h-10 text-terai mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">You are already a staff member</p>
            <p className="text-xs text-foreground/50 mb-4">Your current role: {ROLE_DEFS[currentUser.staff_role]?.display_name || "Admin"}</p>
            <Button onClick={() => window.location.href = "/"} className="w-full h-12">Go to Dashboard</Button>
          </div>
        ) : emailMismatch ? (
          <div className="text-center py-4">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Email Mismatch</p>
            <p className="text-xs text-foreground/50 mb-1">This invitation was sent to:</p>
            <p className="text-sm font-bold text-saffron mb-4">{invitation.email}</p>
            <p className="text-xs text-foreground/50 mb-4">You are logged in as: {currentUser.email}</p>
            <Button onClick={handleLogout} variant="outline" className="w-full h-12">
              <LogOut className="w-4 h-4 mr-2" /> Log Out & Use Correct Email
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-terai/5 border border-terai/15 text-center">
              <p className="text-xs text-foreground/60 mb-1">You are logged in as</p>
              <p className="text-sm font-bold text-foreground">{currentUser.email}</p>
            </div>
            <Button onClick={handleAcceptAuthenticated} disabled={loading} className="w-full h-12 font-medium bg-saffron hover:bg-saffron/90">
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting...</>) : (<><ShieldCheck className="w-4 h-4 mr-2" /> Accept Invitation</>)}
            </Button>
          </div>
        )}
      </AuthLayout>
    );
  }

  // --- REGISTER (new user) ---
  const roleDef = invitation ? ROLE_DEFS[invitation.staff_role] : null;

  return (
    <AuthLayout icon={ShieldCheck} title="Accept Staff Invitation" subtitle={invitation ? "Invited as " + invitation.role_display_name : ""}>
      {/* Invitation Details */}
      {invitation && (
        <div className="mb-6 p-4 rounded-xl bg-saffron/5 border border-saffron/15 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-saffron" />
            <p className="font-bold text-sm text-foreground">{invitation.role_display_name}</p>
          </div>
          {roleDef && <p className="text-xs text-foreground/60">{roleDef.description}</p>}
          <div className="text-xs text-foreground/50 space-y-1 pt-1">
            <p><span className="font-medium text-foreground/70">Invited by:</span> {invitation.invited_by_name}</p>
            <p><span className="font-medium text-foreground/70">Email:</span> {invitation.email}</p>
            <p><span className="font-medium text-foreground/70">Expires:</span> {invitation.expires_at ? new Date(invitation.expires_at).toLocaleString() : "—"}</p>
          </div>
          {invitation.personal_message && (
            <p className="text-xs text-foreground/60 italic pt-1 border-t border-saffron/10">"{invitation.personal_message}"</p>
          )}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai_name">Full Name</Label>
          <Input
            id="ai_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12"
            placeholder="Your full name"
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai_email">Email</Label>
          <Input
            id="ai_email"
            type="email"
            value={invitation?.email || ""}
            disabled
            className="bg-muted/50 h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai_password">Create Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="ai_password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
              />
              <PasswordStrengthMeter password={password} />
              </div>
              </div>
              <div className="space-y-2">
              <Label htmlFor="ai_confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="ai_confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>) : (<><KeyRound className="w-4 h-4 mr-2" /> Create Account & Accept</>)}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Already have an account?{" "}
        <button onClick={() => base44.auth.redirectToLogin(window.location.pathname)} className="text-primary font-medium hover:underline">
          Log in
        </button>
      </p>
    </AuthLayout>
  );
}