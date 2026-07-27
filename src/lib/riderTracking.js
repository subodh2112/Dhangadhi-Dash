import { base44 } from "@/api/base44Client";

const VALID_TRANSITIONS = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["rider_assigned", "cancelled"],
  rider_assigned: ["picked_up", "cancelled"],
  picked_up: ["on_the_way"],
  on_the_way: ["delivered"],
  delivered: [],
  rejected: [],
  cancelled: [],
};

export const validateStatusChange = (currentStatus, newStatus, userRole) => {
  if (userRole === "admin") return { valid: true };
  if (userRole === "customer" || userRole === "user") return { valid: false, error: "Customers cannot change order status" };
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) return { valid: false, error: "Invalid status transition" };
  return { valid: true };
};

export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.pow(Math.sin(dLng / 2), 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const calculateETA = (riderLat, riderLng, destLat, destLng, speedKmh) => {
  if (!riderLat || !riderLng || !destLat || !destLng) return { distanceKm: 0, etaMinutes: 0 };
  const distance = haversineDistance(riderLat, riderLng, destLat, destLng);
  const speed = speedKmh || 25;
  const etaMinutes = Math.ceil((distance / speed) * 60);
  return { distanceKm: Math.round(distance * 10) / 10, etaMinutes: Math.max(1, etaMinutes) };
};

export const updateRiderLocation = async (userId, riderName, lat, lng, speed, heading, orderId) => {
  try {
    await base44.entities.RiderLocation.create({
      rider_id: userId,
      rider_name: riderName,
      latitude: lat,
      longitude: lng,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date().toISOString(),
      order_id: orderId || null,
    });
    if (orderId) {
      await base44.entities.Order.update(orderId, { rider_lat: lat, rider_lng: lng }).catch(() => {});
    }
    const riders = await base44.entities.Rider.filter({ user_id: userId }).catch(() => []);
    if (riders.length > 0) {
      await base44.entities.Rider.update(riders[0].id, { latitude: lat, longitude: lng }).catch(() => {});
    }
  } catch {}
};

export const getLatestRiderLocation = async (riderId) => {
  try {
    const locations = await base44.entities.RiderLocation.filter({ rider_id: riderId }, "-created_date", 1);
    return locations[0] || null;
  } catch { return null; }
};

export const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone || "N/A";
  return phone.slice(0, 4) + "XX-XX" + phone.slice(-2);
};