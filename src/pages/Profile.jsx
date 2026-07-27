import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, AlertTriangle, Loader2, MapPin, Heart, Package, Award, Settings, MapPinHouse, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MobileBackButton from "@/components/MobileBackButton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoyaltyDashboard from "@/components/customer/LoyaltyDashboard";
import ReferralCard from "@/components/customer/ReferralCard";
import AddressManager from "@/components/customer/AddressManager";
import FavoritesView from "@/components/customer/FavoritesView";
import EmergencyContactManager from "@/components/support/EmergencyContactManager";
import EmergencyButton from "@/components/support/EmergencyButton";
import FrequentCategories from "@/components/customer/FrequentCategories";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState("loyalty");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const orders = await base44.entities.Order.filter({ customer_name: user?.full_name || "" }, "-created_date", 200).catch(() => []);
        const myOrders = orders.filter((o) => o.created_by_id === user?.id || o.customer_email === user?.email);
        setOrderCount(myOrders.length);
        setTotalSpent(myOrders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + (o.total_amount || 0), 0));
      } catch {}
      setLoading(false);
    };
    if (user?.id) loadStats();
    else setLoading(false);
  }, [user?.id]);

  const sections = [
    { key: "loyalty", label: "Loyalty", icon: Award },
    { key: "addresses", label: "Addresses", icon: MapPin },
    { key: "favorites", label: "Favorites", icon: Heart },
    { key: "referral", label: "Referrals", icon: Package },
    { key: "safety", label: "Safety", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <MobileBackButton />

          <div className="bg-card rounded-3xl border border-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-saffron/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-saffron">{(user?.full_name || user?.email || "U")[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-foreground truncate">{user?.full_name || "User"}</p>
                <p className="text-sm text-foreground/50 truncate">{user?.email}</p>
                <p className="text-xs text-foreground/30 mt-0.5">Customer ID: {user?.id?.slice(0, 8) || "N/A"}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
              <div className="text-center">
                <p className="text-xl font-display font-extrabold text-foreground">{loading ? "—" : orderCount}</p>
                <p className="text-[10px] text-foreground/40 uppercase">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-display font-extrabold text-foreground">{loading ? "—" : "Rs " + totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-foreground/40 uppercase">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-display font-extrabold text-foreground">{loading ? "—" : new Date(user?.created_date || Date.now()).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</p>
                <p className="text-[10px] text-foreground/40 uppercase">Member Since</p>
              </div>
            </div>
          </div>

          <FrequentCategories />

          <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-6 overflow-x-auto no-scrollbar">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button key={section.key} onClick={() => setActiveSection(section.key)} className={"flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all " + (activeSection === section.key ? "bg-background text-saffron shadow-sm" : "text-foreground/50 hover:text-foreground")}>
                  <Icon className="w-4 h-4" /> {section.label}
                </button>
              );
            })}
          </div>

          {activeSection === "loyalty" && <LoyaltyDashboard />}
          {activeSection === "addresses" && (
            <div className="bg-card rounded-3xl border border-border p-6">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><MapPinHouse className="w-5 h-5 text-saffron" /> Saved Addresses</h3>
              <AddressManager />
            </div>
          )}
          {activeSection === "favorites" && (
            <div className="bg-card rounded-3xl border border-border p-6">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-saffron" /> Your Favorites</h3>
              <FavoritesView />
            </div>
          )}
          {activeSection === "referral" && <ReferralCard />}
          {activeSection === "safety" && (
            <div className="space-y-6">
              <div className="bg-card rounded-3xl border border-border p-6">
                <h3 className="font-display font-bold text-lg text-foreground mb-2 flex items-center gap-2"><Shield className="w-5 h-5 text-saffron" /> Emergency Contacts</h3>
                <p className="text-sm text-foreground/50 mb-4">Add trusted contacts who will be notified in case of an emergency.</p>
                <EmergencyContactManager />
              </div>
              <div className="bg-card rounded-3xl border border-border p-6">
                <h3 className="font-display font-bold text-lg text-foreground mb-2">Emergency Help</h3>
                <p className="text-sm text-foreground/50 mb-4">If you're in danger during an active order, press the button to alert our team.</p>
                <EmergencyButton userType="customer" />
              </div>
            </div>
          )}

          <div className="bg-card rounded-3xl border border-border p-6 mt-6">
            <h3 className="font-display font-bold text-lg text-foreground mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-saffron" /> Account Settings</h3>
            <p className="text-sm text-foreground/50 mb-4">Manage your account preferences and data.</p>
            <button onClick={() => setDeleteModal(true)} className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors w-full">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>
      </main>

      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground/60">This action is <strong className="text-red-500">irreversible</strong>. All your data, orders, rewards, and saved information will be permanently deleted.</p>
            <p className="text-xs text-foreground/40">Are you sure you want to delete your account?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteModal(false)} className="flex-1">Cancel</Button>
              <Button variant="destructive" disabled={deleting} onClick={async () => { setDeleting(true); try { localStorage.clear(); await logout("/"); } catch { window.location.href = "/"; } }} className="flex-1">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}