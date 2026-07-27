import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, ShoppingBag, Store, Bike, Shield, Phone, KeyRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

const portals = [
  { id: "customer", label: "Customer", icon: ShoppingBag, color: "bg-saffron" },
  { id: "merchant", label: "Merchant", icon: Store, color: "bg-terai" },
  { id: "rider", label: "Rider", icon: Bike, color: "bg-blue-500" },
  { id: "admin", label: "Admin", icon: Shield, color: "bg-carbon" },
];

export default function Login() {
  const [portal, setPortal] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [useStaffCode, setUseStaffCode] = useState(false);
  const [staffCode, setStaffCode] = useState("");

  const redirectAfterLogin = async () => {
    try {
      const user = await base44.auth.me();
      const role = user?.role === "user" ? "customer" : user?.role || "customer";
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let loginEmail = email;
      if (useStaffCode && portal === "admin") {
        const res = await base44.functions.invoke("staff_invitation", { action: "lookup_code", staff_code: staffCode.trim().toUpperCase() });
        const data = res.data || res;
        if (!data.email) throw new Error("Invalid staff code");
        loginEmail = data.email;
        setEmail(loginEmail);
      }
      await base44.auth.loginViaEmailPassword(loginEmail, password);
      localStorage.setItem("ddash_portal", portal);
      localStorage.setItem("ddash_remember_me", rememberMe ? "true" : "false");
      await redirectAfterLogin();
    } catch (err) {
      const msg = err.message || "Invalid credentials";
      if (msg.toLowerCase().includes("verify your email")) {
        if (useStaffCode) {
          setError("Your account needs activation. Please visit /activate-staff to activate.");
        } else {
          setNeedsOtp(true);
          try { await base44.auth.resendOtp(email); } catch {}
        }
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.verifyOtp({ email, otpCode: otp });
      await base44.auth.loginViaEmailPassword(email, password);
      localStorage.setItem("ddash_portal", portal);
      localStorage.setItem("ddash_remember_me", rememberMe ? "true" : "false");
      await redirectAfterLogin();
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    localStorage.setItem("ddash_portal", portal);
    base44.auth.loginWithProvider("google", "/");
  };

  const portalConfig = portals.find((p) => p.id === portal);

  return (
    <AuthLayout
      icon={portalConfig.icon}
      title={`${portalConfig.label} Login`}
      subtitle={`Access your ${portalConfig.label.toLowerCase()} dashboard`}
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-4 gap-2 mb-6">
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => setPortal(p.id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                portal === p.id
                  ? `${p.color} text-white border-transparent shadow-md`
                  : "border-border text-muted-foreground hover:border-saffron/40"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">{p.label}</span>
            </button>
          );
        })}
      </div>

      {portal === "customer" && !needsOtp && (
        <Button variant="outline" className="w-full h-12 text-sm font-medium mb-4" onClick={handleGoogle}>
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
      )}

      {portal === "customer" && !needsOtp && (
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">or</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {needsOtp ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Email Verification Code</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="otp"
                type="text"
                autoFocus
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="pl-10 h-12 text-center text-lg tracking-[0.3em] font-bold"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">A verification code was sent to {email}</p>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading || otp.length < 6}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Log in"
            )}
          </Button>
          <button
            type="button"
            onClick={() => { setNeedsOtp(false); setError(""); setOtp(""); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to login
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {portal === "admin" && !needsOtp && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setUseStaffCode(false)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!useStaffCode ? "bg-saffron text-white" : "bg-muted text-foreground/50"}`}>Email</button>
              <button type="button" onClick={() => setUseStaffCode(true)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${useStaffCode ? "bg-saffron text-white" : "bg-muted text-foreground/50"}`}>Staff Code</button>
            </div>
          )}
          {(portal === "merchant" || portal === "rider") && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="phone" type="tel" placeholder="+977 98XXXXXXXX" className="pl-10 h-12" />
              </div>
            </div>
          )}
          {useStaffCode && portal === "admin" ? (
            <div className="space-y-2">
              <Label htmlFor="staff_code">Staff Code</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="staff_code" type="text" autoFocus placeholder="DD-STAFF-XXXX" value={staffCode} onChange={(e) => setStaffCode(e.target.value.toUpperCase())} className="pl-10 h-12 font-mono font-bold tracking-wide" required />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">{portal === "merchant" ? "Business Email" : "Email"}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {!useStaffCode && (
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          {portal === "admin" && !useStaffCode && (
            <div className="space-y-2">
              <Label htmlFor="2fa">2FA Code</Label>
              <Input
                id="2fa"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="h-12 text-center text-lg tracking-[0.3em] font-bold"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 accent-saffron" />
            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me on this device</label>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              `Log in as ${portalConfig.label}`
            )}
          </Button>
        </form>
      )}

      {portal === "merchant" && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Want to partner with us?{" "}
          <a href="#partners" className="text-primary font-medium hover:underline">Apply here</a>
        </p>
      )}
      {portal === "rider" && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Want to become a rider?{" "}
          <a href="#partners" className="text-primary font-medium hover:underline">Join here</a>
        </p>
      )}
    </AuthLayout>
  );
}