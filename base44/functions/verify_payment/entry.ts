import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { payment_id, payment_method, transaction_reference, order_data } = await req.json();

    const payments = await base44.entities.Payment.filter({ payment_id });
    if (payments.length === 0) return Response.json({ error: 'Payment not found' }, { status: 404 });
    const payment = payments[0];

    if (payment_method === 'esewa') {
      const merchantCode = Deno.env.get("ESEWA_MERCHANT_CODE");
      if (!merchantCode) return Response.json({ error: 'eSewa not configured' }, { status: 503 });

      const params = new URLSearchParams({
        amt: String(payment.amount),
        rid: transaction_reference || '',
        pid: payment_id,
        scd: merchantCode,
      });

      const res = await fetch('https://esewa.com.np/epay/transrec', { method: 'POST', body: params });
      const text = await res.text();

      if (text.includes('Success')) {
        await base44.entities.Payment.update(payment.id, { payment_status: 'successful', transaction_reference, gateway_response: text });
        if (order_data) {
          const orders = Array.isArray(order_data) ? order_data : [order_data];
          const created = await base44.entities.Order.bulkCreate(orders);
          const firstOrder = Array.isArray(created) ? created[0] : created;
          await base44.entities.Transaction.create({
            transaction_id: 'TXN' + Date.now(),
            user_id: user.id, user_name: user.full_name || user.email, user_type: 'customer',
            order_id: firstOrder.id, order_number: firstOrder.order_number, type: 'payment',
            amount: payment.amount, status: 'completed', description: 'Payment for ' + firstOrder.order_number, payment_method: 'esewa',
          });
          return Response.json({ verified: true, order_id: firstOrder.id });
        }
        return Response.json({ verified: true });
      } else {
        await base44.entities.Payment.update(payment.id, { payment_status: 'failed', gateway_response: text });
        return Response.json({ verified: false, error: 'Payment verification failed' });
      }
    }

    if (payment_method === 'khalti') {
      const secretKey = Deno.env.get("KHALTI_SECRET_KEY");
      if (!secretKey) return Response.json({ error: 'Khalti not configured' }, { status: 503 });

      const res = await fetch('https://api.khalti.com/api/v2/epayment/lookup/', {
        method: 'POST',
        headers: { 'Authorization': 'Key ' + secretKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pidx: transaction_reference }),
      });
      const data = await res.json();

      if (data.status === 'Completed') {
        await base44.entities.Payment.update(payment.id, { payment_status: 'successful', transaction_reference, gateway_response: JSON.stringify(data) });
        if (order_data) {
          const orders = Array.isArray(order_data) ? order_data : [order_data];
          const created = await base44.entities.Order.bulkCreate(orders);
          const firstOrder = Array.isArray(created) ? created[0] : created;
          await base44.entities.Transaction.create({
            transaction_id: 'TXN' + Date.now(),
            user_id: user.id, user_name: user.full_name || user.email, user_type: 'customer',
            order_id: firstOrder.id, order_number: firstOrder.order_number, type: 'payment',
            amount: payment.amount / 100, status: 'completed', description: 'Payment for ' + firstOrder.order_number, payment_method: 'khalti',
          });
          return Response.json({ verified: true, order_id: firstOrder.id });
        }
        return Response.json({ verified: true });
      } else {
        await base44.entities.Payment.update(payment.id, { payment_status: 'failed', gateway_response: JSON.stringify(data) });
        return Response.json({ verified: false, error: 'Payment not completed' });
      }
    }

    return Response.json({ error: 'Unsupported method' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});