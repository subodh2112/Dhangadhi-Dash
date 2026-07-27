import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch recent orders (paginate if needed)
    const orders = await base44.asServiceRole.entities.Order.list("-created_date", 500);
    const todayOrders = orders.filter((o) => {
      const orderDate = new Date(o.created_date);
      return orderDate >= startOfDay;
    });

    const totalOrders = todayOrders.length;
    const totalEarnings = todayOrders
      .filter((o) => o.payment_status === "paid" || o.payment_status === "successful")
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const deliveredCount = todayOrders.filter((o) => o.status === "delivered").length;
    const pendingCount = todayOrders.filter((o) => ["pending", "accepted", "preparing", "ready_for_pickup", "rider_assigned", "picked_up", "on_the_way"].includes(o.status)).length;
    const cancelledCount = todayOrders.filter((o) => o.status === "cancelled" || o.status === "rejected").length;

    // Top performing merchants
    const merchantMap = {};
    todayOrders.forEach((o) => {
      const name = o.store_name || "Unknown";
      if (!merchantMap[name]) merchantMap[name] = { name, orders: 0, revenue: 0 };
      merchantMap[name].orders++;
      merchantMap[name].revenue += (o.total_amount || 0);
    });
    const topMerchants = Object.values(merchantMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get admin users to send email to
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });

    // Build email
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const merchantRows = topMerchants.length > 0
      ? topMerchants.map((m, i) => `${i + 1}. ${m.name} — ${m.orders} orders, Rs ${Math.round(m.revenue).toLocaleString()}`).join("\n")
      : "No merchant activity today.";

    const emailBody = `📊 Daily Summary Report — Dhangadhi Dash
Date: ${dateStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 ORDER SUMMARY
• Total Orders Today: ${totalOrders}
• Delivered: ${deliveredCount}
• In Progress: ${pendingCount}
• Cancelled/Rejected: ${cancelledCount}
• Total Revenue: Rs ${Math.round(totalEarnings).toLocaleString()}

🏆 TOP PERFORMING MERCHANTS
${merchantRows}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated daily summary from Dhangadhi Dash.
Monitor your platform growth at the Admin Dashboard.`;

    // Send email to all admin users
    let emailsSent = 0;
    for (const admin of admins) {
      if (admin.email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            subject: `📊 Daily Summary — ${totalOrders} Orders, Rs ${Math.round(totalEarnings).toLocaleString()} Revenue`,
            body: emailBody,
          });
          emailsSent++;
        } catch {}
      }
    }

    return Response.json({
      status: "success",
      date: dateStr,
      totalOrders,
      totalEarnings: Math.round(totalEarnings),
      deliveredCount,
      pendingCount,
      cancelledCount,
      topMerchants,
      emailsSent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});