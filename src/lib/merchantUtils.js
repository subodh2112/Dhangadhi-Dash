import { base44 } from "@/api/base44Client";

// Generate merchant code: DDM000001
export function generateMerchantCode(existingStores = [], existingApps = []) {
  let maxNum = 0;
  const check = (code) => {
    const match = (code || "").match(/DDM0*(\d+)/);
    if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
  };
  existingStores.forEach((s) => check(s.merchant_code));
  existingApps.forEach((a) => check(a.merchant_code));
  return `DDM${String(maxNum + 1).padStart(6, "0")}`;
}

// Generate store code: DDS000001
export function generateStoreCode(existingStores = []) {
  let maxNum = 0;
  for (const s of existingStores) {
    const match = (s.store_code || "").match(/DDS0*(\d+)/);
    if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
  }
  return `DDS${String(maxNum + 1).padStart(6, "0")}`;
}

// Generate username from business name: oldhouse001
export function generateUsername(businessName, existingUsernames = []) {
  const base = (businessName || "merchant").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "merchant";
  const existing = new Set(existingUsernames.filter(Boolean));
  let num = 1;
  let username = base + String(num).padStart(3, "0");
  while (existing.has(username)) {
    num++;
    username = base + String(num).padStart(3, "0");
  }
  return username;
}

// Generate strong password: Dh@2026#A82
export function generateStrongPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@#$%&*!?";
  const all = upper + lower + digits + special;
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = 0; i < 8; i++) {
    pwd.push(all[Math.floor(Math.random() * all.length)]);
  }
  return pwd.sort(() => Math.random() - 0.5).join("");
}

// Fetch existing codes for generation
export async function fetchExistingCodes() {
  const [stores, apps] = await Promise.all([
    base44.entities.Store.list("-created_date", 500).catch(() => []),
    base44.entities.MerchantApplication.filter({ applicant_type: "merchant" }, "-created_date", 200).catch(() => []),
  ]);
  return { stores, apps };
}

// Create a complete merchant account: store + user invite + link + optional email
export async function createMerchantAccount(form, codes, sendEmail) {
  const { stores, apps } = codes;
  const merchantCode = form.merchantCode || generateMerchantCode(stores, apps);
  const storeCode = form.storeCode || generateStoreCode(stores);
  const username = form.username || generateUsername(form.businessName, stores.map((s) => s.username));
  const password = form.password || generateStrongPassword();

  const store = await base44.entities.Store.create({
    name: form.storeName || form.businessName,
    category: form.category || "restaurant",
    description: form.description || "",
    address: form.storeAddress || form.address || "",
    phone: form.phone || "",
    merchant_code: merchantCode,
    store_code: storeCode,
    username,
    owner_name: form.ownerName || "",
    owner_email: form.email || "",
    pan_number: form.panNumber || "",
    business_registration_number: form.businessRegNumber || "",
    temporary_password: password,
    must_change_password: true,
    is_suspended: form.status === "suspended",
    is_open: form.status === "active",
    is_verified: true,
    opening_time: form.openingTime || "",
    closing_time: form.closingTime || "",
    latitude: form.latitude ? Number(form.latitude) : undefined,
    longitude: form.longitude ? Number(form.longitude) : undefined,
    delivery_radius: form.deliveryRadius ? Number(form.deliveryRadius) : undefined,
    delivery_fee: Number(form.deliveryFee) || 40,
    delivery_minutes: Number(form.deliveryMinutes) || 30,
    rating: 4.5,
    reviews_count: 0,
  });

  // Register the user with the temporary password so they can actually log in
  let merchantUserId = "";
  const users = await base44.entities.User.filter({ email: form.email }).catch(() => []);
  if (users.length > 0) {
    merchantUserId = users[0].id;
    await base44.entities.User.update(users[0].id, { role: "merchant", store_id: store.id }).catch(() => {});
  } else {
    // Use register (not inviteUser) so the temp password is actually set in the auth system.
    // The user will be unverified — Login.jsx handles the OTP verification flow.
    await base44.auth.register({ email: form.email, password });
    const registered = await base44.entities.User.filter({ email: form.email }).catch(() => []);
    if (registered.length > 0) {
      merchantUserId = registered[0].id;
      await base44.entities.User.update(registered[0].id, { role: "merchant", store_id: store.id }).catch(() => {});
    }
  }

  if (merchantUserId) {
    await base44.entities.Store.update(store.id, { merchant_id: merchantUserId }).catch(() => {});
  }

  if (sendEmail) {
    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: "Welcome to Dhangadhi Dash - Your Merchant Account",
      body: `Hello ${form.ownerName},\n\nYour merchant account has been created on Dhangadhi Dash.\n\nBusiness: ${form.businessName}\nLogin Email: ${form.email}\nUsername: ${username}\nTemporary Password: ${password}\nMerchant Code: ${merchantCode}\nStore Code: ${storeCode}\n\nTo log in:\n1. Go to the login page and select "Merchant"\n2. Enter your email and the temporary password above\n3. You'll receive a verification code (OTP) — enter it to verify your email\n4. After verification, you'll be logged in\n\nPlease change your password after your first login.\n\nThank you for joining Dhangadhi Dash!`,
    }).catch(() => {});
  }

  await base44.entities.AuditLog.create({
    action: "merchant_created",
    target_type: "merchant",
    target_name: form.businessName,
    details: `Created merchant ${merchantCode} with store ${storeCode} for ${form.email}`,
  }).catch(() => {});

  return { store, merchantCode, storeCode, username, password, merchantUserId };
}

// Reset merchant password: send an actual password reset email via the auth system
export async function resetMerchantPassword(storeObj) {
  // Send a real password reset email so the merchant can set a new password themselves.
  // We can't set a password directly on an existing auth account — resetPasswordRequest
  // sends a secure link that lets the merchant choose a new password.
  if (storeObj.owner_email) {
    await base44.auth.resetPasswordRequest(storeObj.owner_email);
  }

  await base44.entities.Store.update(storeObj.id, {
    must_change_password: true,
  }).catch(() => {});

  await base44.entities.AuditLog.create({
    action: "password_reset",
    target_type: "merchant",
    target_name: storeObj.name,
    details: `Sent password reset email to ${storeObj.owner_email}`,
  }).catch(() => {});

  return null; // No password to return — merchant sets their own via the reset link
}