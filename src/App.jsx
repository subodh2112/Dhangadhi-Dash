import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './context/CartContext';
// Add page imports here
import { lazy, Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import RolePicker from '@/components/RolePicker';
import { getRolesArray } from '@/lib/roles';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import ErrorBoundary from '@/components/ErrorBoundary';
import OneSignalProvider from '@/components/OneSignalProvider';
const PageNotFound = lazy(() => import('./lib/PageNotFound'));
const Home = lazy(() => import('./pages/Home'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const StoreDetail = lazy(() => import('./pages/StoreDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Login = lazy(() => import('./pages/Login'));
const PortalLogin = lazy(() => import('./pages/PortalLogin'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));
const ActivateStaff = lazy(() => import('./pages/ActivateStaff'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const BecomePartner = lazy(() => import('./pages/BecomePartner'));
const JoinRider = lazy(() => import('./pages/JoinRider'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const LoyaltyRewards = lazy(() => import('./pages/LoyaltyRewards'));
const StoreCatalog = lazy(() => import('./pages/StoreCatalog'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ReviewCenter = lazy(() => import('./pages/ReviewCenter'));
const DeliveryZones = lazy(() => import('./pages/DeliveryZones'));
const OrderStatus = lazy(() => import('./pages/OrderStatus'));
const SafetyGuidelines = lazy(() => import('./pages/SafetyGuidelines'));
const FeedbackCorner = lazy(() => import('./pages/FeedbackCorner'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SupportDashboard = lazy(() => import('./pages/SupportDashboard'));
const Landing = lazy(() => import('./pages/Landing'));
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard'));
const MerchantWallet = lazy(() => import('./pages/MerchantWallet'));
const RiderDashboard = lazy(() => import('./pages/RiderDashboard'));
const RiderProfile = lazy(() => import('./pages/RiderProfile'));
const RiderWallet = lazy(() => import('./pages/RiderWallet'));
const Apply = lazy(() => import('./pages/Apply'));
const Profile = lazy(() => import('./pages/Profile'));
const Transactions = lazy(() => import('./pages/Transactions'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const SupportTicketDetail = lazy(() => import('./pages/SupportTicketDetail'));
const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-muted border-t-saffron rounded-full animate-spin"></div>
  </div>
);
const RootRoute = () => {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-saffron rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Landing />;
  const role = user?.role === 'user' ? 'customer' : user?.role || 'customer';
  const hasMultipleRoles = getRolesArray(user).length > 1;
  const roleChosen = sessionStorage.getItem('ddash_role_chosen') === 'true';
  if (hasMultipleRoles && !roleChosen && role === 'customer') {
    return <RolePicker user={user} />;
  }
  if (role === 'merchant') return <Navigate to="/merchant" replace />;
  if (role === 'rider') return <Navigate to="/rider" replace />;
  if (role === 'admin') {
    const sr = user?.staff_role || 'super_admin';
    return sr === 'super_admin' ? <Navigate to="/admin" replace /> : <Navigate to="/staff" replace />;
  }
  if (role === 'support_agent') return <Navigate to="/support" replace />;
  return <Home />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, logout } = useAuth();
  useIdleTimer(isAuthenticated, logout);
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-saffron rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <AnimatePresence mode="wait">
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
    <Suspense fallback={<PageSpinner />}>
    <Routes location={location}>
      <Route path="/login" element={<Login />} />
      <Route path="/merchant/login" element={<PortalLogin portal="merchant" />} />
      <Route path="/rider/login" element={<PortalLogin portal="rider" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<AcceptInvitation />} />
      <Route path="/activate-staff" element={<ActivateStaff />} />
      <Route path="/become-a-partner" element={<BecomePartner />} />
      <Route path="/join-as-rider" element={<JoinRider />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/stores" element={<StoreCatalog />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/reviews" element={<ReviewCenter />} />
      <Route path="/delivery-zones" element={<DeliveryZones />} />
      <Route path="/safety-guidelines" element={<SafetyGuidelines />} />
      <Route path="/feedback" element={<FeedbackCorner />} />
      <Route path="/" element={<RootRoute />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/" replace />} />}>
        <Route path="/apply" element={<Apply />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/store/:id" element={<StoreDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:id" element={<OrderConfirmation />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/support/:id" element={<SupportTicketDetail />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/loyalty-rewards" element={<LoyaltyRewards />} />
        <Route path="/order-status" element={<OrderStatus />} />
        <Route path="/merchant" element={<RoleRoute roles={["merchant", "admin"]}><MerchantDashboard /></RoleRoute>} />
        <Route path="/merchant/wallet" element={<RoleRoute roles={["merchant", "admin"]}><MerchantWallet /></RoleRoute>} />
        <Route path="/rider" element={<RoleRoute roles={["rider", "admin"]}><RiderDashboard /></RoleRoute>} />
        <Route path="/rider/profile" element={<RoleRoute roles={["rider", "admin"]}><RiderProfile /></RoleRoute>} />
        <Route path="/rider/wallet" element={<RoleRoute roles={["rider", "admin"]}><RiderWallet /></RoleRoute>} />
        <Route path="/support" element={<RoleRoute roles={["support_agent", "admin"]}><SupportDashboard /></RoleRoute>} />
        <Route path="/staff" element={<RoleRoute roles={["admin"]}><StaffDashboard /></RoleRoute>} />
        <Route path="/admin" element={<RoleRoute roles={["admin"]}><AdminDashboard /></RoleRoute>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </motion.div>
    </AnimatePresence>
  );
};


function App() {

  return (
    <ErrorBoundary>
    <OneSignalProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <CartProvider>
              <AuthenticatedApp />
            </CartProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
    </OneSignalProvider>
    </ErrorBoundary>
  )
}

export default App