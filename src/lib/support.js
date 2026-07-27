import { base44 } from "@/api/base44Client";
import { logAdminAction } from "@/lib/adminLog";

export const createTicket = async (user, userType, category, subject, description, priority = "medium", attachments = "", relatedOrderId = "") => {
  try {
    const ticket = await base44.entities.SupportTicket.create({
      ticket_id: "TKT" + Date.now(),
      user_id: user.id,
      user_name: user.full_name || user.email || "User",
      user_type: userType,
      category,
      subject,
      description,
      attachments,
      priority,
      status: "open",
      related_order_id: relatedOrderId,
    });
    await base44.entities.Notification.create({
      recipient_type: "admin",
      title: "New Support Ticket",
      message: subject + " — " + (user.full_name || user.email),
      type: "support_ticket",
      related_order_id: ticket.id,
    }).catch(() => {});
    return { success: true, ticket };
  } catch (e) { return { success: false, error: e.message }; }
};

export const createComplaint = async (user, order, complaintType, description, photoUrls = "") => {
  try {
    const complaint = await base44.entities.Complaint.create({
      complaint_id: "CMP" + Date.now(),
      order_id: order?.id || "",
      order_number: order?.order_number || "",
      customer_id: user.id,
      customer_name: user.full_name || user.email,
      store_name: order?.store_name || "",
      complaint_type: complaintType,
      description,
      photo_urls: photoUrls,
      status: "submitted",
    });
    return { success: true, complaint };
  } catch (e) { return { success: false, error: e.message }; }
};

export const createMerchantDispute = async (user, order, disputeType, description, evidenceUrls = "") => {
  try {
    const dispute = await base44.entities.MerchantDispute.create({
      dispute_id: "DSP" + Date.now(),
      order_id: order?.id || "",
      order_number: order?.order_number || "",
      merchant_id: user.id,
      store_name: order?.store_name || "",
      dispute_type: disputeType,
      description,
      evidence_urls: evidenceUrls,
      status: "filed",
    });
    return { success: true, dispute };
  } catch (e) { return { success: false, error: e.message }; }
};

export const createRiderIssue = async (user, order, issueType, description) => {
  try {
    const issue = await base44.entities.RiderIssue.create({
      issue_id: "RIS" + Date.now(),
      order_id: order?.id || "",
      order_number: order?.order_number || "",
      rider_id: user.id,
      rider_name: user.full_name || user.email,
      issue_type: issueType,
      description,
      status: "reported",
    });
    return { success: true, issue };
  } catch (e) { return { success: false, error: e.message }; }
};

export const triggerEmergency = async (user, userType, lat, lng, orderId = "", message = "") => {
  try {
    const alert = await base44.entities.EmergencyAlert.create({
      user_id: user.id,
      user_name: user.full_name || user.email,
      user_type: userType,
      latitude: lat,
      longitude: lng,
      order_id: orderId,
      message: message || "Emergency assistance needed",
      status: "active",
    });
    const contacts = await base44.entities.EmergencyContact.filter({ user_id: user.id }).catch(() => []);
    await base44.entities.Notification.create({
      recipient_type: "admin",
      title: "EMERGENCY ALERT",
      message: (user.full_name || user.email) + " triggered emergency help. Location: " + lat + ", " + lng,
      type: "emergency",
      related_order_id: orderId,
    }).catch(() => {});
    return { success: true, alert, contacts };
  } catch (e) { return { success: false, error: e.message }; }
};

export const sendSupportMessage = async (ticketId, senderId, senderName, senderType, message, imageUrl = "") => {
  try {
    const msg = await base44.entities.SupportChatMessage.create({
      ticket_id: ticketId,
      sender_id: senderId,
      sender_name: senderName,
      sender_type: senderType,
      message,
      image_url: imageUrl,
      is_read: false,
    });
    return { success: true, message: msg };
  } catch (e) { return { success: false, error: e.message }; }
};

