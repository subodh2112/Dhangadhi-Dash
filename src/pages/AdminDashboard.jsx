import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoreManager from "@/components/admin/StoreManager";
import ProductManager from "@/components/admin/ProductManager";
import RiderManager from "@/components/admin/RiderManager";
import CouponManager from "@/components/admin/CouponManager";
import AdminOverview from "@/components/admin/AdminOverview";
import ApplicationManager from "@/components/admin/ApplicationManager";
import CustomerControlPanel from "@/components/admin/CustomerControlPanel";
import AdminOrderManager from "@/components/admin/AdminOrderManager";
import CommissionManager from "@/components/admin/CommissionManager";
import SupportManager from "@/components/admin/SupportManager";
import AdminReports from "@/components/admin/AdminReports";
import MerchantManagement from "@/components/admin/MerchantManagement";
import RiderControlPanel from "@/components/admin/RiderControlPanel";
import AdminActivityLog from "@/components/admin/AdminActivityLog";
import FinanceDashboard from "@/components/admin/FinanceDashboard";
import RefundManager from "@/components/admin/RefundManager";
import CODReconciliation from "@/components/admin/CODReconciliation";
import PaymentTransactionLog from "@/components/admin/PaymentTransactionLog";
import FraudReportManager from "@/components/admin/FraudReportManager";
import ReviewModeration from "@/components/admin/ReviewModeration";
import BulkProductManager from "@/components/admin/BulkProductManager";
import BannerManager from "@/components/admin/BannerManager";
import LiveHeatmap from "@/components/admin/LiveHeatmap";
import GoogleAnalyticsPanel from "@/components/admin/GoogleAnalyticsPanel";
import AdminSettings from "@/components/admin/AdminSettings";
import DeliveryRequestMonitor from "@/components/admin/DeliveryRequestMonitor";
import RiderPayments from "@/components/admin/RiderPayments";
import LiveOperationsMap from "@/components/admin/LiveOperationsMap";
import MerchantWithdrawalManager from "@/components/admin/MerchantWithdrawalManager";
import CampaignManager from "@/components/admin/CampaignManager";
import AdvertisementManager from "@/components/admin/AdvertisementManager";
import InfluencerManager from "@/components/admin/InfluencerManager";
import UserSegmentManager from "@/components/admin/UserSegmentManager";
import MarketingTemplateManager from "@/components/admin/MarketingTemplateManager";
import MarketingAnalytics from "@/components/admin/MarketingAnalytics";
import RevenueDashboard from "@/components/admin/RevenueDashboard";
import AIInsightsDashboard from "@/components/admin/AIInsightsDashboard";
import FraudDetectionAI from "@/components/admin/FraudDetectionAI";
import AIMarketingAutomation from "@/components/admin/AIMarketingAutomation";
import SystemMonitor from "@/components/admin/SystemMonitor";
import SecurityDashboard from "@/components/admin/SecurityDashboard";
import ProductionChecklist from "@/components/admin/ProductionChecklist";
import LaunchConfiguration from "@/components/admin/LaunchConfiguration";
import PostLaunchMonitor from "@/components/admin/PostLaunchMonitor";
import LaunchReadiness from "@/components/admin/LaunchReadiness";
import StaffManager from "@/components/admin/StaffManager";
import VehicleKycConfig from "@/components/admin/VehicleKycConfig";
import RolePermissionManager from "@/components/admin/RolePermissionManager";
import StaffActivityLog from "@/components/admin/StaffActivityLog";
import CategoryManager from "@/components/admin/CategoryManager";
import { getAccessibleTabs, getStaffRoleKey, ROLE_DEFS } from "@/lib/permissions";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, Store, Package, Bike, Ticket, FileText, Users, FileSpreadsheet, Megaphone, MapPin, Settings, BarChart3, Radio, Wallet, Navigation, DollarSign, ClipboardList, Headphones, ScrollText, Percent, Receipt, RotateCcw, Banknote, ArrowLeftRight, ShieldAlert, Star, Target, Zap, UserCheck, Layers, Mail, TrendingUp, Coins, Brain, Sparkles, Activity, Shield, ClipboardCheck, Rocket, LineChart, UserCog, KeyRound, Tags } from "lucide-react";
import TimeGreeting from "@/components/TimeGreeting";

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, component: AdminOverview },
  { key: "orders", label: "Orders", icon: ClipboardList, component: AdminOrderManager },
  { key: "applications", label: "KYC & Approvals", icon: FileText, component: ApplicationManager },
  { key: "stores", label: "Merchants", icon: Store, component: MerchantManagement },
  { key: "categories", label: "Categories", icon: Tags, component: CategoryManager },
  { key: "riders", label: "Riders", icon: Bike, component: RiderControlPanel },
  { key: "customers", label: "Customers", icon: Users, component: CustomerControlPanel },
  { key: "dispatch", label: "Dispatch", icon: Radio, component: DeliveryRequestMonitor },
  { key: "live_map", label: "Live Map", icon: Navigation, component: LiveOperationsMap },
  { key: "commission", label: "Commission", icon: Percent, component: CommissionManager },
  { key: "rider_payments", label: "Rider Payouts", icon: Wallet, component: RiderPayments },
  { key: "merchant_payouts", label: "Merchant Payouts", icon: DollarSign, component: MerchantWithdrawalManager },
  { key: "finance", label: "Finance", icon: Receipt, component: FinanceDashboard },
  { key: "transactions", label: "Transactions", icon: ArrowLeftRight, component: PaymentTransactionLog },
  { key: "cod", label: "COD Reconcile", icon: Banknote, component: CODReconciliation },
  { key: "refunds", label: "Refunds", icon: RotateCcw, component: RefundManager },
  { key: "fraud_reports", label: "Fraud Reports", icon: ShieldAlert, component: FraudReportManager },
  { key: "review_moderation", label: "Review Moderation", icon: Star, component: ReviewModeration },
  { key: "support", label: "Support", icon: Headphones, component: SupportManager },
  { key: "reports", label: "Reports", icon: FileText, component: AdminReports },
  { key: "coupons", label: "Coupons", icon: Ticket, component: CouponManager },
  { key: "banners", label: "Banners", icon: Megaphone, component: BannerManager },
  { key: "campaigns", label: "Campaigns", icon: Target, component: CampaignManager },
  { key: "advertisements", label: "Ads", icon: Zap, component: AdvertisementManager },
  { key: "influencers", label: "Influencers", icon: UserCheck, component: InfluencerManager },
  { key: "segments", label: "Segments", icon: Layers, component: UserSegmentManager },
  { key: "templates", label: "Templates", icon: Mail, component: MarketingTemplateManager },
  { key: "marketing_analytics", label: "Mkt Analytics", icon: TrendingUp, component: MarketingAnalytics },
  { key: "revenue", label: "Revenue", icon: Coins, component: RevenueDashboard },
  { key: "ai_insights", label: "AI Insights", icon: Brain, component: AIInsightsDashboard },
  { key: "fraud_ai", label: "Fraud AI", icon: ShieldAlert, component: FraudDetectionAI },
  { key: "ai_marketing", label: "AI Marketing", icon: Sparkles, component: AIMarketingAutomation },
  { key: "system_monitor", label: "Monitoring", icon: Activity, component: SystemMonitor },
  { key: "security", label: "Security", icon: Shield, component: SecurityDashboard },
  { key: "production", label: "Production", icon: ClipboardCheck, component: ProductionChecklist },
  { key: "launch_config", label: "Launch Config", icon: Rocket, component: LaunchConfiguration },
  { key: "post_launch", label: "Post-Launch", icon: LineChart, component: PostLaunchMonitor },
  { key: "launch_readiness", label: "Launch Ready", icon: Rocket, component: LaunchReadiness },
  { key: "analytics", label: "Analytics", icon: BarChart3, component: GoogleAnalyticsPanel },
  { key: "activity", label: "Activity Log", icon: ScrollText, component: AdminActivityLog },
  { key: "products", label: "Products", icon: Package, component: ProductManager },
  { key: "bulk", label: "Bulk Import", icon: FileSpreadsheet, component: BulkProductManager },
  { key: "heatmap", label: "Heatmap", icon: MapPin, component: LiveHeatmap },
  { key: "settings", label: "Settings", icon: Settings, component: AdminSettings },
  { key: "vehicle_kyc", label: "Vehicle KYC", icon: Bike, component: VehicleKycConfig },
  { key: "staff", label: "Staff", icon: UserCog, component: StaffManager },
  { key: "roles", label: "Roles & Perms", icon: KeyRound, component: RolePermissionManager },
  { key: "staff_activity", label: "Staff Logs", icon: ScrollText, component: StaffActivityLog },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const accessibleTabs = getAccessibleTabs(user, tabs);
  const safeActiveTab = accessibleTabs.some((t) => t.key === activeTab) ? activeTab : (accessibleTabs[0]?.key || "overview");
  const ActiveComponent = accessibleTabs.find((t) => t.key === safeActiveTab)?.component || AdminOverview;
  const staffRoleKey = getStaffRoleKey(user);
  const staffRoleName = ROLE_DEFS[staffRoleKey]?.display_name || "Admin";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <TimeGreeting subtitle="Welcome back to Dhangadhi Dash. Let's make today productive." />
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">Admin Dashboard</h1>
              <p className="text-foreground/50 text-sm mt-1">Manage stores, products, riders, customers, and applications across Dhangadhi.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-saffron/5 border border-saffron/20 flex-shrink-0">
              <Shield className="w-4 h-4 text-saffron" />
              <div>
                <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wide">Your Role</p>
                <p className="text-sm font-bold text-foreground">{staffRoleName}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-8 overflow-x-auto no-scrollbar">
            {accessibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    safeActiveTab === tab.key ? "bg-background text-saffron shadow-sm" : "text-foreground/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <ActiveComponent />
        </div>
      </main>
      <Footer />
    </div>
  );
}