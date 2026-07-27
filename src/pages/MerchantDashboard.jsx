import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PullToRefresh from "@/components/PullToRefresh";
import MerchantOrderManager from "@/components/merchant/MerchantOrderManager";
import MerchantProductManager from "@/components/merchant/MerchantProductManager";
import MerchantAnalytics from "@/components/merchant/MerchantAnalytics";
import StoreSettingsPanel from "@/components/merchant/StoreSettingsPanel";
import MerchantEarnings from "@/components/merchant/MerchantEarnings";

import PromotionManager from "@/components/merchant/PromotionManager";
import InventoryManager from "@/components/merchant/InventoryManager";
import ReviewManager from "@/components/merchant/ReviewManager";
import MerchantReports from "@/components/merchant/MerchantReports";
import MerchantDisputeList from "@/components/merchant/MerchantDisputeList";
import MerchantAdManager from "@/components/merchant/MerchantAdManager";
import AIMerchantAssistant from "@/components/merchant/AIMerchantAssistant";
import MerchantMediaGallery from "@/components/merchant/MerchantMediaGallery";
import MerchantOverview from "@/components/merchant/MerchantOverview";
import CallSupportButton from "@/components/support/CallSupportButton";
import { ShoppingBag, Package, BarChart3, Settings, AlertCircle, Loader2, Bell, Wallet, Tag, Star, FileText, Megaphone, Brain, Image, LayoutDashboard } from "lucide-react";
import TimeGreeting from "@/components/TimeGreeting";

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "products", label: "Products", icon: Package },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "earnings", label: "Earnings", icon: Wallet },
  { key: "promotions", label: "Promos", icon: Tag },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "disputes", label: "Disputes", icon: AlertCircle },
  { key: "advertising", label: "Advertising", icon: Megaphone },
  { key: "media", label: "Media", icon: Image },
  { key: "ai_assistant", label: "AI Assistant", icon: Brain },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function MerchantDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState(null);
  const [merchantId, setMerchantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suspended, setSuspended] = useState(false);
  const [merchantCode, setMerchantCode] = useState("");
  const [notifCount, setNotifCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = async () => {
    try {
      const fullUser = await base44.auth.me();
      let sName = null, sId = null, mCode = null, isSuspended = false;

      if (fullUser.email) {
        const apps = await base44.entities.MerchantApplication.filter({ email: fullUser.email, applicant_type: "merchant", status: "account_created" }).catch(() => []);
        if (apps.length > 0) {
          mCode = apps[0].merchant_code;
          isSuspended = apps[0].is_suspended;
          if (apps[0].assigned_store_id) {
            sId = apps[0].assigned_store_id;
            try { const store = await base44.entities.Store.get(sId); sName = store?.name; } catch {}
            if (sId && fullUser.store_id !== sId) {
              try { await base44.auth.updateMe({ store_id: sId }); } catch {}
            }
          }
        }
      }

      if (!sName && fullUser.store_id) {
        sId = fullUser.store_id;
        try { const store = await base44.entities.Store.get(fullUser.store_id); sName = store?.name; } catch {}
      }

      if (!sName) {
        const stores = await base44.entities.Store.filter({}, "-created_date", 100).catch(() => []);
        const myStore = stores.find((s) => s.created_by_id === user?.id);
        sName = myStore?.name;
        sId = myStore?.id;
      }

      setStoreName(sName);
      setStoreId(sId);
      setMerchantId(fullUser.id);
      setMerchantCode(mCode);
      setSuspended(isSuspended);

      if (sId && fullUser.id) {
        try {
          const store = await base44.entities.Store.get(sId);
          if (!store.merchant_id) {
            try { await base44.entities.Store.update(sId, { merchant_id: fullUser.id }); } catch {}
          }
        } catch {}
      }

      if (sId) {
        try {
          const notifs = await base44.entities.Notification.filter({
            recipient_store_id: sId,
            recipient_type: "merchant",
            is_read: false,
          });
          setNotifCount(notifs.length);
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleRefresh = async () => { await loadData(); setRefreshKey((k) => k + 1); };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32"><Loader2 className="w-8 h-8 text-saffron animate-spin" /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="mx-auto max-w-5xl">
            <TimeGreeting subtitle="Welcome back to Dhangadhi Dash. Let's make today productive." />
            <div className="mb-6">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">Merchant Dashboard</h1>
              <div className="flex items-center gap-3 flex-wrap mt-1">
                <p className="text-foreground/50 text-sm">{storeName ? `${storeName} — manage your store` : "Manage your store, products, and orders"}</p>
                {merchantCode && <span className="text-xs font-mono font-bold text-saffron bg-saffron/10 px-3 py-1 rounded-full">{merchantCode}</span>}
                {notifCount > 0 && <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full flex items-center gap-1"><Bell className="w-3 h-3" /> {notifCount} New</span>}
              </div>
            </div>

            {suspended && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-500">Your account has been suspended. Please contact the admin to reactivate.</p>
              </div>
            )}
            {!storeName && !suspended && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-6 text-center">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-amber-500">No store linked to your account yet. Please contact the admin to assign your store.</p>
              </div>
            )}

            <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-6 overflow-x-auto no-scrollbar sticky top-20 z-10">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-background text-saffron shadow-sm" : "text-foreground/50 hover:text-foreground"}`}>
                    <Icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {storeName && (
              <>
                {activeTab === "overview" && <MerchantOverview key={`overview-${refreshKey}`} storeId={storeId} storeName={storeName} merchantId={merchantId} />}
                {activeTab === "orders" && <MerchantOrderManager key={`orders-${refreshKey}`} storeId={storeId} storeName={storeName} merchantId={merchantId} />}
                {activeTab === "products" && <MerchantProductManager key={`products-${refreshKey}`} storeId={storeId} storeName={storeName} merchantId={merchantId} />}
                {activeTab === "analytics" && <MerchantAnalytics key={`analytics-${refreshKey}`} storeId={storeId} storeName={storeName} />}
                {activeTab === "settings" && <StoreSettingsPanel key={`settings-${refreshKey}`} storeId={storeId} onUpdated={handleRefresh} />}
                {activeTab === "inventory" && <InventoryManager key={`inv-${refreshKey}`} storeId={storeId} storeName={storeName} merchantId={merchantId} />}
                {activeTab === "earnings" && <MerchantEarnings key={`earn-${refreshKey}`} storeId={storeId} storeName={storeName} merchantId={merchantId} />}
                {activeTab === "promotions" && <PromotionManager key={`promo-${refreshKey}`} storeId={storeId} storeName={storeName} merchantId={merchantId} />}
                {activeTab === "reviews" && <ReviewManager key={`rev-${refreshKey}`} storeId={storeId} storeName={storeName} />}
                {activeTab === "reports" && <MerchantReports key={`rep-${refreshKey}`} storeId={storeId} storeName={storeName} />}
                {activeTab === "disputes" && <MerchantDisputeList key={`dis-${refreshKey}`} merchantId={merchantId} />}
                {activeTab === "advertising" && <MerchantAdManager key={`ad-${refreshKey}`} merchantId={merchantId} storeId={storeId} storeName={storeName} />}
                {activeTab === "media" && <MerchantMediaGallery key={`media-${refreshKey}`} storeId={storeId} />}
                {activeTab === "ai_assistant" && <AIMerchantAssistant key={`ai-${refreshKey}`} storeId={storeId} storeName={storeName} />}
              </>
            )}
          </div>
        </PullToRefresh>
      </main>
      <Footer />
      <CallSupportButton userType="merchant" />
    </div>
  );
}