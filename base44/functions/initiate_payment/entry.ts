import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id, amount, payment_method, order_number } = await req.json();
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    if (payment_method === 'esewa') {
      const merchantCode = Deno.env.get("ESEWA_MERCHANT_CODE");
      if (!merchantCode) return Response.json({ error: 'eSewa payment gateway not configured. Please contact admin to set up ESEWA_MERCHANT_CODE.' }, { status: 503 });

      const paymentId = "PAY" + Date.now();
      await base44.entities.Payment.create({
        payment_id: paymentId,
        order_id,
        order_number,
        customer_id: user.id,
        customer_name: user.full_name || user.email,
        amount,
        payment_method: "esewa",
        payment_status: "processing",
        payment_date: new Date().toISOString(),
      });

      const params = new URLSearchParams({
        amt: String(amount),
        pdc: "0",
        pid: paymentId,
        scd: merchantCode,
        su: origin + '/checkout?status=success&payment_id=' + paymentId + '&method=esewa',
        fu: origin + '/checkout?status=failure&payment_id=' + paymentId + '&method=esewa',
      });

      return Response.json({ payment_url: 'https://esewa.com.np/epay/main?' + params.toString(), payment_id: paymentId });
    }

    if (payment_method === 'khalti') {
      const secretKey = Deno.env.get("KHALTI_SECRET_KEY");
      if (!secretKey) return Response.json({ error: 'Khalti payment gateway not configured. Please contact admin to set up KHALTI_SECRET_KEY.' }, { status: 503 });

      const paymentId = "PAY" + Date.now();
      await base44.entities.Payment.create({
        payment_id: paymentId,
        order_id,
        order_number,
        customer_id: user.id,
        customer_name: user.full_name || user.email,
        amount: amount * 100,
        payment_method: "khalti",
        payment_status: "processing",
        payment_date: new Date().toISOString(),
      });

      const res = await fetch('https://api.khalti.com/api/v2/epayment/initiate/', {
        method: 'POST',
        headers: { 'Authorization': 'Key ' + secretKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          return_url: origin + '/checkout?status=success&payment_id=' + paymentId + '&method=khalti',
          website_url: origin,
          amount: amount * 100,
          purchase_order_id: order_number || paymentId,
          purchase_order_name: 'Order ' + (order_number || paymentId),
        }),
      });
      const data = await res.json();

      return Response.json({ payment_url: data.payment_url, pidx: data.pidx, payment_id: paymentId });
    }

    if (payment_method === 'fonepay') {
      const merchantId = Deno.env.get("FONEPAY_MERCHANT_ID");
      const fonepayPassword = Deno.env.get("FONEPAY_PASSWORD");
      if (!merchantId) return Response.json({ error: 'Fonepay payment gateway not configured. Please contact admin to set up FONEPAY_MERCHANT_ID.' }, { status: 503 });

      const paymentId = "PAY" + Date.now();
      await base44.entities.Payment.create({
        payment_id: paymentId,
        order_id,
        order_number,
        customer_id: user.id,
        customer_name: user.full_name || user.email,
        amount,
        payment_method: "fonepay",
        payment_status: "processing",
        payment_date: new Date().toISOString(),
      });

      const params = new URLSearchParams({
        DA: merchantId,
        AMT: String(amount),
        CRN: 'NPR',
        R1: paymentId,
        R2: order_number || paymentId,
        RU: origin + '/checkout?status=success&payment_id=' + paymentId + '&method=fonepay',
        PRN: paymentId,
      });

      return Response.json({ payment_url: 'https://clientapi.fonepay.com/api/npStore/qr/redirect?' + params.toString(), payment_id: paymentId });
    }

    return Response.json({ error: 'Unsupported payment method' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});