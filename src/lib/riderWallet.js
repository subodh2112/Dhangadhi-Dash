import { base44 } from "@/api/base44Client";

export const getOrCreateWallet = async (userId, riderName) => {
  let wallets = await base44.entities.RiderWallet.filter({ rider_id: userId }).catch(() => []);
  if (wallets.length > 0) return wallets[0];

  return await base44.entities.RiderWallet.create({
    rider_id: userId,
    rider_name: riderName,
    total_earnings: 0,
    available_balance: 0,
    withdrawn_amount: 0,
    pending_amount: 0,
    last_updated: new Date().toISOString(),
  });
};

export const creditRiderWallet = async (userId, riderName, amount) => {
  const wallet = await getOrCreateWallet(userId, riderName);
  await base44.entities.RiderWallet.update(wallet.id, {
    total_earnings: (wallet.total_earnings || 0) + amount,
    available_balance: (wallet.available_balance || 0) + amount,
    last_updated: new Date().toISOString(),
  });
  return { success: true, credited: amount };
};

export const requestWithdrawal = async (userId, riderName, amount, paymentMethod, accountDetails) => {
  const wallet = await getOrCreateWallet(userId, riderName);

  if ((wallet.available_balance || 0) < amount) {
    throw new Error("Insufficient available balance");
  }

  const existing = await base44.entities.Withdrawal.filter({ rider_id: userId, status: "pending" }).catch(() => []);
  if (existing.length > 0) {
    throw new Error("You already have a pending withdrawal request. Please wait for it to be processed.");
  }

  const withdrawal = await base44.entities.Withdrawal.create({
    rider_id: userId,
    rider_name: riderName,
    amount,
    payment_method: paymentMethod,
    account_details: accountDetails,
    status: "pending",
    requested_date: new Date().toISOString(),
  });

  await base44.entities.RiderWallet.update(wallet.id, {
    available_balance: (wallet.available_balance || 0) - amount,
    pending_amount: (wallet.pending_amount || 0) + amount,
    last_updated: new Date().toISOString(),
  });

  return withdrawal;
};

export const processWithdrawal = async (withdrawalId, action, adminNote, transactionRef) => {
  const withdrawal = await base44.entities.Withdrawal.get(withdrawalId);
  const wallet = await getOrCreateWallet(withdrawal.rider_id, withdrawal.rider_name);
  const now = new Date().toISOString();

  if (action === "reject") {
    await base44.entities.Withdrawal.update(withdrawalId, {
      status: "rejected",
      processed_date: now,
      admin_note: adminNote || "Rejected by admin",
    });
    await base44.entities.RiderWallet.update(wallet.id, {
      available_balance: (wallet.available_balance || 0) + withdrawal.amount,
      pending_amount: Math.max(0, (wallet.pending_amount || 0) - withdrawal.amount),
      last_updated: now,
    });
  } else if (action === "approve") {
    await base44.entities.Withdrawal.update(withdrawalId, {
      status: "approved",
      processed_date: now,
      admin_note: adminNote || "Approved by admin",
    });
  } else if (action === "pay") {
    await base44.entities.Withdrawal.update(withdrawalId, {
      status: "paid",
      processed_date: now,
      admin_note: adminNote || "Payment completed",
      transaction_reference: transactionRef || "TXN-" + Date.now(),
    });
    await base44.entities.RiderWallet.update(wallet.id, {
      pending_amount: Math.max(0, (wallet.pending_amount || 0) - withdrawal.amount),
      withdrawn_amount: (wallet.withdrawn_amount || 0) + withdrawal.amount,
      last_updated: now,
    });
  }

  await base44.entities.AuditLog.create({
    action: "withdrawal_" + action,
    target_type: "withdrawal",
    target_name: withdrawal.rider_name,
    details: `Withdrawal of Rs ${withdrawal.amount} for ${withdrawal.rider_name} ${action}`,
  }).catch(() => {});

  return { success: true };
};