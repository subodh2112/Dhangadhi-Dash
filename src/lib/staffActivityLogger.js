import { base44 } from "@/api/base44Client";

/**
 * Log an admin action to AdminActivityLog.
 * Call this after any admin action that should be audited.
 */
export async function logAdminAction({ action, module, details = "", severity = "info" }) {
  try {
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return;

    await base44.entities.AdminActivityLog.create({
      staff_id: user.id,
      staff_name: user.full_name || user.email,
      staff_role: user.staff_role || "super_admin",
      action,
      module,
      details,
      ip_address: "",
      severity,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Silent fail — logging should never break the main operation
    console.warn("Failed to log admin activity:", err.message);
  }
}