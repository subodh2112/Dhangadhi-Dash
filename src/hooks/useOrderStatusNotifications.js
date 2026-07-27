import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { requestNotificationPermission, sendBrowserNotification } from "@/lib/orderNotifications";

const statusMessages = {
  accepted: { title: "Order Accepted! 🎉", body: (o) => `Your order ${o.order_number} from ${o.store_name} has been accepted.` },
  preparing: { title: "Preparing Your Order 👨‍🍳", body: (o) => `Your order ${o.order_number} is being prepared with care.` },
  ready_for_pickup: { title: "Order Ready for Pickup 📦", body: (o) => `Your order ${o.order_number} is ready and waiting for a rider.` },
  rider_assigned: { title: "Rider Assigned 🏍️", body: (o) => `A rider${o.rider_name ? ` (${o.rider_name})` : ""} has been assigned to your order ${o.order_number}.` },
  picked_up: { title: "Order Picked Up! 🛵", body: (o) => `Your order ${o.order_number} has been picked up and is heading your way.` },
  on_the_way: { title: "On the Way! 🚀", body: (o) => `Your order ${o.order_number} from ${o.store_name} is on the way to your address.` },
  delivered: { title: "Order Delivered! ✅", body: (o) => `Your order ${o.order_number} has been delivered. Enjoy!` },
  rejected: { title: "Order Update ⚠️", body: (o) => `Your order ${o.order_number} from ${o.store_name} has been rejected.` },
};

export function useOrderStatusNotifications() {
  const { user, isAuthenticated } = useAuth();
  const orderStatusesRef = useRef(new Map());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (user.role !== "user" && user.role !== "customer") return;

    // Request notification permission once
    requestNotificationPermission();

    // Establish baseline: fetch current orders for this user
    const initBaseline = async () => {
      try {
        const orders = await base44.entities.Order.filter({}, "-created_date", 50);
        const myOrders = orders.filter(
          (o) => o.created_by_id === user.id || o.customer_email === user.email
        );
        myOrders.forEach((o) => {
          orderStatusesRef.current.set(o.id, o.status);
        });
        initializedRef.current = true;
      } catch {
        initializedRef.current = true;
      }
    };

    initBaseline();

    // Subscribe to real-time order updates
    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (!initializedRef.current) return;
      if (event.type !== "update" && event.type !== "create") return;

      const order = event.data;
      if (!order) return;

      // Only notify for this user's orders
      const isMine = order.created_by_id === user.id || order.customer_email === user.email;
      if (!isMine) return;

      const prevStatus = orderStatusesRef.current.get(order.id);
      const newStatus = order.status;

      // On create or status change, fire notification
      if (event.type === "create" || (prevStatus && prevStatus !== newStatus)) {
        const msg = statusMessages[newStatus];
        if (msg) {
          sendBrowserNotification("Dhangadhi Dash — " + msg.title, msg.body(order));
        }
      }

      // Update the tracked status
      orderStatusesRef.current.set(order.id, newStatus);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [isAuthenticated, user?.id, user?.email, user?.role]);
}