import { base44 } from "@/api/base44Client";

export async function logSystem(eventType, action, details, severity = "low", userId = null) {
  try {
    await base44.entities.SystemLog.create({
      event_type: eventType,
      user_id: userId,
      action,
      details: typeof details === "string" ? details : JSON.stringify(details),
      severity,
      timestamp: new Date().toISOString(),
      status: "new",
    });
  } catch {}
}

export async function logError(action, error, userId = null) {
  await logSystem("error", action, { message: error?.message || String(error), stack: error?.stack?.split("\n").slice(0, 5).join("\n") }, "high", userId);
}

export async function logWarning(action, details, userId = null) {
  await logSystem("warning", action, details, "medium", userId);
}

export async function logBusiness(action, details, severity = "medium") {
  await logSystem("business", action, details, severity);
}

export async function logCritical(action, details, userId = null) {
  await logSystem("critical", action, details, "critical", userId);
}

export async function logCrash(error, errorInfo, userId = null) {
  try {
    await base44.entities.CrashReport.create({
      error_message: error?.message || String(error),
      stack_trace: error?.stack || "",
      component_stack: errorInfo?.componentStack || "",
      user_id: userId,
      device_info: JSON.stringify({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href,
      }),
      url: window.location.href,
      severity: "high",
      status: "new",
    });
  } catch {}
}