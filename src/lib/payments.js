import { base44 } from "@/api/base44Client";
import { creditEarnings } from "@/lib/merchantWallet";
import { logAdminAction } from "@/lib/adminLog";

export const createPaymentRecord = async (order, paymentMethod, status = "pending") => {
  try {
    const payment = await base44.entities.Payment.create({
      payment_id: "PAY" + Date.now() + Math.floor(Math.random() * 1000),
      order_id: order.id,
      order_number: order.order_number,
      customer_id: order.created_by_id || "",
      customer_name: order.customer_name || "",
      amount: order.total_amount || 0,
      payment_method: paymentMethod,
      payment_status: status,
      payment_date: new Date().toISOString(),
    });
    return payment;
  } catch { return null; }
};

export const createMerchantSettlement = async (order) => {
  try {
    if (!order.merchant_id) return null;
    const grossAmount = order.total_amount || 0;
    const commissionRate = 0.1;
    const commission = Math.round(grossAmount * commissionRate);
    const netAmount = grossAmount - commission;

    const settlement = await base44.entities.MerchantSettlement.create({
      merchant_id: order.merchant_id,
      store_id: order.store_id || "",
      store_name: order.store_name || "",
      order_id: order.id,
      order_number: order.order_number || "",
      gross_amount: grossAmount,
      commission_rate: commissionRate,
      commission_amount: commission,
      net_amount: netAmount,
      settlement_status: "pending",
    });

    await base44.entities.Transaction.create({
      transaction_id: "TXN" + Date.now() + Math.floor(Math.random() * 1000),
      user_id: order.merchant_id,
      user_name: order.store_name || "",
      user_type: "merchant",
      order_id: order.id,
      order_number: order.order_number || "",
      type: "settlement",
      amount: netAmount,
      status: "pending",
      description: "Settlement for " + (order.order_number || "order"),
    });
    return settlement;
  } catch { return null; }
};

export const createRiderEarning = async (order) => {
  try {
    if (!order.rider_id) return null;
    const baseFee = order.delivery_fee || 30;
    const tip = order.rider_tip || 0;
    const distanceBonus = Math.round((order.estimated_minutes || 30) * 1.5);
    const total = baseFee + distanceBonus + tip;

    const earning = await base44.entities.RiderEarning.create({
      rider_id: order.rider_id,
      rider_name: order.rider_name || "",
      order_id: order.id,
      order_number: order.order_number || "",
      base_fee: baseFee,
      distance_bonus: distanceBonus,
      tip: tip,
      total_amount: total,
      distance_km: order.distance_km || 0,
      status: "credited",
    });

    await creditEarnings(order);

    await base44.entities.Transaction.create({
      transaction_id: "TXN" + Date.now() + Math.floor(Math.random() * 1000),
      user_id: order.rider_id,
      user_name: order.rider_name || "",
      user_type: "rider",
      order_id: order.id,
      order_number: order.order_number || "",
      type: "earning",
      amount: total,
      status: "completed",
      description: "Delivery earning for " + (order.order_number || "order"),
    });
    return earning;
  } catch { return null; }
};

export const requestRefund = async (order, reason, description) => {
  try {
    const refund = await base44.entities.Refund.create({
      order_id: order.id,
      order_number: order.order_number || "",
      customer_id: order.created_by_id || "",
      customer_name: order.customer_name || "",
      store_name: order.store_name || "",
      amount: order.total_amount || 0,
      reason,
      description: description || "",
      status: "requested",
      requested_date: new Date().toISOString(),
    });

    await base44.entities.Transaction.create({
      transaction_id: "TXN" + Date.now() + Math.floor(Math.random() * 1000),
      user_id: order.created_by_id || "",
      user_name: order.customer_name || "",
      user_type: "customer",
      order_id: order.id,
      order_number: order.order_number || "",
      type: "refund",
      amount: order.total_amount || 0,
      status: "pending",
      description: "Refund request: " + reason.replace(/_/g, " "),
    });
    return { success: true, refund };
  } catch (e) { return { success: false, error: e.message }; }
};

export const processRefund = async (refundId, status, adminNote, refundMethod) => {
  try {
    const refunds = await base44.entities.Refund.filter({ id: refundId });
    if (refunds.length === 0) return { success: false, error: "Refund not found" };
    const refund = refunds[0];
    await base44.entities.Refund.update(refundId, {
      status,
      admin_note: adminNote || "",
      refund_method: refundMethod || "",
      processed_date: new Date().toISOString(),
    });
    await logAdminAction("Processed refund", "Refund", refund.order_number, "Status: " + status + ", Amount: Rs " + refund.amount);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const recordPaymentTransaction = async (payment, user) => {
  try {
    await base44.entities.Transaction.create({
      transaction_id: "TXN" + Date.now() + Math.floor(Math.random() * 1000),
      user_id: user.id,
      user_name: user.full_name || user.email || "",
      user_type: "customer",
      order_id: payment.order_id,
      order_number: payment.order_number || "",
      type: "payment",
      amount: payment.amount,
      status: "completed",
      description: "Payment for " + (payment.order_number || "order"),
      payment_method: payment.payment_method,
    });
  } catch {}
};