import { useAuth } from "@/lib/AuthContext";

// ============================================================
//  PERMISSION CONSTANTS
// ============================================================
export const PERMS = {
  DASHBOARD_VIEW: "dashboard.view",

  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",

  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_MANAGE: "customers.manage",

  MERCHANTS_VIEW: "merchants.view",
  MERCHANTS_MANAGE: "merchants.manage",
  MERCHANTS_APPROVE: "merchants.approve",

  RIDERS_VIEW: "riders.view",
  RIDERS_MANAGE: "riders.manage",
  RIDERS_APPROVE: "riders.approve",

  ORDERS_VIEW: "orders.view",
  ORDERS_MANAGE: "orders.manage",

  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_MANAGE: "payments.manage",

  WITHDRAWALS_VIEW: "withdrawals.view",
  WITHDRAWALS_MANAGE: "withdrawals.manage",

  MARKETING_VIEW: "marketing.view",
  MARKETING_CREATE: "marketing.create",
  MARKETING_EDIT: "marketing.edit",

  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
  REFUNDS_MANAGE: "refunds.manage",
  SETTLEMENTS_VIEW: "settlements.view",
  SETTLEMENTS_MANAGE: "settlements.manage",

  OPERATIONS_VIEW: "operations.view",
  OPERATIONS_MANAGE: "operations.manage",
  DISPATCH_MANAGE: "dispatch.manage",

  REPORTS_VIEW: "reports.view",
  ANALYTICS_VIEW: "analytics.view",

  SETTINGS_MANAGE: "settings.manage",

  STAFF_MANAGE: "staff.manage",
  ROLES_MANAGE: "roles.manage",

  SUPPORT_VIEW: "support.view",
  SUPPORT_MANAGE: "support.manage",

  SYSTEM_MONITOR: "system.monitor",
  SECURITY_VIEW: "security.view",

  AI_VIEW: "ai.view",
};

// All permissions for Super Admin
const ALL_PERMISSIONS = Object.values(PERMS);

