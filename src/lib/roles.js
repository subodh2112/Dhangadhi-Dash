export const ROLE_LABELS = {
  customer: "Customer",
  merchant: "Merchant",
  rider: "Rider",
  admin: "Admin",
};

export const ROLE_DESCRIPTIONS = {
  customer: "Browse stores, order food, groceries, and more",
  merchant: "Manage your store, products, and orders",
  rider: "Accept deliveries and track earnings",
  admin: "Access the admin control panel",
};

export const ROLE_DASHBOARDS = {
  customer: "/",
  merchant: "/merchant",
  rider: "/rider",
  admin: "/admin",
};

export function getRolesArray(user) {
  if (!user) return ["customer"];
  if (!user.roles || !user.roles.trim()) {
    const r = user.role === "user" ? "customer" : user.role || "customer";
    return [r];
  }
  return user.roles
    .split(",")
    .map((r) => {
      const t = r.trim();
      return t === "user" ? "customer" : t;
    })
    .filter(Boolean);
}

export function getSuspendedRolesArray(user) {
  if (!user?.suspended_roles || !user.suspended_roles.trim()) return [];
  return user.suspended_roles
    .split(",")
    .map((r) => {
      const t = r.trim();
      return t === "user" ? "customer" : t;
    })
    .filter(Boolean);
}

export function hasRole(user, role) {
  return getRolesArray(user).includes(role);
}

export function isRoleSuspended(user, role) {
  return getSuspendedRolesArray(user).includes(role);
}

export function getActiveRole(user) {
  return user?.role === "user" ? "customer" : user?.role || "customer";
}

export function toPlatformRole(role) {
  return role === "customer" ? "user" : role;
}