import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");
    const headers = { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' };

    let spreadsheetId = null;
    const settings = await base44.asServiceRole.entities.Setting.filter({ key: "google_sheets_id" }).catch(() => []);
    if (settings.length > 0) spreadsheetId = settings[0].value;

    if (!spreadsheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST', headers,
        body: JSON.stringify({
          properties: { title: 'Dhangadhi Dash - Orders & Sales' },
          sheets: [
            { properties: { title: 'Orders' } },
            { properties: { title: 'Daily Summary' } },
          ],
        }),
      });
      const sheetData = await createRes.json();
      spreadsheetId = sheetData.spreadsheetId;

      await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/Orders!A1:J1?valueInputOption=RAW', {
        method: 'PUT', headers,
        body: JSON.stringify({ values: [['Order Number', 'Customer', 'Store', 'Status', 'Items', 'Total Amount', 'Delivery Fee', 'Payment Method', 'Date', 'Rider']] }),
      });
      await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/Daily Summary!A1:G1?valueInputOption=RAW', {
        method: 'PUT', headers,
        body: JSON.stringify({ values: [['Date', 'Total Orders', 'Delivered', 'Cancelled', 'Total Revenue', 'Delivery Fees', 'Avg Order Value']] }),
      });

      await base44.asServiceRole.entities.Setting.create({ key: "google_sheets_id", value: spreadsheetId, label: "Google Sheets Spreadsheet ID", category: "integrations" });
    }

    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 500);
    const orderRows = orders.map(o => [
      o.order_number || '', o.customer_name || '', o.store_name || '', o.status || '',
      o.items || '', o.total_amount || 0, o.delivery_fee || 0, o.payment_method || '',
      new Date(o.created_date).toLocaleString(), o.rider_name || '',
    ]);

    await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/Orders!A2:J?valueInputOption=RAW', {
      method: 'PUT', headers,
      body: JSON.stringify({ values: orderRows.length > 0 ? orderRows : [['']] }),
    });

    const dailyMap = {};
    orders.forEach(o => {
      const date = new Date(o.created_date).toLocaleDateString('en-US');
      if (!dailyMap[date]) dailyMap[date] = { total: 0, delivered: 0, cancelled: 0, revenue: 0, deliveryFees: 0 };
      dailyMap[date].total++;
      if (o.status === 'delivered') { dailyMap[date].delivered++; dailyMap[date].revenue += o.total_amount || 0; dailyMap[date].deliveryFees += o.delivery_fee || 0; }
      if (o.status === 'cancelled' || o.status === 'rejected') dailyMap[date].cancelled++;
    });
    const summaryRows = Object.entries(dailyMap).map(([date, d]) => [
      date, d.total, d.delivered, d.cancelled, d.revenue, d.deliveryFees,
      d.delivered > 0 ? Math.round(d.revenue / d.delivered) : 0,
    ]);

    await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/Daily Summary!A2:G?valueInputOption=RAW', {
      method: 'PUT', headers,
      body: JSON.stringify({ values: summaryRows.length > 0 ? summaryRows : [['']] }),
    });

    return Response.json({ success: true, spreadsheetId, ordersSynced: orders.length, daysSynced: summaryRows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});