// ============================================================
//  ROLE DEFINITIONS
// ============================================================
export const ROLE_DEFS = {
  super_admin: {
    display_name: "Super Admin",
    department: "super_admin",
    description: "Full platform access with all permissions including staff and role management.",
    permissions: ALL_PERMISSIONS,
  },
  operations_manager: {
    display_name: "Operations Manager",
    department: "operations",
    description: "Manage daily delivery operations, rider dispatch, and live monitoring.",
    permissions: [
      PERMS.DASHBOARD_VIEW,
      PERMS.ORDERS_VIEW,
      PERMS.ORDERS_MANAGE,
      PERMS.OPERATIONS_VIEW,
      PERMS.OPERATIONS_MANAGE,
      PERMS.DISPATCH_MANAGE,
      PERMS.RIDERS_VIEW,
      PERMS.SUPPORT_VIEW,
    ],
  },
  marketing_manager: {
    display_name: "Marketing Manager",
    department: "marketing",
    description: "Handle campaigns, banners, coupons, referrals, and marketing analytics only.",
    permissions: [
      PERMS.DASHBOARD_VIEW,
      PERMS.MARKETING_VIEW,
      PERMS.MARKETING_CREATE,
      PERMS.MARKETING_EDIT,
      PERMS.ANALYTICS_VIEW,
      PERMS.AI_VIEW,
    ],
  },
  finance_manager: {
    display_name: "Finance Manager",
    department: "finance",
    description: "Handle revenue, transactions, settlements, payouts, and refunds.",
    permissions: [
      PERMS.DASHBOARD_VIEW,
      PERMS.FINANCE_VIEW,
      PERMS.FINANCE_MANAGE,
      PERMS.PAYMENTS_VIEW,
      PERMS.PAYMENTS_MANAGE,
      PERMS.REFUNDS_MANAGE,
      PERMS.SETTLEMENTS_VIEW,
      PERMS.SETTLEMENTS_MANAGE,
      PERMS.WITHDRAWALS_VIEW,
      PERMS.WITHDRAWALS_MANAGE,
      PERMS.REPORTS_VIEW,
    ],
  },
  customer_support: {
    display_name: "Customer Support Agent",
    department: "support",
    description: "Handle support tickets, complaints, and order issues. Limited customer data access.",
    permissions: [
      PERMS.DASHBOARD_VIEW,
      PERMS.SUPPORT_VIEW,
      PERMS.SUPPORT_MANAGE,
      PERMS.ORDERS_VIEW,
      PERMS.CUSTOMERS_VIEW,
    ],
  },
  merchant_manager: {
    display_name: "Merchant Manager",
    department: "merchant_relations",
    description: "Handle merchant applications, KYC review, store approvals, and merchant support.",
    permissions: [
      PERMS.DASHBOARD_VIEW,
      PERMS.MERCHANTS_VIEW,
      PERMS.MERCHANTS_MANAGE,
      PERMS.MERCHANTS_APPROVE,
      PERMS.SUPPORT_VIEW,
    ],
  },
  rider_manager: {
    display_name: "Rider Manager",
    department: "rider_relations",
    description: "Manage rider applications, KYC verification, profiles, and performance.",
    permissions: [
      PERMS.DASHBOARD_VIEW,
      PERMS.RIDERS_VIEW,
      PERMS.RIDERS_MANAGE,
      PERMS.RIDERS_APPROVE,
      PERMS.SUPPORT_VIEW,
    ],
  },
  analyst: {
    display_name: "Analyst",
    department: "analytics",
    description: "View-only access to sales analytics, order trends, user growth, and delivery performance.",
    permissions: [
      PERMS.DASHBOARD_VIEW,
      PERMS.REPORTS_VIEW,
      PERMS.ANALYTICS_VIEW,
      PERMS.ORDERS_VIEW,
      PERMS.CUSTOMERS_VIEW,
      PERMS.MERCHANTS_VIEW,
      PERMS.RIDERS_VIEW,
      PERMS.FINANCE_VIEW,
      PERMS.MARKETING_VIEW,
      PERMS.OPERATIONS_VIEW,
    ],
  },
};

// ============================================================
//  TAB-TO-PERMISSION MAPPING
//  Maps AdminDashboard tab keys to required permission(s).
//  A tab is shown if the user has ANY of the listed permissions.
// ============================================================
export const TAB_PERMISSIONS = {
  overview: [PERMS.DASHBOARD_VIEW],
  orders: [PERMS.ORDERS_VIEW],
  applications: [PERMS.MERCHANTS_APPROVE],
  stores: [PERMS.MERCHANTS_VIEW],
  riders: [PERMS.RIDERS_VIEW],
  customers: [PERMS.CUSTOMERS_VIEW],
  dispatch: [PERMS.DISPATCH_MANAGE],
  live_map: [PERMS.OPERATIONS_VIEW],
  commission: [PERMS.FINANCE_VIEW],
  rider_payments: [PERMS.WITHDRAWALS_MANAGE],
  merchant_payouts: [PERMS.SETTLEMENTS_MANAGE],
  finance: [PERMS.FINANCE_VIEW],
  transactions: [PERMS.PAYMENTS_VIEW],
  cod: [PERMS.PAYMENTS_MANAGE],
  refunds: [PERMS.REFUNDS_MANAGE],
  fraud_reports: [PERMS.SECURITY_VIEW],
  review_moderation: [PERMS.SUPPORT_MANAGE],
  support: [PERMS.SUPPORT_VIEW],
  reports: [PERMS.REPORTS_VIEW],
  coupons: [PERMS.MARKETING_CREATE],
  banners: [PERMS.MARKETING_EDIT],
  campaigns: [PERMS.MARKETING_CREATE],
  advertisements: [PERMS.MARKETING_EDIT],
  influencers: [PERMS.MARKETING_EDIT],
  segments: [PERMS.MARKETING_VIEW],
  templates: [PERMS.MARKETING_EDIT],
  marketing_analytics: [PERMS.ANALYTICS_VIEW],
  revenue: [PERMS.FINANCE_VIEW],
  ai_insights: [PERMS.AI_VIEW],
  fraud_ai: [PERMS.SECURITY_VIEW],
  ai_marketing: [PERMS.MARKETING_EDIT],
  system_monitor: [PERMS.SYSTEM_MONITOR],
  security: [PERMS.SECURITY_VIEW],
  production: [PERMS.SETTINGS_MANAGE],
  launch_config: [PERMS.SETTINGS_MANAGE],
  post_launch: [PERMS.SETTINGS_MANAGE],
  launch_readiness: [PERMS.SETTINGS_MANAGE],
  analytics: [PERMS.ANALYTICS_VIEW],
  activity: [PERMS.STAFF_MANAGE],
  products: [PERMS.MERCHANTS_MANAGE],
  bulk: [PERMS.MERCHANTS_MANAGE],
  heatmap: [PERMS.OPERATIONS_VIEW],
  settings: [PERMS.SETTINGS_MANAGE],
  staff: [PERMS.STAFF_MANAGE],
  roles: [PERMS.ROLES_MANAGE],
};

