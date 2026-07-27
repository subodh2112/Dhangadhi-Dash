import { base44 } from "@/api/base44Client";

export const logAdminAction = async (action, targetType, targetName, details) => {
  try {
    await base44.entities.AuditLog.create({
      action,
      target_type: targetType || "",
      target_name: targetName || "",
      details: details || "",
    });
  } catch {}
};