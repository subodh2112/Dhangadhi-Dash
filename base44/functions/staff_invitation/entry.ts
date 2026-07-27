import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, token, staff_code } = body;

    if (!action) return Response.json({ error: 'Action required' }, { status: 400 });

    // --- CREATE ACTION (admin creates staff with code + password) ---
    if (action === 'create') {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { email, full_name, staff_role, password } = body;
      if (!email || !full_name || !staff_role || !password) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Generate unique staff code
      const code = 'DD-STAFF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const inviteToken = crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

      // Look up role display name from AdminRole or use staff_role directly
      let roleDisplayName = staff_role;
      let department = 'analytics';
      try {
        const roles = await base44.asServiceRole.entities.AdminRole.filter({ role_name: staff_role });
        if (roles[0]) {
          roleDisplayName = roles[0].display_name;
          department = roles[0].department || department;
        }
      } catch {}

      const invitation = await base44.asServiceRole.entities.StaffInvitation.create({
        token: inviteToken,
        staff_code: code,
        password: password,
        email: email.toLowerCase().trim(),
        full_name: full_name,
        staff_role: staff_role,
        role_display_name: roleDisplayName,
        department: department,
        invited_by_id: user.id,
        invited_by_name: user.full_name || user.email,
        status: 'pending',
        expires_at: expiresAt,
      });

      await base44.asServiceRole.entities.AuditLog.create({
        action: 'Staff account created: ' + full_name + ' (' + email + ') as ' + roleDisplayName + ' [Code: ' + code + ']',
        target_type: 'staff_invitation',
        target_name: email,
        details: 'Role: ' + staff_role + ', Created by: ' + (user.full_name || user.email),
      });

      return Response.json({
        success: true,
        staff_code: code,
        invitation_id: invitation.id,
      });
    }

    // --- LOOKUP CODE ACTION (public — maps staff_code to email for login/activation) ---
    if (action === 'lookup_code') {
      if (!staff_code) return Response.json({ error: 'Staff code required' }, { status: 400 });

      const invitations = await base44.asServiceRole.entities.StaffInvitation.filter({ staff_code: staff_code.trim().toUpperCase() });
      const invitation = invitations[0];

      if (!invitation) {
        return Response.json({ error: 'Invalid staff code', code: 'INVALID' }, { status: 404 });
      }
      if (invitation.status === 'revoked') {
        return Response.json({ error: 'This staff code has been revoked', code: 'REVOKED' }, { status: 410 });
      }

      // Check expiry
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        return Response.json({ error: 'This staff code has expired. Contact your administrator.', code: 'EXPIRED' }, { status: 410 });
      }

      return Response.json({
        valid: true,
        email: invitation.email,
        token: invitation.token,
        full_name: invitation.full_name,
        staff_role: invitation.staff_role,
        role_display_name: invitation.role_display_name,
        status: invitation.status,
      });
    }

    // --- VALIDATE / ACCEPT (token-based, for backwards compat) ---
    if (!token) return Response.json({ error: 'Token or staff_code required' }, { status: 400 });

    const invitations = await base44.asServiceRole.entities.StaffInvitation.filter({ token });
    const invitation = invitations[0];

    if (!invitation) {
      return Response.json({ error: 'Invalid invitation token', code: 'INVALID' }, { status: 404 });
    }

    if (invitation.status === 'accepted') {
      return Response.json({ error: 'This invitation has already been used.', code: 'USED' }, { status: 410 });
    }
    if (invitation.status === 'revoked') {
      return Response.json({ error: 'This invitation has been revoked by an administrator.', code: 'REVOKED' }, { status: 410 });
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < now) {
      if (invitation.status !== 'expired') {
        await base44.asServiceRole.entities.StaffInvitation.update(invitation.id, { status: 'expired' });
      }
      return Response.json({ error: 'This invitation has expired. Please request a new one.', code: 'EXPIRED' }, { status: 410 });
    }

    if (action === 'validate') {
      if (invitation.status === 'pending') {
        await base44.asServiceRole.entities.StaffInvitation.update(invitation.id, {
          status: 'opened',
          opened_at: now.toISOString(),
        });
      }
      return Response.json({
        valid: true,
        email: invitation.email,
        full_name: invitation.full_name,
        staff_role: invitation.staff_role,
        role_display_name: invitation.role_display_name,
        department: invitation.department,
        staff_code: invitation.staff_code,
        invited_by_name: invitation.invited_by_name,
        expires_at: invitation.expires_at,
      });
    }

    if (action === 'accept') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

      if (invitation.email !== user.email) {
        return Response.json({
          error: 'Email mismatch. The email on your account does not match this invitation.',
          code: 'EMAIL_MISMATCH',
        }, { status: 403 });
      }

      const { full_name } = body;
      await base44.asServiceRole.entities.User.update(user.id, {
        role: 'admin',
        staff_role: invitation.staff_role,
        department: invitation.department,
        staff_status: 'active',
        full_name: full_name || invitation.full_name || user.full_name,
      });

      await base44.asServiceRole.entities.StaffInvitation.update(invitation.id, {
        status: 'accepted',
        accepted_at: now.toISOString(),
        accepted_user_id: user.id,
      });

      await base44.asServiceRole.entities.AuditLog.create({
        action: 'Staff invitation accepted: ' + invitation.full_name + ' (' + invitation.email + ') as ' + invitation.role_display_name,
        target_type: 'staff_invitation',
        target_name: invitation.email,
        details: 'Role: ' + invitation.staff_role + ', Department: ' + invitation.department + ', Code: ' + invitation.staff_code,
      });

      return Response.json({ success: true, redirect: '/' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});