export const createFraudReport = async (reporter, reportedUserId, reportedUserName, userType, fraudType, reason, evidence = "") => {
  try {
    const report = await base44.entities.FraudReport.create({
      reported_user_id: reportedUserId,
      reported_user_name: reportedUserName,
      reporter_id: reporter.id,
      reporter_name: reporter.full_name || reporter.email,
      user_type: userType,
      fraud_type: fraudType,
      reason,
      evidence,
      status: "flagged",
    });
    return { success: true, report };
  } catch (e) { return { success: false, error: e.message }; }
};

export const markFAQHelpful = async (faqId, isHelpful) => {
  try {
    const faqs = await base44.entities.FAQ.filter({ id: faqId });
    if (faqs.length === 0) return;
    const faq = faqs[0];
    const field = isHelpful ? "helpful_count" : "not_helpful_count";
    await base44.entities.FAQ.update(faqId, { [field]: (faq[field] || 0) + 1 });
  } catch {}
};

export const resolveTicket = async (ticketId, adminId, resolution) => {
  try {
    const ticket = await base44.entities.SupportTicket.update(ticketId, {
      status: "resolved",
      admin_reply: resolution,
      resolved_at: new Date().toISOString(),
      assigned_agent_id: adminId,
    });
    // Notify the customer that their ticket was resolved
    const fullTicket = await base44.entities.SupportTicket.filter({ id: ticketId }).catch(() => []);
    if (fullTicket[0]?.user_id) {
      await base44.entities.Notification.create({
        recipient_type: fullTicket[0].user_type || "customer",
        recipient_user_id: fullTicket[0].user_id,
        title: "Ticket Resolved",
        message: `Your ticket "${fullTicket[0].subject}" has been resolved.`,
        type: "support_update",
        related_order_id: ticketId,
      }).catch(() => {});
    }
    await logAdminAction("Resolved support ticket", "SupportTicket", ticketId, resolution);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const buildOrderContext = (order) => {
  if (!order) return "";
  return JSON.stringify({
    order_number: order.order_number || "",
    customer_name: order.customer_name || "",
    store_name: order.store_name || "",
    rider_name: order.rider_name || "",
    status: order.status || "",
    total_amount: order.total_amount || 0,
    payment_status: order.payment_status || "",
  });
};

export const createSupportTicketWithOrder = async (user, userType, category, subject, description, priority, order) => {
  try {
    const ticket = await base44.entities.SupportTicket.create({
      ticket_id: "TKT" + Date.now(),
      user_id: user.id,
      user_name: user.full_name || user.email || "User",
      user_email: user.email || "",
      user_type: userType,
      category,
      subject,
      description,
      priority,
      status: "open",
      related_order_id: order?.id || "",
      order_context: buildOrderContext(order),
    });
    await base44.entities.Notification.create({
      recipient_type: "admin",
      title: "New Support Ticket",
      message: subject + " — " + (user.full_name || user.email),
      type: "support_ticket",
      related_order_id: ticket.id,
    }).catch(() => {});
    return { success: true, ticket };
  } catch (e) { return { success: false, error: e.message }; }
};

// ---- Support Calls (VoIP queue) ----

export const startSupportCall = async (user, userType, orderContext = "") => {
  try {
    const queued = await base44.entities.SupportCall.filter({ status: "queued" }).catch(() => []);
    const position = queued.length + 1;
    const estimatedWait = position * 45; // ~45s per caller ahead
    const call = await base44.entities.SupportCall.create({
      call_id: "CALL" + Date.now(),
      caller_id: user.id,
      caller_name: user.full_name || user.email || "User",
      caller_type: userType,
      status: "ringing",
      queue_position: position,
      estimated_wait_seconds: estimatedWait,
      started_at: new Date().toISOString(),
      order_context: orderContext,
      call_type: "incoming",
    });
    await base44.entities.Notification.create({
      recipient_type: "admin",
      title: "Incoming Support Call",
      message: (user.full_name || user.email) + " is calling support (queue #" + position + ").",
      type: "support_call",
      related_order_id: call.id,
    }).catch(() => {});
    return { success: true, call };
  } catch (e) { return { success: false, error: e.message }; }
};

export const answerSupportCall = async (callId, agent) => {
  try {
    await base44.entities.SupportCall.update(callId, {
      status: "connecting",
      agent_id: agent.id,
      agent_name: agent.full_name || agent.email || "Support Agent",
    });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const endSupportCall = async (callId, endReason = "ended") => {
  try {
    const calls = await base44.entities.SupportCall.filter({ id: callId }).catch(() => []);
    const call = calls[0];
    const duration = call?.connected_at ? Math.round((Date.now() - new Date(call.connected_at).getTime()) / 1000) : 0;
    await base44.entities.SupportCall.update(callId, {
      status: "ended",
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      end_reason: endReason,
    });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const markCallMissed = async (callId) => {
  try {
    await base44.entities.SupportCall.update(callId, { status: "missed", ended_at: new Date().toISOString() });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ---- Callback requests ----

export const requestCallback = async (user, userType, preferredTime, note, orderContext = "") => {
  try {
    const call = await base44.entities.SupportCall.create({
      call_id: "CB" + Date.now(),
      caller_id: user.id,
      caller_name: user.full_name || user.email || "User",
      caller_type: userType,
      status: "queued",
      call_type: "callback",
      scheduled_time: preferredTime,
      callback_note: note,
      order_context: orderContext,
      started_at: new Date().toISOString(),
    });
    await base44.entities.Notification.create({
      recipient_type: "admin",
      title: "Callback Requested",
      message: (user.full_name || user.email) + " requested a callback at " + preferredTime + ".",
      type: "callback_request",
      related_order_id: call.id,
    }).catch(() => {});
    return { success: true, call };
  } catch (e) { return { success: false, error: e.message }; }
};

// ---- Ticket escalation & assignment ----

export const escalateTicket = async (ticketId, agentId) => {
  try {
    await base44.entities.SupportTicket.update(ticketId, { escalated: true, escalated_to_admin: true });
    const tickets = await base44.entities.SupportTicket.filter({ id: ticketId }).catch(() => []);
    if (tickets[0]?.user_id) {
      await base44.entities.Notification.create({
        recipient_type: tickets[0].user_type || "customer",
        recipient_user_id: tickets[0].user_id,
        title: "Ticket Escalated",
        message: `Your ticket "${tickets[0].subject}" has been escalated to the admin team.`,
        type: "support_update",
        related_order_id: ticketId,
      }).catch(() => {});
    }
    await logAdminAction("Escalated ticket", "SupportTicket", ticketId, "Escalated to admin");
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const assignTicket = async (ticketId, agentId, agentName) => {
  try {
    await base44.entities.SupportTicket.update(ticketId, { assigned_agent_id: agentId, status: "in_progress" });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ---- Read receipts ----

export const markMessagesRead = async (ticketId, readerId) => {
  try {
    const msgs = await base44.entities.SupportChatMessage.filter({ ticket_id: ticketId }, "created_date", 200);
    const unread = msgs.filter((m) => !m.is_read && m.sender_id !== readerId);
    for (const m of unread) {
      await base44.entities.SupportChatMessage.update(m.id, { is_read: true, read_at: new Date().toISOString() });
    }
    return { success: true };
  } catch { return { success: false }; }
};

// ---- Send support chat message (with optional file) ----

export const sendSupportChatMessage = async (ticketId, senderId, senderName, senderType, message, opts = {}) => {
  try {
    const msg = await base44.entities.SupportChatMessage.create({
      ticket_id: ticketId,
      sender_id: senderId,
      sender_name: senderName,
      sender_type: senderType,
      message: message || "",
      image_url: opts.imageUrl || "",
      file_url: opts.fileUrl || "",
      file_name: opts.fileName || "",
      message_type: opts.messageType || "text",
      is_read: false,
    });
    // Notify ticket owner on agent/admin reply
    if (senderType !== "user") {
      const tickets = await base44.entities.SupportTicket.filter({ id: ticketId }).catch(() => []);
      if (tickets[0]?.user_id) {
        await base44.entities.Notification.create({
          recipient_type: tickets[0].user_type || "customer",
          recipient_user_id: tickets[0].user_id,
          title: "Support replied",
          message: "You have a new message on ticket: " + (tickets[0].subject || ""),
          type: "support_reply",
          related_order_id: ticketId,
        }).catch(() => {});
      }
    }
    return { success: true, message: msg };
  } catch (e) { return { success: false, error: e.message }; }
};