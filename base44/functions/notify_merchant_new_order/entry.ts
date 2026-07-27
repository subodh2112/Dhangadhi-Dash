import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const order_id = body.order_id || body.id || "";
    const store_id = body.store_id || "";
    let merchant_id = body.merchant_id || "";
    const order_number = body.order_number || "";
    const customer_name = body.customer_name || "Customer";
    const total_amount = body.total_amount || 0;
    const items = body.items || "";

    if (!store_id && !merchant_id) {
      return Response.json({ success: false, error: "Missing store_id and merchant_id" }, { status: 400 });
    }

    // If merchant_id not provided, look up the store
    if (!merchant_id && store_id) {
      try {
        const store = await base44.asServiceRole.entities.Store.get(store_id);
        if (store) merchant_id = store.merchant_id || "";
      } catch {}
    }

    if (!merchant_id) {
      return Response.json({ success: false, error: "Could not resolve merchant_id" }, { status: 200 });
    }

    // Check if a notification already exists for this order (prevent duplicates)
    const existing = await base44.asServiceRole.entities.Notification.filter({
      related_order_id: order_id,
      type: "new_order"
    });
    if (existing.length > 0) {
      return Response.json({ success: true, message: "Notification already exists", duplicate: true });
    }

    // Create the merchant notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_type: "merchant",
      recipient_store_id: store_id,
      recipient_user_id: merchant_id,
      title: "New Order Received",
      message: `Order ${order_number} — Rs ${total_amount} • ${customer_name} • ${items || "Items"}`,
      type: "new_order",
      related_order_id: order_id,
      is_read: false,
    });

    return Response.json({ success: true, merchant_id, store_id, order_number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});