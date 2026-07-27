import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ShieldAlert, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function AccessDenied({ userRole }) {
  const dashboard = userRole === "admin" ? "/admin" : userRole === "support_agent" ? "/support" : userRole === "merchant" ? "/merchant" : userRole === "rider" ? "/rider" : "/";
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-foreground mb-3">Access Denied</h1>
          <p className="text-foreground/50 mb-8">
            You don't have permission to access this page. Your role ({userRole}) doesn't allow access to this section.
          </p>
          <Link
            to={dashboard}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-saffron text-white font-bold hover:bg-saffron/90 transition-all"
          >
            Go to your dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function RoleRoute({ roles, children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const userRole = user?.role === "user" ? "customer" : user?.role || "customer";

  if (!roles.includes(userRole)) {
    return <AccessDenied userRole={userRole} />;
  }

  return children;
}