// ============================================================
//  PERMISSION HELPERS
// ============================================================

// Get the staff_role key for a user (defaults to super_admin for legacy admins)
export function getStaffRoleKey(user) {
  if (!user) return null;
  if (user.role !== "admin") return null;
  return user.staff_role || "super_admin";
}

// Get the permission list for a staff role
export function getRolePermissions(staffRoleKey) {
  const def = ROLE_DEFS[staffRoleKey];
  if (!def) return [];
  return def.permissions;
}

// Check if a user has a specific permission
export function hasPermission(user, permission) {
  if (!user || user.role !== "admin") return false;
  const staffRole = getStaffRoleKey(user);
  if (staffRole === "super_admin") return true;
  const perms = getRolePermissions(staffRole);
  return perms.includes(permission);
}

// Check if user has ANY of the given permissions
export function hasAnyPermission(user, permissions) {
  if (!user || user.role !== "admin") return false;
  return permissions.some((p) => hasPermission(user, p));
}

// Filter dashboard tabs based on user permissions
export function getAccessibleTabs(user, allTabs) {
  if (!user || user.role !== "admin") return [];
  const staffRole = getStaffRoleKey(user);
  if (staffRole === "super_admin") return allTabs;
  const userPerms = getRolePermissions(staffRole);
  return allTabs.filter((tab) => {
    const required = TAB_PERMISSIONS[tab.key];
    if (!required) return false;
    return required.some((p) => userPerms.includes(p));
  });
}

// Check if user is Super Admin
export function isSuperAdmin(user) {
  return getStaffRoleKey(user) === "super_admin";
}

// ============================================================
//  REACT HOOK
// ============================================================
export function usePermissions() {
  const { user } = useAuth();
  const staffRole = getStaffRoleKey(user);
  const isSuper = isSuperAdmin(user);
  const userPerms = getRolePermissions(staffRole);

  return {
    user,
    staffRole,
    staffRoleName: ROLE_DEFS[staffRole]?.display_name || "Admin",
    permissions: userPerms,
    isSuperAdmin: isSuper,
    can: (perm) => hasPermission(user, perm),
    canAny: (perms) => hasAnyPermission(user, perms),
    hasPermission,
  };
}

