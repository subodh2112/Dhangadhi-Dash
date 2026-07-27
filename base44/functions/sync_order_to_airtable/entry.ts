import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const order_id = body.order_id || body.id || "";

    if (!order_id) {
      return Response.json({ success: false, error: "Missing order_id" }, { status: 400 });
    }

    // Fetch the order
    let order;
    try {
      order = await base44.asServiceRole.entities.Order.get(order_id);
    } catch {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    if (!order) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Get Airtable OAuth connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("airtable");

    // List available bases
    const basesRes = await fetch("https://api.airtable.com/v0/meta/bases", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const basesData = await basesRes.json();
    const bases = basesData.bases || [];
    if (bases.length === 0) {
      return Response.json({ success: false, error: "No Airtable bases found — create a base first" }, { status: 400 });
    }

    // Use the first available base (auto-discovery)
    const base = bases[0];
    const baseId = base.id;

    // List tables in the base
    const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const tablesData = await tablesRes.json();
    const tables = tablesData.tables || [];
    if (tables.length === 0) {
      return Response.json({ success: false, error: "No tables found in Airtable base" }, { status: 400 });
    }

    // Find an Orders table or use the first table
    const orderTable = tables.find(t =>
      t.name.toLowerCase().includes("order")
    ) || tables[0];
    const tableId = orderTable.id;
    const fieldNames = (orderTable.fields || []).map(f => f.name);

    // Map order data to Airtable fields by matching field names (case-insensitive)
    const orderData = {
      "Order Number": order.order_number || "",
      "Customer Name": order.customer_name || "",
      "Customer Email": order.customer_email || "",
      "Status": order.status || "",
      "Store Name": order.store_name || "",
      "Items": order.items || "",
      "Total Amount": order.total_amount || 0,
      "Subtotal": order.subtotal || 0,
      "Delivery Fee": order.delivery_fee || 0,
      "Service Charge": order.service_charge || 0,
      "Delivery Address": order.delivery_address || "",
      "Rider Name": order.rider_name || "",
      "Payment Method": order.payment_method || "",
      "Payment Status": order.payment_status || "",
      "Contact Number": order.contact_number || "",
      "Delivery Type": order.delivery_type || "",
    };

    const recordFields = {};
    for (const [key, value] of Object.entries(orderData)) {
      const match = fieldNames.find(fn => fn.toLowerCase() === key.toLowerCase());
      if (match) recordFields[match] = value;
    }

    // If no exact matches, try fuzzy matching
    if (Object.keys(recordFields).length === 0) {
      for (const fn of fieldNames) {
        const lf = fn.toLowerCase();
        if (lf.includes("order") && lf.includes("number")) recordFields[fn] = order.order_number || "";
        else if (lf.includes("customer") && lf.includes("name")) recordFields[fn] = order.customer_name || "";
        else if (lf.includes("customer") && lf.includes("email")) recordFields[fn] = order.customer_email || "";
        else if (lf === "status") recordFields[fn] = order.status || "";
        else if (lf.includes("store") && lf.includes("name")) recordFields[fn] = order.store_name || "";
        else if (lf.includes("total") || lf.includes("amount")) recordFields[fn] = order.total_amount || 0;
        else if (lf.includes("item")) recordFields[fn] = order.items || "";
        else if (lf.includes("address")) recordFields[fn] = order.delivery_address || "";
        else if (lf.includes("rider") && lf.includes("name")) recordFields[fn] = order.rider_name || "";
        else if (lf.includes("payment") && lf.includes("method")) recordFields[fn] = order.payment_method || "";
        else if (lf.includes("payment") && lf.includes("status")) recordFields[fn] = order.payment_status || "";
      }
    }

    // Create the record in Airtable
    const createRes = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: [{ fields: recordFields }]
      })
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      return Response.json({
        success: false,
        error: "Airtable API error",
        details: createData
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      record_id: createData.records?.[0]?.id || null,
      base_name: base.name,
      table_name: orderTable.name,
      fields_synced: Object.keys(recordFields).length
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});