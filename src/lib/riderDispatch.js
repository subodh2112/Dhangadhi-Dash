import { base44 } from "@/api/base44Client";

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
};

export const dispatchToNextRider = async (order, storeId) => {
  if (!order || !order.id) return null;
  try {
    const existingRequests = await base44.entities.DeliveryRequest.filter({ order_id: order.id }).catch(() => []);
    const askedRiderIds = existingRequests.map((r) => r.rider_id).filter(Boolean);

    const riders = await base44.entities.Rider.filter({ status: "available" }).catch(() => []);
    const available = riders.filter(
      (r) => r.user_id && !askedRiderIds.includes(r.user_id) && !r.is_suspended
    );

    if (available.length === 0) return null;

    let storeLat, storeLng;
    if (storeId) {
      try {
        const store = await base44.entities.Store.get(storeId);
        storeLat = store?.latitude;
        storeLng = store?.longitude;
      } catch {}
    }

    available.sort((a, b) => {
      const distA = calculateDistance(storeLat, storeLng, a.latitude, a.longitude);
      const distB = calculateDistance(storeLat, storeLng, b.latitude, b.longitude);
      if (distA !== distB) return distA - distB;
      return (a.total_deliveries || 0) - (b.total_deliveries || 0);
    });

    const rider = available[0];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60000);

    const request = await base44.entities.DeliveryRequest.create({
      order_id: order.id,
      order_number: order.order_number || "",
      rider_id: rider.user_id,
      rider_name: rider.name,
      store_name: order.store_name || "",
      store_id: storeId || "",
      merchant_location: order.store_name || "",
      customer_location: order.delivery_address || "",
      customer_name: order.customer_name || "",
      delivery_fee: order.delivery_fee || 40,
      order_amount: order.total_amount || 0,
      status: "pending",
      sent_time: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    await base44.entities.Notification.create({
      recipient_type: "rider",
      recipient_user_id: rider.user_id,
      title: "New Delivery Request",
      message: `Order ${order.order_number} from ${order.store_name}. Rs ${order.delivery_fee || 40} delivery fee. 60 seconds to accept!`,
      type: "rider_request",
      related_order_id: order.id,
    }).catch(() => {});

    return request;
  } catch {
    return null;
  }
};

export const acceptDeliveryRequest = async (request, user) => {
  const now = new Date();
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  await base44.entities.DeliveryRequest.update(request.id, {
    status: "accepted",
    response_time: now.toISOString(),
  });

  const others = await base44.entities.DeliveryRequest.filter({ order_id: request.order_id, status: "pending" }).catch(() => []);
  for (const other of others) {
    if (other.id !== request.id) {
      await base44.entities.DeliveryRequest.update(other.id, { status: "cancelled", response_time: now.toISOString() }).catch(() => {});
    }
  }

  const order = await base44.entities.Order.get(request.order_id).catch(() => null);

  await base44.entities.Order.update(request.order_id, {
    rider_name: user?.full_name,
    rider_id: user?.id,
    status: "rider_assigned",
    delivery_otp: otp,
  });

  const riders = await base44.entities.Rider.filter({ user_id: user?.id }).catch(() => []);
  if (riders.length > 0) {
    await base44.entities.Rider.update(riders[0].id, { status: "on_delivery" }).catch(() => {});
  }

  if (order?.created_by_id) {
    await base44.entities.Notification.create({
      recipient_type: "customer",
      recipient_user_id: order.created_by_id,
      title: "Rider Assigned!",
      message: `Your rider ${user?.full_name} is on the way. Share OTP ${otp} with the rider when your order arrives.`,
      type: "rider_assigned",
      related_order_id: request.order_id,
    }).catch(() => {});
  }

  return otp;
};

export const rejectDeliveryRequest = async (request, reason = "rejected") => {
  const now = new Date();
  await base44.entities.DeliveryRequest.update(request.id, {
    status: reason,
    response_time: now.toISOString(),
  }).catch(() => {});

  const order = await base44.entities.Order.get(request.order_id).catch(() => null);
  if (order && order.status !== "rider_assigned" && order.status !== "picked_up" && order.status !== "on_the_way") {
    await dispatchToNextRider(order, request.store_id);
  }
};