// ============================================================
//  PERMISSION CATALOG (for UI rendering)
// ============================================================
export const PERMISSION_CATALOG = [
  {
    category: "Dashboard",
    permissions: [{ key: PERMS.DASHBOARD_VIEW, label: "View Dashboard" }],
  },
  {
    category: "User Management",
    permissions: [
      { key: PERMS.USERS_VIEW, label: "View Users" },
      { key: PERMS.USERS_MANAGE, label: "Manage Users" },
    ],
  },
  {
    category: "Customers",
    permissions: [
      { key: PERMS.CUSTOMERS_VIEW, label: "View Customers" },
      { key: PERMS.CUSTOMERS_MANAGE, label: "Manage Customers" },
    ],
  },
  {
    category: "Merchants",
    permissions: [
      { key: PERMS.MERCHANTS_VIEW, label: "View Merchants" },
      { key: PERMS.MERCHANTS_MANAGE, label: "Manage Merchants" },
      { key: PERMS.MERCHANTS_APPROVE, label: "Approve Merchants & KYC" },
    ],
  },
  {
    category: "Riders",
    permissions: [
      { key: PERMS.RIDERS_VIEW, label: "View Riders" },
      { key: PERMS.RIDERS_MANAGE, label: "Manage Riders" },
      { key: PERMS.RIDERS_APPROVE, label: "Approve Riders & KYC" },
    ],
  },
  {
    category: "Orders",
    permissions: [
      { key: PERMS.ORDERS_VIEW, label: "View Orders" },
      { key: PERMS.ORDERS_MANAGE, label: "Manage Orders" },
    ],
  },
  {
    category: "Payments",
    permissions: [
      { key: PERMS.PAYMENTS_VIEW, label: "View Payments" },
      { key: PERMS.PAYMENTS_MANAGE, label: "Manage Payments" },
    ],
  },
  {
    category: "Withdrawals & Payouts",
    permissions: [
      { key: PERMS.WITHDRAWALS_VIEW, label: "View Withdrawals" },
      { key: PERMS.WITHDRAWALS_MANAGE, label: "Approve Withdrawals" },
      { key: PERMS.SETTLEMENTS_VIEW, label: "View Settlements" },
      { key: PERMS.SETTLEMENTS_MANAGE, label: "Manage Settlements" },
    ],
  },
  {
    category: "Finance",
    permissions: [
      { key: PERMS.FINANCE_VIEW, label: "View Finance" },
      { key: PERMS.FINANCE_MANAGE, label: "Manage Finance" },
      { key: PERMS.REFUNDS_MANAGE, label: "Process Refunds" },
    ],
  },
  {
    category: "Marketing",
    permissions: [
      { key: PERMS.MARKETING_VIEW, label: "View Marketing" },
      { key: PERMS.MARKETING_CREATE, label: "Create Campaigns & Coupons" },
      { key: PERMS.MARKETING_EDIT, label: "Edit Banners & Ads" },
    ],
  },
  {
    category: "Operations",
    permissions: [
      { key: PERMS.OPERATIONS_VIEW, label: "View Operations" },
      { key: PERMS.OPERATIONS_MANAGE, label: "Manage Operations" },
      { key: PERMS.DISPATCH_MANAGE, label: "Manage Dispatch" },
    ],
  },
  {
    category: "Support",
    permissions: [
      { key: PERMS.SUPPORT_VIEW, label: "View Support Tickets" },
      { key: PERMS.SUPPORT_MANAGE, label: "Manage Support & Moderation" },
    ],
  },
  {
    category: "Reports & Analytics",
    permissions: [
      { key: PERMS.REPORTS_VIEW, label: "View Reports" },
      { key: PERMS.ANALYTICS_VIEW, label: "View Analytics" },
      { key: PERMS.AI_VIEW, label: "View AI Insights" },
    ],
  },
  {
    category: "System & Security",
    permissions: [
      { key: PERMS.SYSTEM_MONITOR, label: "System Monitoring" },
      { key: PERMS.SECURITY_VIEW, label: "Security Dashboard" },
      { key: PERMS.SETTINGS_MANAGE, label: "Manage Settings" },
    ],
  },
  {
    category: "Staff & Roles",
    permissions: [
      { key: PERMS.STAFF_MANAGE, label: "Manage Staff Accounts" },
      { key: PERMS.ROLES_MANAGE, label: "Manage Roles & Permissions" },
    ],
  },
];