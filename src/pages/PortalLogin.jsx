import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Store, Bike, ArrowRight, ShoppingBag } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { getRolesArray } from "@/lib/roles";

const PORTAL_CONFIG = {
  merchant: {
    icon: Store,
    title: "Merchant Portal",
    subtitle: "Sign in to manage your store",
    dashboard: "/merchant",
    applyLink: "/become-a-partner",
    applyText: "Want to partner with us?",
  },
  rider: {
    icon: Bike,
    title: "Rider Portal",
    subtitle: "Sign in to start delivering",
    dashboard: "/rider",
    applyLink: "/join-as-rider",
    applyText: "Want to become a rider?",
  },
};

export default function PortalLogin({ portal = "merchant" }) {
  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.merchant;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const user = await base44.auth.me();
      const roles = getRolesArray(user);
      if (!roles.includes(portal)) {
        try { await base44.auth.logout(); } catch {}
        setError("This account doesn't have a " + portal + " role. Please use the correct portal.");
        setLoading(false);
        return;
      }
      const activeRole = user.role === "user" ? "customer" : user.role;
      if (activeRole !== portal) {
        await base44.functions.invoke("role_management", { action: "switch_role", role: portal });
      }
      sessionStorage.setItem("ddash_role_chosen", "true");
      window.location.href = config.dashboard;
    } catch (err) {
      const msg = err.message || "Invalid credentials";
      if (msg.toLowerCase().includes("verify your email")) {
        setError("Please verify your email first. Use the customer login to get a verification code.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const Icon = config.icon;

  return (
    <AuthLayout
      icon={Icon}
      title={config.title}
      subtitle={config.subtitle}
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
          ) : (
            <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground mt-4">
        {config.applyText}{" "}
        <Link to={config.applyLink} className="text-primary font-medium hover:underline">Apply here</Link>
      </p>
      <div className="mt-6 pt-6 border-t border-border">
        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ShoppingBag className="w-4 h-4" /> Customer Login
        </Link>
      </div>
    </AuthLayout>
  );
}