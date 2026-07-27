import { base44 } from "@/api/base44Client";

export const getOrCreateWallet = async (merchantId, storeId, storeName) => {
  try {
    const wallets = await base44.entities.MerchantWallet.filter({ merchant_id: merchantId });
    if (wallets.length > 0) return wallets[0];
    return await base44.entities.MerchantWallet.create({
      merchant_id: merchantId,
      store_id: storeId || "",
      store_name: storeName || "",
      total_sales: 0,
      commission_amount: 0,
      available_balance: 0,
      withdrawn_amount: 0,
      commission_rate: 0.1,
      last_updated: new Date().toISOString(),
      bank_linked: false,
    });
  } catch { return null; }
};

export const creditEarnings = async (order) => {
  try {
    if (!order.merchant_id || order.status !== "delivered") return;
    const wallet = await getOrCreateWallet(order.merchant_id, order.store_id, order.store_name);
    if (!wallet) return;
    const orderTotal = order.total_amount || 0;
    const commissionRate = wallet.commission_rate || 0.1;
    const commission = Math.round(orderTotal * commissionRate);
    const netEarnings = orderTotal - commission;
    await base44.entities.MerchantWallet.update(wallet.id, {
      total_sales: (wallet.total_sales || 0) + orderTotal,
      commission_amount: (wallet.commission_amount || 0) + commission,
      available_balance: (wallet.available_balance || 0) + netEarnings,
      last_updated: new Date().toISOString(),
    });
  } catch {}
};

export const linkBankAccount = async (walletId, { bank_name, bank_account_holder, bank_account_number, bank_branch }) => {
  try {
    const updated = await base44.entities.MerchantWallet.update(walletId, {
      bank_name,
      bank_account_holder,
      bank_account_number,
      bank_branch: bank_branch || "",
      bank_linked: true,
      last_updated: new Date().toISOString(),
    });
    return { success: true, wallet: updated };
  } catch (e) { return { success: false, error: e.message }; }
};

export const requestWithdrawal = async (merchantId, storeId, storeName, amount, paymentMethod, accountDetails) => {
  try {
    const wallet = await getOrCreateWallet(merchantId, storeId, storeName);
    if (!wallet || (wallet.available_balance || 0) < amount) return { success: false, error: "Insufficient balance" };
    const withdrawal = await base44.entities.MerchantWithdrawal.create({
      merchant_id: merchantId,
      store_id: storeId || "",
      store_name: storeName || "",
      amount,
      payment_method: paymentMethod,
      account_details: accountDetails || "",
      status: "pending",
      requested_date: new Date().toISOString(),
    });
    await base44.entities.MerchantWallet.update(wallet.id, {
      available_balance: (wallet.available_balance || 0) - amount,
    });
    return { success: true, withdrawal };
  } catch (e) { return { success: false, error: e.message }; }
};

export const exportCSV = (data, filename) => {
  const csv = data.map(row => row.map(cell => '"' + String(cell || '').replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};