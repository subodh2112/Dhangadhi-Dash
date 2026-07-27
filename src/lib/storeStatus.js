/**
 * Utility to determine if a store is currently open based on operational hours.
 * Checks: is_open flag, opening_time, closing_time.
 */

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const lower = String(timeStr).toLowerCase();
  if (lower.includes("pm") && hours !== 12) hours += 12;
  if (lower.includes("am") && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function isStoreOpen(store) {
  if (!store) return false;
  if (store.is_open === false) return false;
  if (store.is_suspended === true) return false;
  if (store.pause_orders === true) return false;

  const openStr = store.opening_time;
  const closeStr = store.closing_time;
  if (!openStr || !closeStr) return store.is_open !== false;

  const openMin = parseTimeToMinutes(openStr);
  const closeMin = parseTimeToMinutes(closeStr);
  if (openMin === null || closeMin === null) return store.is_open !== false;

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Handle overnight hours (e.g., opens 10am, closes 2am)
  if (closeMin < openMin) {
    return currentMin >= openMin || currentMin <= closeMin;
  }
  return currentMin >= openMin && currentMin <= closeMin;
}

export function getStoreStatus(store) {
  const open = isStoreOpen(store);
  return {
    open,
    label: open ? "Open" : "Closed",
    color: open ? "terai" : "red",
  };
}