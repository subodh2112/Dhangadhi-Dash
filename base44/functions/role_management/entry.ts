import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'switch_role') {
      return await handleSwitchRole(base44, user, body);
    }

    // All other actions are admin-only
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    if (action === 'promote') return await handlePromote(base44, body, user);
    if (action === 'remove_role') return await handleRemoveRole(base44, body, user);
    if (action === 'suspend_role') return await handleSuspendRole(base44, body, user);

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function genCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix + '-' + code;
}

function parseRoles(targetUser) {
  if (targetUser.roles && targetUser.roles.trim()) {
    return targetUser.roles.split(',').map(r => r.trim()).filter(Boolean);
  }
  return [targetUser.role || 'user'];
}

function parseSuspended(targetUser) {
  if (targetUser.suspended_roles && targetUser.suspended_roles.trim()) {
    return targetUser.suspended_roles.split(',').map(r => r.trim()).filter(Boolean);
  }
  return [];
}

function toPlatform(role) {
  return role === 'customer' ? 'user' : role;
}

async function handlePromote(base44, body, adminUser) {
  const { userId, targetRole, storeName, storeCategory } = body;
  if (!userId || !targetRole) {
    return Response.json({ error: 'Missing userId or targetRole' }, { status: 400 });
  }
  if (!['merchant', 'rider'].includes(targetRole)) {
    return Response.json({ error: 'Invalid target role' }, { status: 400 });
  }

  const users = await base44.asServiceRole.entities.User.filter({ id: userId });
  const targetUser = users[0];
  if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

  let roles = parseRoles(targetUser);
  const platformTarget = toPlatform(targetRole);

  if (roles.includes(platformTarget)) {
    return Response.json({ error: 'User already has ' + targetRole + ' role' }, { status: 400 });
  }

  const newRoles = [...roles, platformTarget];
  const updates = { roles: newRoles.join(',') };

  if (targetRole === 'merchant') {
    const merchantCode = genCode('DD-MCH');
    const store = await base44.asServiceRole.entities.Store.create({
      name: storeName || ((targetUser.full_name || 'New') + ' Store'),
      merchant_id: targetUser.id,
      merchant_code: merchantCode,
      category: storeCategory || 'restaurant',
      owner_name: targetUser.full_name || '',
      owner_email: targetUser.email || '',
      is_verified: false,
      is_open: false,
    });
    updates.merchant_id = store.id;
    updates.merchant_code = merchantCode;
    updates.store_id = store.id;

    if (targetUser.role === 'user' || roles.length === 1) {
      updates.role = 'merchant';
    }

    await base44.asServiceRole.entities.User.update(userId, updates);

    await logAction(base44, adminUser, 'Promoted user to Merchant: ' + (targetUser.email || targetUser.id), 'users', 'Merchant code: ' + merchantCode + ', Store: ' + store.name);

    return Response.json({ success: true, merchantCode, storeId: store.id, storeName: store.name });
  }

  if (targetRole === 'rider') {
    const riderCode = genCode('DD-RDR');
    const rider = await base44.asServiceRole.entities.Rider.create({
      name: targetUser.full_name || 'Rider',
      email: targetUser.email || '',
      rider_code: riderCode,
      user_id: targetUser.id,
      status: 'offline',
      kyc_status: 'pending',
      vehicle_type: 'motorcycle',
    });
    updates.rider_id = rider.id;
    updates.rider_code = riderCode;

    if (targetUser.role === 'user' || roles.length === 1) {
      updates.role = 'rider';
    }

    await base44.asServiceRole.entities.User.update(userId, updates);

    await logAction(base44, adminUser, 'Promoted user to Rider: ' + (targetUser.email || targetUser.id), 'users', 'Rider code: ' + riderCode);

    return Response.json({ success: true, riderCode, riderId: rider.id });
  }
}

async function handleRemoveRole(base44, body, adminUser) {
  const { userId, role } = body;
  if (!userId || !role) {
    return Response.json({ error: 'Missing userId or role' }, { status: 400 });
  }
  const platformRole = toPlatform(role);

  const users = await base44.asServiceRole.entities.User.filter({ id: userId });
  const targetUser = users[0];
  if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

  let roles = parseRoles(targetUser);
  roles = roles.filter(r => r !== platformRole);

  if (roles.length === 0) {
    return Response.json({ error: 'Cannot remove the last role' }, { status: 400 });
  }

  const updates = { roles: roles.join(',') };
  if (targetUser.role === platformRole) {
    updates.role = roles[0];
  }

  await base44.asServiceRole.entities.User.update(userId, updates);

  await logAction(base44, adminUser, 'Removed ' + role + ' role from: ' + (targetUser.email || targetUser.id), 'users');

  return Response.json({ success: true });
}

async function handleSuspendRole(base44, body, adminUser) {
  const { userId, role, suspend } = body;
  if (!userId || !role) {
    return Response.json({ error: 'Missing userId or role' }, { status: 400 });
  }
  const platformRole = toPlatform(role);

  const users = await base44.asServiceRole.entities.User.filter({ id: userId });
  const targetUser = users[0];
  if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

  let suspended = parseSuspended(targetUser);
  if (suspend) {
    if (!suspended.includes(platformRole)) suspended.push(platformRole);
  } else {
    suspended = suspended.filter(r => r !== platformRole);
  }

  const updates = { suspended_roles: suspended.join(',') };

  if (suspend && targetUser.role === platformRole) {
    let roles = parseRoles(targetUser);
    const available = roles.filter(r => !suspended.includes(r));
    if (available.length > 0) updates.role = available[0];
  }

  await base44.asServiceRole.entities.User.update(userId, updates);

  await logAction(base44, adminUser, (suspend ? 'Suspended' : 'Reinstated') + ' ' + role + ' role for: ' + (targetUser.email || targetUser.id), 'users', null, suspend ? 'warning' : 'info');

  return Response.json({ success: true });
}

async function handleSwitchRole(base44, user, body) {
  const { role } = body;
  if (!role) return Response.json({ error: 'Missing role' }, { status: 400 });

  const platformRole = toPlatform(role);
  const validRoles = ['user', 'merchant', 'rider', 'admin'];
  if (!validRoles.includes(platformRole)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }

  let roles = parseRoles(user);
  const hasRole = roles.includes(platformRole);
  if (!hasRole) {
    return Response.json({ error: 'You do not have this role' }, { status: 403 });
  }

  await base44.asServiceRole.entities.User.update(user.id, { role: platformRole });

  return Response.json({ success: true });
}

async function logAction(base44, adminUser, action, module, details, severity) {
  try {
    await base44.asServiceRole.entities.AdminActivityLog.create({
      staff_id: adminUser.id,
      staff_name: adminUser.full_name || adminUser.email,
      staff_role: adminUser.staff_role || 'super_admin',
      action: action,
      module: module || 'system',
      details: details || '',
      severity: severity || 'info',
    });
  } catch {}
}