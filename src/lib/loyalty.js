import { base44 } from "@/api/base44Client";

const POINTS_PER_RUPEE = 0.1;

const LEVELS = [
  { name: "Bronze", min: 0, next: 500 },
  { name: "Silver", min: 500, next: 1500 },
  { name: "Gold", min: 1500, next: 5000 },
  { name: "Platinum", min: 5000, next: 15000 },
  { name: "Diamond", min: 15000, next: null },
];

export const getLoyaltyLevel = (totalSpent) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalSpent >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
};

export const getOrCreateWallet = async (userId) => {
  try {
    const wallets = await base44.entities.LoyaltyWallet.filter({ user_id: userId });
    if (wallets.length > 0) return wallets[0];
    return await base44.entities.LoyaltyWallet.create({
      user_id: userId,
      total_points: 0,
      earned_points: 0,
      redeemed_points: 0,
      level: "Bronze",
      total_spent: 0,
    });
  } catch { return null; }
};

export const awardPoints = async (userId, points, amountSpent) => {
  try {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) return;
    const newEarned = (wallet.earned_points || 0) + points;
    const newTotal = (wallet.total_points || 0) + points;
    const newSpent = (wallet.total_spent || 0) + (amountSpent || 0);
    const level = getLoyaltyLevel(newSpent).name;
    await base44.entities.LoyaltyWallet.update(wallet.id, {
      total_points: newTotal,
      earned_points: newEarned,
      total_spent: newSpent,
      level,
    });
  } catch {}
};

export const redeemPoints = async (userId, points, discountValue) => {
  try {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet || wallet.total_points < points) return null;
    const newTotal = wallet.total_points - points;
    const newRedeemed = (wallet.redeemed_points || 0) + points;
    const code = "DD" + Math.random().toString(36).substring(2, 8).toUpperCase();
    await base44.entities.Coupon.create({
      code,
      description: "Redeemed " + points + " points for Rs " + discountValue + " off",
      discount_type: "fixed",
      discount_value: discountValue,
      is_active: true,
    });
    await base44.entities.LoyaltyWallet.update(wallet.id, {
      total_points: newTotal,
      redeemed_points: newRedeemed,
    });
    return code;
  } catch { return null; }
};

export const generateReferralCode = () => {
  return "DD" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const ensureReferralCode = async (user) => {
  if (user?.id && !user.referral_code) {
    const code = generateReferralCode();
    try { await base44.auth.updateMe({ referral_code: code }); return code; } catch {}
  }
  return user?.referral_code;
};

export const getReferralStats = async (userId) => {
  try {
    const referrals = await base44.entities.Referral.filter({ referrer_id: userId });
    const completed = referrals.filter((r) => r.status === "completed" || r.status === "rewarded");
    const totalEarned = completed.reduce((sum, r) => sum + (r.reward_points || 0), 0);
    return { total: referrals.length, completed: completed.length, pending: referrals.length - completed.length, pointsEarned: totalEarned, referrals };
  } catch { return { total: 0, completed: 0, pending: 0, pointsEarned: 0, referrals: [] }; }
};

export const processReferralSignup = async (referrerCode, newUserEmail, newUserId) => {
  try {
    const referrer = await base44.entities.User.filter({ referral_code: referrerCode }).catch(() => []);
    if (referrer.length === 0) return false;
    const ref = referrer[0];
    await base44.entities.Referral.create({
      referrer_id: ref.id,
      referrer_name: ref.full_name || ref.email,
      referral_code: referrerCode,
      referred_email: newUserEmail,
      referred_user_id: newUserId,
      status: "completed",
      reward_points: 50,
    });
    await awardPoints(ref.id, 50, 0);
    await awardPoints(newUserId, 50, 0);
    return true;
  } catch { return false; }
};