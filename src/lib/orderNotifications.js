import { base44 } from "@/api/base44Client";

const statusMessages = {
  accepted: { subject: "Order Accepted! 🎉", body: (o) => `Great news! Your order ${o.order_number} from ${o.store_name} has been accepted by the merchant and is now being prepared.` },
  preparing: { subject: "Your order is being prepared 👨‍🍳", body: (o) => `Your order ${o.order_number} from ${o.store_name} is now being prepared with care.` },
  ready_for_pickup: { subject: "Order ready for pickup 📦", body: (o) => `Your order ${o.order_number} from ${o.store_name} is ready and waiting for a rider to pick it up.` },
  rider_assigned: { subject: "Rider assigned to your order 🏍️", body: (o) => `A rider${o.rider_name ? ` (${o.rider_name})` : ""} has been assigned to your order ${o.order_number}. They will pick it up soon.` },
  picked_up: { subject: "Your order is on the move! 🛵", body: (o) => `Your order ${o.order_number} has been picked up by your rider and is heading your way.` },
  on_the_way: { subject: "Your delivery is on the way! 🚀", body: (o) => `Your order ${o.order_number} from ${o.store_name} is on the way to your address. Get ready!` },
  delivered: { subject: "Order delivered! ✅", body: (o) => `Your order ${o.order_number} has been delivered. Thank you for choosing Dhangadhi Dash! You earned ${Math.floor((o.total_amount || 0) / 10)} loyalty points.` },
  rejected: { subject: "Order update ⚠️", body: (o) => `Unfortunately, your order ${o.order_number} from ${o.store_name} has been rejected. ${o.rejection_reason || "Please contact support for more information."}` },
};

export async function sendOrderStatusEmail(order, newStatus) {
  if (!order?.customer_email) return;
  const msg = statusMessages[newStatus];
  if (!msg) return;
  try {
    await base44.integrations.Core.SendEmail({ to: order.customer_email, subject: msg.subject, body: msg.body(order) });
  } catch {}
}

export function sendBrowserNotification(title, body) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico", badge: "/favicon.ico" });
  }
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function sendOrderStatusNotification(order, newStatus) {
  const msg = statusMessages[newStatus];
  if (!msg) return;
  // Browser push notification
  sendBrowserNotification("Dhangadhi Dash — " + msg.subject, msg.body(order));
  // In-app notification record for the customer
  try {
    await base44.entities.Notification.create({
      recipient_type: "customer",
      recipient_user_id: order.created_by_id || "",
      title: msg.subject,
      message: msg.body(order),
      type: newStatus === "delivered" ? "order_delivered" : newStatus === "rider_assigned" ? "rider_assigned" : newStatus === "accepted" ? "order_accepted" : "general",
      related_order_id: order.id || "",
    });
  } catch {}
  // Email notification
  await sendOrderStatusEmail(order, newStatus);
}